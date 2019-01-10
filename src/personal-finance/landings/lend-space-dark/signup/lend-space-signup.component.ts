/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';
import { ActivationEnd } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppConsts } from 'shared/AppConsts';
import { ApplicationServiceProxy, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService, ExternalLoginProvider } from '@root/account/login/login.service';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';

@Component({
    selector: 'lend-space-signup',
    templateUrl: './lend-space-signup.component.html',
    styleUrls: [        
        './lend-space-signup.component.less'
    ],
    providers: [ ApplicationServiceProxy, LoginService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceSignupComponent extends AppComponentBase {
    @ViewChild('agreeWithTermsCheckBox') agreeWithTermsCheckBox: DxCheckBoxComponent;
    @ViewChild('agreeToRecieveCallsCheckBox') agreeToRecieveCallsCheckBox: DxCheckBoxComponent;

    patterns = {
        namePattern: AppConsts.regexPatterns.name,
        emailPattern: AppConsts.regexPatterns.email,
        zipPattern: AppConsts.regexPatterns.zipUsPattern,
        phonePattern: AppConsts.regexPatterns.phone
    };

    isAgreeWithTerms = true;
    isAgreedToRecieveCalls = false;
    registerData: SignUpMemberRequest = new SignUpMemberRequest();
    modalsData = {
        terms: { title: 'Terms of Use', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/terms.html', downloadDisabled: true },
        privacy: { title: 'Privacy Policy', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/policy.html', downloadDisabled: true },
        lender: { title: 'Lender Terms', bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/lender.html', downloadDisabled: true }
    };
    isRoutProcessed = false;
    constructor(
        injector: Injector,
        public loginService: LoginService,
        private dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
        this.registerData.isUSCitizen = true;
        this._router.events.subscribe((event) => {
            if (event instanceof ActivationEnd && !this.isRoutProcessed) {
                let data = event.snapshot.params;
                this.registerData = {
                    ...this.registerData,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                } as SignUpMemberRequest;
                this.isRoutProcessed = true;
            }
        });
    }

    signUpMember() {
        this.registerData.firstName = this.capitalize(this.registerData.firstName);
        this.registerData.lastName = this.capitalize(this.registerData.lastName);
        this.loginService.signUpMember(this.registerData);
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: data });
    }

    externalLogin(provider: ExternalLoginProvider) {
        if (this.isAgreeWithTerms && this.isAgreedToRecieveCalls)
            this.loginService.externalAuthenticate(provider);
        else {
            this.agreeWithTermsCheckBox.validator.instance.validate();
            this.agreeToRecieveCallsCheckBox.validator.instance.validate();
        }
    }
}
