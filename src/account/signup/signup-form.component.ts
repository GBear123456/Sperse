/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import capitalize from 'underscore.string/capitalize';
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ApplicationServiceProxy, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService, ExternalLoginProvider } from '@root/account/login/login.service';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { ConditionsType } from '@shared/AppEnums';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'signup-form',
    templateUrl: './signup-form.component.html',
    styleUrls: [
        './signup-form.component.less'
    ],
    providers: [ ApplicationServiceProxy, LoginService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupFormComponent implements OnInit, OnDestroy {
    @ViewChild('agreeWithTermsCheckBox') agreeWithTermsCheckBox: DxCheckBoxComponent;
    @ViewChild('agreeToReceiveCallsCheckBox') agreeToReceiveCallsCheckBox: DxCheckBoxComponent;

    conditions = ConditionsType;
    patterns = {
        namePattern: AppConsts.regexPatterns.name,
        emailPattern: AppConsts.regexPatterns.email,
        zipPattern: AppConsts.regexPatterns.zipUsPattern,
        phonePattern: AppConsts.regexPatterns.phone
    };

    isAgreeWithTerms = true;
    isAgreedToReceiveCalls = false;
    registerData: SignUpMemberRequest = new SignUpMemberRequest();
    isRoutProcessed = false;
    constructor(
        public loginService: LoginService,
        private dialog: MatDialog,
        private router: Router,
        private lifecycleService: LifecycleSubjectsService
    ) {
        this.registerData.isUSCitizen = true;
    }

    ngOnInit() {
        this.router.events
            .pipe(
                takeUntil(this.lifecycleService.destroy$),
                filter((event) => event instanceof ActivationEnd && !this.isRoutProcessed)
            )
            .subscribe((event: ActivationEnd) => {
                let data = event.snapshot.params;
                this.registerData = {
                    ...this.registerData,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                } as SignUpMemberRequest;
                this.isRoutProcessed = true;
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

    openConditionsDialog(type: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type } });
    }

    externalLogin(provider: ExternalLoginProvider) {
        if (this.isAgreeWithTerms && this.isAgreedToReceiveCalls)
            this.loginService.externalAuthenticate(provider);
        else {
            this.agreeWithTermsCheckBox.validator.instance.validate();
            this.agreeToReceiveCallsCheckBox.validator.instance.validate();
        }
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
