/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { ActivationEnd } from '@angular/router';

/** Third party imports */
import { finalize } from '@node_modules/rxjs/internal/operators';
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppComponentBase } from 'shared/common/app-component-base';
import { AppConsts } from 'shared/AppConsts';
import { ApplicationServiceProxy, SignUpMemberResponse, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService } from '@root/account/login/login.service';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

@Component({
    selector: 'lend-space-signup',
    templateUrl: './lend-space-signup.component.html',
    styleUrls: ['./lend-space-signup.component.less'],
    providers: [ApplicationServiceProxy, LoginService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendSpaceSignupComponent extends AppComponentBase {
    patterns = {
        namePattern: AppConsts.regexPatterns.name,
        emailPattern: AppConsts.regexPatterns.email,
        zipPattern: AppConsts.regexPatterns.zipUsPattern
    };
    radioGroupCitizen = [
        { text: 'Yes', status: true },
        { text: 'No', status: false }
    ];
    isAgreeWithTerms = true;
    registerData: SignUpMemberRequest = new SignUpMemberRequest();
    modalsData = {
        terms: { title: 'Terms of Use', type: ConditionsType.Terms, downloadDisabled: true },
        privacy: { title: 'Privacy Policy', type: ConditionsType.Policies, downloadDisabled: true },
        lender: { title: 'Lender Terms', bodyUrl: AppConsts.appBaseHref + 'assets/documents/lend-space/lender-terms.html', downloadDisabled: true }
    };
    isRoutProcessed = false;
    constructor(
        injector: Injector,
        public _loginService: LoginService,
        private _applicationServiceProxy: ApplicationServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
        this.registerData.isUSCitizen = true;
        this._router.events.subscribe((event) => {
            if (event instanceof ActivationEnd && !this.isRoutProcessed) {
                let data = event.snapshot.params;
                this.registerData.firstName = data.firstName;
                this.registerData.lastName = data.lastName;
                this.registerData.email = data.email;
                this.isRoutProcessed = true;
            }
        });
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
                    AppConsts.appBaseUrl);
            });
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: data });
    }
}
