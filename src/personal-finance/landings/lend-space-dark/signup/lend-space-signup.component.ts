import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppConsts } from 'shared/AppConsts';
import { ApplicationServiceProxy, SignUpMemberResponse, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { finalize } from '@node_modules/rxjs/internal/operators';
import { LoginService } from '@root/account/login/login.service';
import { ConditionsType } from '@shared/AppEnums';
import { MatDialog } from '@angular/material';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

@Component({
    selector: 'lend-space-signup',
    templateUrl: './lend-space-signup.component.html',
    styleUrls: ['./lend-space-signup.component.less'],
    providers: [ ApplicationServiceProxy, LoginService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceSignupComponent extends AppComponentBase {
    patterns = {
        namePattern: AppConsts.regexPatterns.name,
        emailPattern: AppConsts.regexPatterns.email
    };
    radioGroupCitizen = [
        {text: 'Yes', status: true},
        {text: 'No', status: false}
    ];
    isAgreeWithTerms = true;
    registerData: SignUpMemberRequest = new SignUpMemberRequest();
    modalsData = {
        terms:   { title: 'Terms of Use', type: ConditionsType.Terms, downloadDisabled: true },
        privacy: { title: 'Privacy Policy', type: ConditionsType.Policies, downloadDisabled: true },
        lender:  { title: 'Lender Terms', bodyUrl: AppConsts.appBaseHref + 'assets/documents/lend-space/lender-terms.html', downloadDisabled: true }
    };

    constructor(
        injector: Injector,
        public _loginService: LoginService,
        private _applicationServiceProxy: ApplicationServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
        this.registerData.isUSCitizen = true;
    }

    signUpMember() {
        this.registerData.firstName = this.capitalize(this.registerData.firstName);
        this.registerData.lastName = this.capitalize(this.registerData.lastName);
        this.startLoading(true);
        this._applicationServiceProxy.signUpMember(this.registerData)
            .pipe(finalize(() => { this.finishLoading(true); }))
            .subscribe((res: SignUpMemberResponse) => {
                this._loginService.processAuthenticateResult(
                    res.authenticateResult,
                    '/personal-finance/offers/personal-loans');
            });
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.target;
            event.component.option({
                mask: '00000',
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);
                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '' });
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: data });
    }
}
