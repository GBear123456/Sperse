/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';

/** Third party imports */
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { environment } from 'environments/environment';
import { ApplicationServiceProxy, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService, ExternalLoginProvider } from '@root/account/login/login.service';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'lend-space-signup',
    templateUrl: './lend-space-signup.component.html',
    styleUrls: [
        './lend-space-signup.component.less'
    ],
    providers: [ApplicationServiceProxy, LoginService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceSignupComponent {
    @ViewChild('agreeWithTermsCheckBox') agreeWithTermsCheckBox: DxCheckBoxComponent;
    @ViewChild('agreeToReceiveCallsCheckBox') agreeToReceiveCallsCheckBox: DxCheckBoxComponent;

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
        terms: { title: 'Terms of Use', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/terms.html', downloadDisabled: true },
        privacy: { title: 'Privacy Policy', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/policy.html', downloadDisabled: true },
        lender: { title: 'Lender Terms', bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/lender.html', downloadDisabled: true }
    };
    isRoutProcessed = false;
    constructor(
        private router: Router,
        public loginService: LoginService,
        public ls: AppLocalizationService,
        public conditionsModalService: ConditionsModalService,
    ) {
        this.registerData.isUSCitizen = true;
        this.router.events.subscribe((event) => {
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
        this.registerData.firstName = capitalize(this.registerData.firstName);
        this.registerData.lastName = capitalize(this.registerData.lastName);
        this.loginService.signUpMember(this.registerData);
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    openConditionsDialog(data: any) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: data
        });
    }

    externalLogin(provider: ExternalLoginProvider) {
        if (this.isAgreeWithTerms && this.isAgreedToRecieveCalls)
            this.loginService.externalAuthenticate(provider);
        else {
            this.agreeWithTermsCheckBox['validator'].instance.validate();
            this.agreeToReceiveCallsCheckBox['validator'].instance.validate();
        }
    }
}
