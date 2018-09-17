import { Injector, Component, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, ProfileServiceProxy, GetUserForEditOutput, CreateOrUpdateUserInput, TenantHostType } from '@shared/service-proxies/service-proxies';
import { PasswordComplexityValidator } from '@shared/utils/validation/password-complexity-validator.directive';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { InplaceEditModel } from '@app/shared/common/inplace-edit/inplace-edit.model';
import { ContactsService } from '../contacts.service';

import { finalize } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
    selector: 'user-information',
    templateUrl: './user-information.component.html',
    styleUrls: ['./user-information.component.less'],
    providers: [ PhoneFormatPipe ]
})
export class UserInformationComponent extends AppComponentBase implements OnInit {
    data: any;

    readonly GENERAL_TAB_INDEX        = 0;
    readonly PERMISSIONS_TAB_INDEX    = 1;
    readonly LOGIN_ATTEMPTS_TAB_INDEX = 2;

    selectedTabIndex = this.GENERAL_TAB_INDEX; 

    showInviteUserForm = false;
    passwordObject = { passwordInplaceEdit: false, originalValue: '', value: '' };
    passwordValidator: PasswordComplexityValidator = new PasswordComplexityValidator();
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    selectedOrgUnits: number[] = [];

    masks = AppConsts.masks;

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
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _phoneFormatPipe: PhoneFormatPipe,
        private _contactsService: ContactsService
    ) {
        super(injector);

        _contactsService.userSubscribe((userId) => {            
            if (this.data.userId = userId)
                this.loadData();
        });

        _contactsService.orgUnitsSaveSubscribe((data) => {            
            this.selectedOrgUnits = data;
            this.update();
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
        if ((this.data = this._userService['data']).userId)
            this.loadData();
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
        data.displayValue = this._phoneFormatPipe.transform(data.value);
        return data;
    }

    updateValue(value, fieldName) {
        this.data.user[fieldName] = value
        this.update();
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

    update() {
        this.startLoading();
        this._userService.createOrUpdateUser(CreateOrUpdateUserInput.fromJS({ 
            user: this.userData.user,
            setRandomPassword: this.userData.user['setRandomPassword'],
            sendActivationEmail: this.userData.user['sendActivationEmail'],
            assignedRoleNames: _.map(_.filter(this.userData.roles, { isAssigned: true }), role => role.roleName),
            tenantHostType: <any>TenantHostType.PlatformUi,
            organizationUnits: this.selectedOrgUnits
        })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }
}