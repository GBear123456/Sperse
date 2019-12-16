/** Core imports */
import { Component, OnInit, OnDestroy, ViewChild, HostListener, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';
import extend from 'lodash/extend';
import clone from 'lodash/clone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    UserServiceProxy, GetUserForEditOutput, UpdateUserPhoneDto, RoleServiceProxy,
    UpdateUserOptionsDto, UpdateUserRoleInput, ContactServiceProxy, PersonContactServiceProxy,
    CreateOrUpdateUserInput, TenantHostType, UpdateUserEmailDto, CreateUserForContactInput, RoleListDto, UserRoleDto
} from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
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

@Component({
    selector: 'user-information',
    templateUrl: './user-information.component.html',
    styleUrls: ['./user-information.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class UserInformationComponent implements OnInit, OnDestroy {
    @ViewChild('emailAddress') emailAddressComponent: DxSelectBoxComponent;
    @ViewChild('phoneNumber') phoneNumberComponent: DxSelectBoxComponent;
    @ViewChild('inviteValidationGroup') inviteValidationComponent: DxValidationGroupComponent;
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
    emails: any = [];
    phones: any = [];
    contactInfoData: any;
    inviteData = CreateUserForContactInput.fromJS({
        contactId: undefined,
        emailAddress: '',
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
        map((userId) => !userId && this.permissionService.isGranted(AppPermissions.AdministrationUsersCreate))
    );
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    selectedOrgUnits: number[] = [];
    dependencyChanged = false;
    masks = AppConsts.masks;
    phonePattern = /^[\d\+\-\(\)\s]{10,24}$/;
    emailRegEx = AppConsts.regexPatterns.email;
    validationRules = {
        'name': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'surname': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'phoneNumber': [{ type: 'stringLength', max: 24 }, { type: 'pattern', pattern: AppConsts.regexPatterns.phone }],
        'emailAddress': [{ type: 'pattern', pattern: this.emailRegEx, message: this.ls.l('InvalidEmailAddress') }, { type: 'required', message: this.ls.l('EmailIsRequired') }]
    };
    orgUnitsDisabled;
    dataIsloading = false;
    @HostListener('window:resize') onResize() {
        if (this.orgUnitsDisabled = (innerWidth > 1200))
            if (this.selectedTabIndex == this.ORG_UNITS_TAB_INDEX)
                this.selectedTabIndex = this.GENERAL_TAB_INDEX;
    }

    constructor(
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
        public dialog: MatDialog,
        public phoneFormatPipe: PhoneFormatPipe,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.onResize();
        this.contactInfoData = this.contactService['data'];
        this.contactsService.userSubscribe(
            (userId) => {
                this.data = this.userService['data'];
                this.data.userId = userId;
                if (userId)
                    this.loadData();
                else
                    this.getPhonesAndEmails();
            },
            this.constructor.name
        );
        setTimeout(() => this.getPhonesAndEmails(), 500);

        this.contactsService.orgUnitsSaveSubscribe(
            (data) => {
                this.data.raw.memberedOrganizationUnits = [];
                (this.selectedOrgUnits = data).forEach((item) => {
                    this.data.raw.memberedOrganizationUnits.push(
                        this.data.raw.allOrganizationUnits.find((organizationUnit) => {
                            return organizationUnit.id === item;
                        })['code']
                    );
                });
            },
            this.constructor.name
        );

        if (!(this.roles = this.roleServiceProxy['data']))
            this.roleServiceProxy.getRoles(undefined, undefined).subscribe((res) => {
                this.roleServiceProxy['data'] = this.roles = res.items;
                this.updateInviteDataRoles();
            });
        this.updateInviteDataRoles();
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
        let contactInfo = this.contactInfoData.contactInfo.personContactInfo;
        if (contactInfo) {
            this.phones = contactInfo.details.phones.filter(item => item.isActive );
            this.emails = contactInfo.details.emails.filter(item => item.isActive );
        }
        this.loadData();
    }

    loadData() {
        if (this.data && this.data.raw && this.data.raw.user.id == this.data.userId)
            this.fillUserData(this.data['raw']);
        else if (!this.dataIsloading) {
            this.loadingService.startLoading();
            this.dataIsloading = true;
            this.contactsService.contactInfoSubscribe(
            (contactInfo) => this.userService.getUserForEdit(contactInfo.personContactInfo.userId || undefined)
                .pipe(finalize(() => {
                    this.dataIsloading = false;
                    this.loadingService.finishLoading();
                }))
                .subscribe((userEditOutput: GetUserForEditOutput) => this.fillUserData(userEditOutput)),
                    this.constructor.name
                );
        }
    }

    isPartner() {
        return this.contactInfoData && this.contactInfoData.contactInfo &&
               this.contactInfoData.contactInfo.groupId === ContactGroup.Partner;
    }

    fillUserData(data) {
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
                this.contactInfoData.contactInfo.personContactInfo.orgRelations || []
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
                    })).pipe(finalize(() => this.loadingService.finishLoading())).subscribe(() => {
                        this.contactsService.invalidate();
                    });
                }
            }
        );
    }

    inviteRoleUpdate(event, item) {
        let roles = this.inviteData.assignedRoleNames, roleIndex;
        if (event.value)
            roles.push(item.name);
        else if ((roleIndex = roles.indexOf(item.name)) >= 0)
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
        this.phoneInplaceEdit = false;
        this.data.user.phoneNumber = this.initialPhoneNumber;
    }

    phoneInPlaceEdit() {
        this.phoneInplaceEdit = true;
        this.initialPhoneNumber = this.data.user.phoneNumber;
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
            () => { this.notify.info(this.ls.l('SavedSuccessfully')); },
            () => { role.isAssigned = !role.isAssigned; }
        );
    }

    isActiveChanged(event) {
        if (event.event) {
            if (this.data.user.isActive)
                this.update(this.ACTIVE_FIELD, this.data.user.isActive);
            else
                this.message.confirm(
                    this.ls.l('DeactivateUserConfirm'),
                    this.ls.l('AreYouSure'),
                    isConfirmed => {
                        if (isConfirmed)
                            this.update(this.ACTIVE_FIELD, this.data.user.isActive);
                        else
                            this.data.user.isActive = true;
                    }
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
        else if ([this.ACTIVE_FIELD, this.LOCKOUT_FIELD, this.TWO_FACTOR_FIELD].indexOf(fieldName) >= 0) {
            sub = this.userService.updateOptions(UpdateUserOptionsDto.fromJS(data));
            if (fieldName == this.ACTIVE_FIELD && value == true) {
                this.contactService['data'].contactInfo.statusId = ContactStatus.Active;
            }
        } else {
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

    onValueChanged($event) {
        this.inviteData[$event.component.option('name')] = $event.value;
    }

    resetPasswordDialog(event) {
        this.data.user.setRandomPassword = true;
        this.data.user.shouldChangePasswordOnNextLogin = true;
        this.data.user.sendActivationEmail = true;

        this.dialog.closeAll();
        this.dialog.open(ResetPasswordDialog, {
            data: this.data,
            hasBackdrop: true
        });
        event.stopPropagation();
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.constructor.name);
        if (this.dependencyChanged)
            this.contactsService.invalidate();
    }
}
