/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener, ElementRef } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { finalize, filter, takeUntil,
    debounceTime, first, map, startWith } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';
import extend from 'lodash/extend';
import clone from 'lodash/clone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    UserServiceProxy,
    GetUserForEditOutput,
    UpdateUserPhoneDto,
    RoleServiceProxy,
    UpdateUserOptionsDto,
    UpdateUserRoleInput,
    ContactServiceProxy,
    PersonContactServiceProxy,
    CreateOrUpdateUserInput,
    TenantHostType,
    UpdateUserEmailDto,
    OrganizationUnitShortDto,
    CreateUserForContactInput,
    RoleListDto,
    UserRoleDto,
    ContactInfoDto
} from '@shared/service-proxies/service-proxies';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { OrganizationUnitsDialogComponent } from '@shared/common/organization-units-tree/organization-units-dialog/organization-units-dialog.component';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { ContactsService } from '../contacts.service';
import { ResetPasswordDialog } from './reset-password-dialog/reset-password-dialog.component';
import { ContactGroup, ContactStatus } from '@root/shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';
import { AppRoles } from '@shared/AppRoles';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { MessageService } from '@abp/message/message.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppStoreService } from '@app/store/app-store.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { OrganizationUnitsDialogData } from '@shared/common/organization-units-tree/organization-units-dialog/organization-units-dialog-data.interface';

@Component({
    selector: 'user-information',
    templateUrl: './user-information.component.html',
    styleUrls: ['./user-information.component.less'],
    providers: [ PhoneFormatPipe, LifecycleSubjectsService ]
})
export class UserInformationComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('emailAddress', { static: false }) emailAddressComponent: DxSelectBoxComponent;
    @ViewChild('phoneNumber', { static: false }) phoneNumberComponent: DxSelectBoxComponent;
    @ViewChild('inviteValidationGroup', { static: false }) inviteValidationComponent: DxValidationGroupComponent;
    data: any;

    readonly GENERAL_TAB_INDEX        = 0;
    readonly PERMISSIONS_TAB_INDEX    = 1;
    readonly LOGIN_ATTEMPTS_TAB_INDEX = 2;
    readonly ORG_UNITS_TAB_INDEX      = 3;

    readonly EMAIL_FIELD = 'emailAddress';
    readonly PHONE_FIELD = 'phoneNumber';
    readonly ACTIVE_FIELD = 'isActive';
    readonly TWO_FACTOR_FIELD = 'isTwoFactorEnabled';
    readonly LOCKOUT_FIELD = 'isLockoutEnabled';

    selectedTabIndex = this.GENERAL_TAB_INDEX;
    isEditAllowed = this.permissionService.isGranted(AppPermissions.AdministrationUsersEdit);
    isInviteAllowed = this.permissionService.isGranted(AppPermissions.AdministrationUsersCreate);
    changeRolesAllowed = this.permissionService.isGranted(AppPermissions.AdministrationUsersChangePermissionsAndRoles);
    phoneInplaceEdit = false;
    initialPhoneNumber: any;
    roles: any = [];
    partnerRoles: AppRoles[] = [ AppRoles.CRMPartner, AppRoles.CFOPartner ];
    checkedByDefaultRoles: AppRoles[];
    emails: any;
    phones: any;
    contactInfoData: any;
    inviteData = CreateUserForContactInput.fromJS({
        contactId: undefined,
        emailAddress: undefined,
        phoneNumber: undefined,
        password: undefined,
        sendActivationEmail: true,
        changePasswordOnNextLogin: true,
        assignedRoleNames: undefined,
        organizationUnitIds: []
    });
    inviteSetRandomPassword = true;
    showInviteUserForm$: Observable<boolean> = this.contactsService.userId$.pipe(
        startWith(null),
        map(userId => !userId && this.permissionService.isGranted(AppPermissions.AdministrationUsersCreate))
    );
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    selectedOrgUnits: number[] = [];
    dependencyChanged = false;
    masks = AppConsts.masks;
    phonePattern = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    validationRules = {
        'name': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'surname': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'phoneNumber': [{ type: 'stringLength', max: 24 }, { type: 'pattern', pattern: AppConsts.regexPatterns.phone }],
        'emailAddress': [{ type: 'pattern', pattern: this.emailRegEx, message: this.ls.l('InvalidEmailAddress') }, { type: 'required', message: this.ls.l('EmailIsRequired') }]
    };
    orgUnitsDisabled;
    dataIsloading = false;
    private readonly ident = 'UserInformation';
    @HostListener('window:resize') onResize() {
        if (this.orgUnitsDisabled = (innerWidth > 1200))
            if (this.selectedTabIndex == this.ORG_UNITS_TAB_INDEX)
                this.selectedTabIndex = this.GENERAL_TAB_INDEX;
    }

    constructor(
        private store$: Store<CrmStore.State>,
        private appStoreService: AppStoreService,
        private userService: UserServiceProxy,
        private contactsService: ContactsService,
        private personContactServiceProxy: PersonContactServiceProxy,
        private contactService: ContactServiceProxy,
        private roleServiceProxy: RoleServiceProxy,
        private permissionService: PermissionCheckerService,
        private message: MessageService,
        private loadingService: LoadingService,
        private notify: NotifyService,
        private elementRef: ElementRef,
        private lifecycleSubjectService: LifecycleSubjectsService,
        private clipboardService: ClipboardService,
        public dialog: MatDialog,
        public phoneFormatPipe: PhoneFormatPipe,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.onResize();
        this.contactInfoData = this.contactService['data'];
        this.contactsService.userSubscribe((userId: number) => {
            this.data = this.userService['data'];
            if (this.data.userId = userId)
                this.loadData();
            else {
                this.loadOrganizationUnits();
                this.getPhonesAndEmails();
            }
            this.updateToolbarOptions();
        }, this.ident);

        this.contactsService.orgUnitsSaveSubscribe(
            data => {
                this.selectedOrgUnits = data;
                if (this.data.raw) {
                    this.data.raw.memberedOrganizationUnits = [];
                    this.selectedOrgUnits.forEach((item) => {
                        this.data.raw.memberedOrganizationUnits.push(
                            this.data.raw.allOrganizationUnits.find((organizationUnit) => {
                                return organizationUnit.id === item;
                            })['code']
                        );
                    });
                    this.update();
                }
            },
            this.ident
        );
        this.loadData();
    }

    ngAfterViewInit() {
        this.contactsService.settingsDialogOpened$.pipe(
            takeUntil(this.lifecycleSubjectService.destroy$),
            debounceTime(1000)
        ).subscribe(opened => {
            this.toggleOrgUnitsDialog(opened);
        });
    }

    private loadOrganizationUnits() {
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
        this.store$.pipe(
            select(OrganizationUnitsStoreSelectors.getOrganizationUnits),
            takeUntil(this.lifecycleSubjectService.destroy$),
            filter(Boolean)
        ).subscribe((organizationUnits: OrganizationUnitShortDto[]) => {
            this.contactsService.orgUnitsUpdate({
                allOrganizationUnits: organizationUnits,
                selectedOrgUnits: []
            });
        });
    }

    private updateToolbarOptions() {
        setTimeout(() => this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.contactsService.settingsDialogOpened.value
                },
                action: () => {
                    this.contactsService.toggleSettingsDialog();
                }
            }
        }));
    }

    private updateInviteDataRoles() {
        if (this.roles) {
            this.checkedByDefaultRoles = this.isPartner()
                ? this.partnerRoles.filter((partnerRole: AppRoles) => {
                    return this.roles.map((role: RoleListDto) => role.name).indexOf(partnerRole) > 0;
                })
                : [];
            this.inviteData.assignedRoleNames = this.checkedByDefaultRoles;
        }
    }

    roleIsCheckedByDefault(roleName: AppRoles) {
        return this.checkedByDefaultRoles.indexOf(roleName) >= 0;
    }

    getPhonesAndEmails() {
        this.contactsService.contactInfo$.pipe(
            first()
        ).subscribe((contactInfo: ContactInfoDto) => {
            this.phones = contactInfo.personContactInfo.details.phones.filter(item => item.isActive);
            this.emails = contactInfo.personContactInfo.details.emails.filter(item => item.isActive);

            this.inviteData.emailAddress = (this.emails[0] || {}).emailAddress;
            this.inviteData.phoneNumber = (this.phones[0] || {}).phoneNumber;
        });

        setTimeout(() => {
            let instance = this.emailAddressComponent && this.emailAddressComponent.instance;
            if (instance)
                instance.option('isValid', true);
        });
    }

    loadData() {
        let data = this.data && this.data.raw;
        if (data && data.user && data.user.id == this.data.userId)
            this.fillUserData(this.data['raw']);
        else if (!this.dataIsloading) {
            this.dataIsloading = true;
            this.loadingService.startLoading();
            let contactInfo = this.contactInfoData && this.contactInfoData.contactInfo;
            if (contactInfo && contactInfo.personContactInfo)
                this.initUserForEdit(contactInfo);
            else
                this.contactsService.contactInfoSubscribe(
                    this.initUserForEdit.bind(this), this.ident
                );
        }
    }

    initUserForEdit(contactInfo: ContactInfoDto) {
        if (contactInfo) {
            this.userService.getUserForEdit(contactInfo.personContactInfo.userId || undefined)
                .pipe(
                    finalize(() => {
                        this.dataIsloading = false;
                        this.loadingService.finishLoading();
                    })
                ).subscribe((userEditOutput: GetUserForEditOutput) => {
                    if (contactInfo.personContactInfo.userId)
                        this.fillUserData(userEditOutput);
                    else {
                        this.roles = userEditOutput.roles;
                        this.updateInviteDataRoles();
                    }
                });
        }
    }

    isPartner() {
        let contactInfo = this.contactInfoData && this.contactInfoData.contactInfo;
        return contactInfo && contactInfo.hasOwnProperty('groups') &&
            contactInfo.groups.some(group => group.groupId == ContactGroup.Partner);
    }

    fillUserData(data) {
        this.selectedOrgUnits = [];
        data.memberedOrganizationUnits.forEach((organizationUnitCode: string) => {
            const organizationUnit = data.allOrganizationUnits.find(organizationUnit => organizationUnit.code === organizationUnitCode);
            if (organizationUnit) {
                this.selectedOrgUnits.push(organizationUnit['id']);
            }
        });

        if (data.user.id) {
            data.user['setRandomPassword'] = false;
            data.user['sendActivationEmail'] = false;

            this.userService['data'].user = data.user;
            this.userService['data'].roles = data.roles;
            this.userData = data;
        } else {
            this.selectedOrgUnits = (
                (this.contactInfoData.contactInfo.personContactInfo
                && this.contactInfoData.contactInfo.personContactInfo.orgRelations)
                || []
            ).map(item => {
                return item.organization && item.organization.rootOrganizationUnitId;
            }).filter(Boolean);
        }

        this.userService['data'].raw = data;
        data.selectedOrgUnits = this.selectedOrgUnits;
        setTimeout(() => this.contactsService.orgUnitsUpdate(data));
    }

    invitePasswordComparison = () => {
        return this.inviteData.password;
    }

    inviteUser() {
        if (!this.inviteData.emailAddress || !this.emailAddressComponent.instance.option('isValid'))
            return this.message.warn(this.ls.l('InvalidEmailAddress'));

        if (this.inviteData.phoneNumber && !this.phoneNumberComponent.instance.option('isValid'))
            return this.message.warn(this.ls.l('PhoneValidationError'));

        if (!this.inviteValidationComponent.instance.validate().isValid)
            return;

        this.message.confirm(
            this.ls.l('CreateNewUser'),
            this.ls.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this.loadingService.startLoading();
                    this.inviteData.contactId = this.contactInfoData.contactInfo.personContactInfo.id;
                    let phoneNumber = this.phoneFormatPipe.transform(this.inviteData.phoneNumber);
                    if (this.inviteSetRandomPassword)
                        this.inviteData.password = undefined;
                    this.personContactServiceProxy.createUserForContact(extend(clone(this.inviteData), {
                        phoneNumber: phoneNumber && phoneNumber.replace(/[^0-9\+]/g, ''),
                        organizationUnitIds: this.selectedOrgUnits
                    })).pipe(
                        finalize(() => this.loadingService.finishLoading())
                    ).subscribe(() => {
                        this.contactsService.invalidate();
                        this.appStoreService.dispatchUserAssignmentsActions(Object.keys(ContactGroup), true);
                    });
                }
            }
        );
    }

    inviteRoleUpdate(event, role) {
        let roles = this.inviteData.assignedRoleNames, roleIndex;
        if (event.value)
            roles.push(role.roleName);
        else if ((roleIndex = roles.indexOf(role.roleName)) >= 0)
            this.inviteData.assignedRoleNames.splice(roleIndex, 1);
    }

    updateValue(value, fieldName) {
        this.update(fieldName, value);
    }

    updatePhoneNumber(isValid) {
        isValid && this.update(this.PHONE_FIELD,
            this.data.user.phoneNumber, () => {
                this.phoneInplaceEdit = false;
            }
        );
    }

    closePhoneInPlaceEdit() {
        if (this.isEditAllowed) {
            this.phoneInplaceEdit = false;
            this.data.user.phoneNumber = this.initialPhoneNumber;
        }
    }

    phoneInPlaceEdit() {
        if (this.isEditAllowed) {
            this.phoneInplaceEdit = true;
            this.initialPhoneNumber = this.data.user.phoneNumber;
        }
    }

    roleUpdate(event, role) {
        if (!event.event)
            return;

        let sub;
        if (role.isAssigned)
            sub = this.userService.addToRole(UpdateUserRoleInput.fromJS({
                id: this.userData.user.id,
                roleName: role.roleName
            }));
        else
            sub = this.userService.removeFromRole(this.userData.user.id, role.roleName);

        this.loadingService.startLoading(this.elementRef.nativeElement);
        sub.pipe(finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))).subscribe(
            () => {
                if (this.roles.filter(item => item.id == role.roleId && item.moduleId == AppConsts.modules.CRMModule).length)
                    this.appStoreService.dispatchUserAssignmentsActions(Object.keys(ContactGroup), true);
                this.notify.info(this.ls.l('SavedSuccessfully'));
            }, () => { role.isAssigned = !role.isAssigned; }
        );
    }

    isActiveChanged(event) {
        if (event.event) {
            const initialValue = !this.data.user.isActive;
            this.contactsService.updateStatus(
                this.data.user.id,
                ContactGroup.Employee,
                this.data.user.isActive,
                'user'
            ).subscribe(
                (confirm: boolean) => {
                    if (confirm) {
                        let contactInfo = this.contactService['data'].contactInfo;
                        if (this.data.user.isActive && contactInfo.groups.every(group => !group.isActive)) {
                            contactInfo.groups.forEach(group => group.isActive = true);
                            this.updateToolbarOptions();
                        }
                    } else {
                        this.data.user.isActive = initialValue;
                    }
                },
                () => this.data.user.isActive = initialValue
            );
        }
    }

    update(fieldName?, value?, callback?) {
        let sub, data = { id: this.userData.user.id },
            initialValue = this.data.user[fieldName];

        this.data.user[fieldName] = data[fieldName] = value;
        if (fieldName == this.EMAIL_FIELD)
            sub = this.userService.updateEmail(UpdateUserEmailDto.fromJS(data));
        else if (fieldName == this.PHONE_FIELD)
            sub = this.userService.updatePhone(UpdateUserPhoneDto.fromJS(data));
        else if ([this.LOCKOUT_FIELD, this.TWO_FACTOR_FIELD].indexOf(fieldName) >= 0)
            sub = this.userService.updateOptions(UpdateUserOptionsDto.fromJS(data));
        else {
            sub = this.userService.createOrUpdateUser(CreateOrUpdateUserInput.fromJS({
                user: this.userData.user,
                setRandomPassword: this.userData.user['setRandomPassword'],
                sendActivationEmail: this.userData.user['sendActivationEmail'],
                assignedRoleNames: this.userData.roles
                    .filter((role: UserRoleDto) => role.isAssigned)
                    .map((role: UserRoleDto) => role.roleName),
                tenantHostType: <any>TenantHostType.PlatformApp,
                organizationUnits: this.selectedOrgUnits
            }));
        }

        this.loadingService.startLoading(this.elementRef.nativeElement);
        sub.pipe(finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))).subscribe(() => {
            callback && callback();
            this.notify.info(this.ls.l('SavedSuccessfully'));
            if ([this.EMAIL_FIELD, this.PHONE_FIELD].indexOf(fieldName) >= 0)
                this.dependencyChanged = true;
        }, () => {
            this.data.user[fieldName] = initialValue;
        });
    }

    checkInsertCustomValue(list) {
        if (list.indexOf(this.inviteData) < 0)
            list.unshift(this.inviteData);
    }

    onCustomItemCreating($event, field) {
        let isEmail = (field == 'emailAddress');
        this.checkInsertCustomValue(isEmail ?
            this.emails : this.phones);

        setTimeout(() => {
            this.inviteData[field] = $event.text;
        });
    }

    resetPasswordDialog(event) {
        this.data.user.setRandomPassword = true;
        this.data.user.shouldChangePasswordOnNextLogin = true;
        this.data.user.sendActivationEmail = true;

        this.dialog.closeAll();
        this.dialog.open(ResetPasswordDialog, {
            width: '400px',
            data: this.data,
            hasBackdrop: true
        });
        event.stopPropagation();
    }

    toggleOrgUnitsDialog(open: boolean = true): void {
        const dialog = this.dialog.getDialogById('user-organization-units-dialog');
        if (!dialog) {
            if (open) {
                this.dialog.open(OrganizationUnitsDialogComponent, {
                    id: 'user-organization-units-dialog',
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true
                }).afterClosed().subscribe(() => {
                    this.contactsService.toggleSettingsDialog();
                });
            }
        } else if (!open)
            dialog.close();
    }

    copyToClipbord(value) {
        this.clipboardService.copyFromContent(value);
        this.notify.info(this.ls.l('SavedToClipboard'));
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.dialog.closeAll();
        this.contactsService.unsubscribe(this.ident);
        if (this.dependencyChanged)
            this.contactsService.invalidate();
        this.lifecycleSubjectService.destroy.next();
    }
}