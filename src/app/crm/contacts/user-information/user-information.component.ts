import { Injector, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, GetUserForEditOutput, UpdateUserPhoneDto, RoleServiceProxy,
    UpdateUserOptionsDto, UpdateUserRoleInput, ContactGroupInfoDto, ContactGroupServiceProxy, PersonContactServiceProxy,
    CreateOrUpdateUserInput, TenantHostType, UpdateUserEmailDto, CreateUserForContactInput } from '@shared/service-proxies/service-proxies';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { ContactsService } from '../contacts.service';
import { DxSelectBoxComponent } from 'devextreme-angular';
import { ResetPasswordDialog } from './reset-password-dialog/reset-password-dialog.component';
import { MatDialog } from '@angular/material';

import { finalize } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
    selector: 'user-information',
    templateUrl: './user-information.component.html',
    styleUrls: ['./user-information.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class UserInformationComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('emailAddress') emailAddressComponent: DxSelectBoxComponent;
    @ViewChild('phoneNumber') phoneNumberComponent: DxSelectBoxComponent;
    data: any;

    readonly GENERAL_TAB_INDEX        = 0;
    readonly PERMISSIONS_TAB_INDEX    = 1;
    readonly LOGIN_ATTEMPTS_TAB_INDEX = 2;

    readonly EMAIL_FIELD = 'emailAddress';
    readonly PHONE_FIELD = 'phoneNumber';
    readonly ACTIVE_FIELD = 'isActive';
    readonly TWO_FACTOR_FIELD = 'isTwoFactorEnabled';
    readonly LOCKOUT_FIELD = 'isLockoutEnabled';

    selectedTabIndex = this.GENERAL_TAB_INDEX;

    isEditAllowed = false;
    changeRolesAllowed = false;

    phoneInplaceEdit = false;
    initialPhoneNumber: any;

    roles: any = [];
    emails: any = [];
    phones: any = [];
    contactInfoData: any;
    inviteData = CreateUserForContactInput.fromJS({
        contactId: undefined,
        emailAddress: '',
        phoneNumber: undefined,
        assignedRoleNames: []
    });

    showInviteUserForm = false;
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    selectedOrgUnits: number[] = [];

    masks = AppConsts.masks;
    phonePattern = /^[\d\+\-\(\)\s]{10,24}$/;

    validationRules = {
        'name': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'surname': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'phoneNumber': [{ type: 'stringLength', max: 24 }, { type: 'pattern', pattern: AppConsts.regexPatterns.phone }],
        'emailAddress': [{ type: 'email', message: this.l('InvalidEmailAddress') }, { type: 'required', message: this.l('EmailIsRequired') }]
    };

    constructor(injector: Injector,
        public dialog: MatDialog,
        public phoneFormatPipe: PhoneFormatPipe,
        private _userService: UserServiceProxy,
        private _contactsService: ContactsService,
        private _contactsServiceProxy: PersonContactServiceProxy,
        private _contactGroupService: ContactGroupServiceProxy,
        private _roleServiceProxy: RoleServiceProxy
    ) {
        super(injector);

        _contactsService.userSubscribe((userId) => {
            if ((this.data = _userService['data']).userId = userId)
                this.loadData();
            this.checkShowInviteForm();
        }, this.constructor.name);

        _contactsService.orgUnitsSaveSubscribe((data) => {
            this.data.raw.memberedOrganizationUnits = [];
            (this.selectedOrgUnits = data).forEach((item) => {
                this.data.raw.memberedOrganizationUnits.push(
                    _.find(this.data.raw.allOrganizationUnits, {id: item})['code']);
            });
        }, this.constructor.name);

        if (!(this.roles = _roleServiceProxy['data']))
            _roleServiceProxy.getRoles(undefined, undefined).subscribe((res) => {
                _roleServiceProxy['data'] = this.roles = res.items;
            });

        this.isEditAllowed = this.isGranted('Pages.Administration.Users.Edit');
        this.changeRolesAllowed = this.isGranted('Pages.Administration.Users.ChangePermissionsAndRoles');
    }

    ngOnInit() {
        this.contactInfoData = this._contactGroupService['data'];
        if ((this.data = this._userService['data']).userId)
            this.loadData();
        else
            setTimeout(() => this.checkShowInviteForm(), 500);
    }

    checkShowInviteForm() {
        this.showInviteUserForm = this.data && !this.data.userId &&
            this.permission.isGranted('Pages.Administration.Users.Create');

        let contactInfo = this.contactInfoData.contactInfo.primaryContactInfo;
        if (contactInfo) {
            this.phones = contactInfo.details.phones
                .filter(item => item.isActive );
            this.emails = contactInfo.details.emails
                .filter(item => item.isActive );
        }
    }

    loadData() {
        if (this.data && this.data.raw && this.data.raw.user.id == this.data.userId)
            this.fillUserData(this.data['raw']);
        else if (!this.loading) {
            this.startLoading();
            this._userService.getUserForEdit(this.data.userId)
                .pipe(finalize(() => this.finishLoading()))
                .subscribe((userEditOutput) => {
                    this.fillUserData(this._userService['data'].raw = userEditOutput);
                });
        }
    }

    fillUserData(data) {
        this._userService['data'].user = data.user;
        data.user['setRandomPassword'] = false;
        data.user['sendActivationEmail'] = false;

        this._userService['data'].roles = data.roles;

        data.memberedOrganizationUnits.forEach((item) => {
            this.selectedOrgUnits.push(_.find(data.allOrganizationUnits, {code: item})['id']);
        });
        setTimeout(() => this._contactsService.orgUnitsUpdate(this.userData = data));
    }

    inviteUser() {
        if (!this.inviteData.emailAddress || !this.emailAddressComponent.instance.option('isValid'))
            return this.message.warn(this.l('InvalidEmailAddress'));

        if (!this.inviteData.phoneNumber || !this.phoneNumberComponent.instance.option('isValid'))
            return this.message.warn(this.l('PhoneValidationError'));

        if (!this.inviteData.assignedRoleNames.length)
            return this.message.warn(this.l('RoleIsRequired'));

        this.message.confirm(
            this.l('CreateNewUser'),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading();
                    this.inviteData.contactId = this.contactInfoData.contactInfo.primaryContactInfo.id;
                    this._contactsServiceProxy.createUserForContact(_.extend(_.clone(this.inviteData),
                        { phoneNumber: this.inviteData.phoneNumber.replace(/\D/g, '') }))
                        .pipe(finalize(() => this.finishLoading())).subscribe(() => {
                            this._contactsService.invalidate();
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

    getPropData(field: string) {
        let validationRules = this.validationRules[field] || [];

        return {
            id: null,
            value: this.data && this.data.user && this.data.user[field],
            isEditDialogEnabled: false,
            validationRules: validationRules,
            lEntityName: field,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        } as InplaceEditModel;
    }

    getPhoneNumberPropData() {
        let data = this.getPropData(this.PHONE_FIELD);
        data.displayValue = this.phoneFormatPipe.transform(data.value);
        return data;
    }

    updateValue(value, fieldName) {
        this.data.user[fieldName] = value;
        this.update(fieldName, value);
    }

    updatePhoneNumber(isValid, value) {
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

    roleUpdate(role) {
        let sub;
        if (role.isAssigned)
            sub = this._userService.addToRole(UpdateUserRoleInput.fromJS({
                id: this.userData.user.id,
                roleName: role.roleName
            }));
        else
            sub = this._userService.removeFromRole(this.userData.user.id, role.roleName);

        this.startLoading();
        sub.pipe(finalize(() => this.finishLoading())).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    update(fieldName = undefined, value = undefined, callback = undefined) {
        let sub, data = {
            id: this.userData.user.id
        };
        data[fieldName] = value;

        if (fieldName == this.EMAIL_FIELD)
            sub = this._userService.updateEmail(UpdateUserEmailDto.fromJS(data));
        else if (fieldName == this.PHONE_FIELD)
            sub = this._userService.updatePhone(UpdateUserPhoneDto.fromJS(data));
        else if ([this.ACTIVE_FIELD, this.LOCKOUT_FIELD, this.TWO_FACTOR_FIELD].indexOf(fieldName) >= 0)
            sub = this._userService.updateOptions(UpdateUserOptionsDto.fromJS(data));
        else
            sub = this._userService.createOrUpdateUser(CreateOrUpdateUserInput.fromJS({
                user: this.userData.user,
                setRandomPassword: this.userData.user['setRandomPassword'],
                sendActivationEmail: this.userData.user['sendActivationEmail'],
                assignedRoleNames: _.map(_.filter(this.userData.roles, { isAssigned: true }), role => role.roleName),
                tenantHostType: <any>TenantHostType.PlatformApp,
                organizationUnits: this.selectedOrgUnits
            }));

        this.startLoading();
        sub.pipe(finalize(() => this.finishLoading())).subscribe(() => {
            callback && callback();
            this.notify.info(this.l('SavedSuccessfully'));
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
        this._contactsService.unsubscribe(this.constructor.name);
    }
}
