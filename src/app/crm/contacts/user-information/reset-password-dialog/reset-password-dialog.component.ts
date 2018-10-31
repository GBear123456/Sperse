/** Core imports */
import { Component, Inject, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { finalize } from 'rxjs/operators';
import * as _ from 'lodash';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ProfileServiceProxy, ResetUserPasswordDto, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { PasswordComplexityValidator } from '@shared/utils/validation/password-complexity-validator.directive';

@Component({
    templateUrl: 'reset-password-dialog.html',
    styleUrls: ['reset-password-dialog.less']
})
export class ResetPasswordDialog extends AppComponentBase {
    isValid = false;

    passwordObject = { passwordInplaceEdit: false, originalValue: '', value: '' };
    passwordValidator: PasswordComplexityValidator = new PasswordComplexityValidator();

    passwordErrorsMessages = {
        'requireDigit': this.l('PasswordComplexity_RequireDigit_Hint'),
        'requiredLength': this.l('PasswordComplexity_RequiredLength_Hint', 6),
        'requireLowercase': this.l('PasswordComplexity_RequireLowercase_Hint'),
        'requireNonAlphanumeric': this.l('PasswordComplexity_RequireNonAlphanumeric_Hint'),
        'requireUppercase': this.l('PasswordComplexity_RequireUppercase_Hint')
    };

    constructor(injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        public dialogRef: MatDialogRef<ResetPasswordDialog>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._profileService.getPasswordComplexitySetting().subscribe(passwordComplexityResult => {
            this.passwordValidator.requireDigit = passwordComplexityResult.setting.requireDigit;
            this.passwordValidator.requiredLength = passwordComplexityResult.setting.requiredLength;
            this.passwordValidator.requireLowercase = passwordComplexityResult.setting.requireLowercase;
            this.passwordValidator.requireNonAlphanumeric = passwordComplexityResult.setting.requireNonAlphanumeric;
            this.passwordValidator.requireUppercase = passwordComplexityResult.setting.requireUppercase;

            this.passwordErrorsMessages.requiredLength = this.l('PasswordComplexity_RequiredLength_Hint', passwordComplexityResult.setting.requiredLength);
        });
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
            return _.repeat('*', password.length);
        return null;
    }

    closePasswordEdit() {
        this.passwordObject.passwordInplaceEdit = false;
        this.passwordObject.value = this.data.user.password;
    }

    setRandomPasswordChanged() {
        if (this.data.user.setRandomPassword) {
            this.data.user.password = undefined;
            this.passwordObject.passwordInplaceEdit = false;
        }
    }

    resetPassword($event) {
        if (!this.passwordObject.passwordInplaceEdit && (this.data.user.setRandomPassword || this.data.user.password)) {
            this.startLoading();
            this._userService.resetPassword(ResetUserPasswordDto.fromJS(this.data.user))
                .pipe(finalize(() => this.finishLoading())).subscribe(() => {
                    this.dialogRef.close();
                });
        } else
            this.notify.warn(this.l('PleaseEnterYourNewPassword'));
    }
}
