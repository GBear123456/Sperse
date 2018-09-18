import { Injector, Component, OnInit, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, ProfileServiceProxy, GetUserForEditOutput, UpdateUserPhoneDto, RoleServiceProxy,
    UpdateUserOptionsDto, UpdateUserRoleInput, ContactGroupInfoDto, ContactServiceProxy, ContactGroupServiceProxy, 
    CreateOrUpdateUserInput, TenantHostType, UpdateUserEmailDto, CreateUserForContactInput } from '@shared/service-proxies/service-proxies';
import { PasswordComplexityValidator } from '@shared/utils/validation/password-complexity-validator.directive';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { ContactsService } from '../contacts.service';
import { DxSelectBoxComponent } from 'devextreme-angular';

import { finalize } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
    selector: 'user-information',
    templateUrl: './user-information.component.html',
    styleUrls: ['./user-information.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class UserInformationComponent extends AppComponentBase implements OnInit {
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
    passwordObject = { passwordInplaceEdit: false, originalValue: '', value: '' };
    passwordValidator: PasswordComplexityValidator = new PasswordComplexityValidator();
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    selectedOrgUnits: number[] = [];

    masks = AppConsts.masks;
    phonePattern = /^[\d\+\-\(\)\s]{10,24}$/;
    
    validationRules = {
        'name': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'surname': [{ type: 'required' }, { type: 'stringLength', max: 32 }],
        'phoneNumber': [{ type: 'stringLength', max: 24 }, { type: "pattern", pattern: AppConsts.regexPatterns.phone }],
        'emailAddress': [{ type: 'email', message: this.l('InvalidEmailAddress') }]
    };

    passwordErrorsMessages = {
        'requireDigit': this.l('PasswordComplexity_RequireDigit_Hint'),
        'requiredLength': this.l('PasswordComplexity_RequiredLength_Hint', 6),
        'requireLowercase': this.l('PasswordComplexity_RequireLowercase_Hint'),
        'requireNonAlphanumeric': this.l('PasswordComplexity_RequireNonAlphanumeric_Hint'),
        'requireUppercase': this.l('PasswordComplexity_RequireUppercase_Hint')
    };

    constructor(injector: Injector,
        public phoneFormatPipe: PhoneFormatPipe,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _contactsService: ContactsService,
        private _contactsServiceProxy: ContactServiceProxy,
        private _contactGroupService: ContactGroupServiceProxy,
        private _roleServiceProxy: RoleServiceProxy
    ) {
        super(injector);

        _contactsService.userSubscribe((userId) => {            
            if ((this.data = _userService['data']).userId = userId)
                this.loadData();
            this.checkShowInviteForm();
        });

        _contactsService.orgUnitsSaveSubscribe((data) => {            
            this.selectedOrgUnits = data;
            this.update();
        });

        _roleServiceProxy.getRoles().subscribe((res) => {
            this.roles = res.items;
        });

        this._profileService.getPasswordComplexitySetting().subscribe(passwordComplexityResult => {
            this.passwordValidator.requireDigit = passwordComplexityResult.setting.requireDigit;
            this.passwordValidator.requiredLength = passwordComplexityResult.setting.requiredLength;
            this.passwordValidator.requireLowercase = passwordComplexityResult.setting.requireLowercase;
            this.passwordValidator.requireNonAlphanumeric = passwordComplexityResult.setting.requireNonAlphanumeric;
            this.passwordValidator.requireUppercase = passwordComplexityResult.setting.requireUppercase;

            this.passwordErrorsMessages.requiredLength = this.l('PasswordComplexity_RequiredLength_Hint', passwordComplexityResult.setting.requiredLength);
        });
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
                .filter((item) => {return item.isActive;});
            this.emails = contactInfo.details.emails
                .filter((item) => {return item.isActive;});
        }
    }

    loadData() {
        this.startLoading();
        this._userService.getUserForEdit(this.data.userId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe((userEditOutput) => {
                this._userService['data'].user = userEditOutput.user;
                userEditOutput.user['setRandomPassword'] = false;
                userEditOutput.user['sendActivationEmail'] = false;

                this._userService['data'].roles = userEditOutput.roles;
                this._contactsService.orgUnitsUpdate(
                    this.userData = userEditOutput);

                userEditOutput.memberedOrganizationUnits.forEach((item) => {
                    this.selectedOrgUnits.push(_.find(userEditOutput.allOrganizationUnits, {code: item}).id)
                });
            });
    }

    inviteUser() {
        if (!this.inviteData.emailAddress || !this.emailAddressComponent.instance.option('isValid'))
            return this.message.warn(this.l('InvalidEmailAddress'));

        if(!this.inviteData.phoneNumber || !this.phoneNumberComponent.instance.option('isValid')) 
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
                    this._contactsServiceProxy.createUserForContact(this.inviteData)
                        .pipe(finalize(() => this.finishLoading())).subscribe(() => {
                            this._contactsService.invalidate(); //location.reload();
                        });
                }
            }
        );
    }

    inviteRoleUpdate(event, item) {
        let riles = this.inviteData.assignedRoleNames, roleIndex;
        if (event.value)
            riles.push(item.name);
        else if ((roleIndex = riles.indexOf(item.name)) >= 0)
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
        let data = this.getPropData('phoneNumber');
        data.displayValue = this.phoneFormatPipe.transform(data.value);
        return data;
    }

    updateValue(value, fieldName) {
        this.data.user[fieldName] = value;
        this.update(fieldName, value);
    }

    startPasswordEdit() {
        this.passwordObject.passwordInplaceEdit = true;
        this.passwordObject.originalValue = this.data.user.password;
        this.passwordObject.value = this.data.user.password;
    }

    updatePassword(event) {
        if (event.validationGroup.validate().isValid) {
            this.data.user.password = this.passwordObject.value;
            this.passwordObject.passwordInplaceEdit = false;
            this.update();
        }
    }

    validatePassword = (e) => {
        let result = this.passwordValidator.validate(<any>{ value: e.value });
        e.rule.isValid = true;
        let message = '';

        if (result) {
            message = '<ul class="validation-error-list">';
            Object.keys(result).forEach(prop => {
                if (result[prop]) {
                    e.rule.isValid = false;
                    message = message + '<li>' + this.passwordErrorsMessages[prop] + '</li>';
                }
            });
            message += '</ul>';
        }
        e.rule.message = message;
        return e.rule.isValid;
    }

    showPassword(password: string): string {
        if (password)
            return _.repeat('•', password.length);
        return null;
    }

    closePasswordEdit() {
        this.passwordObject.passwordInplaceEdit = false;
        this.passwordObject.value = this.data.user.password;
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

    update(fieldName = undefined, value = undefined) {
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
                tenantHostType: <any>TenantHostType.PlatformUi,
                organizationUnits: this.selectedOrgUnits
            }));

        this.startLoading();
        sub.pipe(finalize(() => this.finishLoading())).subscribe(() => {
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
            this.emails: this.phones);

        setTimeout(() => {
            this.inviteData[field] = $event.text;
        });
    }

    onValueChanged($event) {  
        this.inviteData[$event.component.option('name')] = $event.value;
    }
}