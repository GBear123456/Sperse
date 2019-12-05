/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import capitalize from 'underscore.string/capitalize';
import { filter, takeUntil } from 'rxjs/operators';
import { MaskPipe } from '@node_modules/ngx-mask';

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
    providers: [ ApplicationServiceProxy, LoginService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupFormComponent implements OnInit, OnDestroy {
    @ViewChild('agreeWithTermsCheckBox') agreeWithTermsCheckBox: DxCheckBoxComponent;
    @ViewChild('agreeToReceiveCallsCheckBox') agreeToReceiveCallsCheckBox: DxCheckBoxComponent;
    showZipMask = true;
    defaultCountryCode: string;
    selectedCountryCode: string;
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
        private lifecycleService: LifecycleSubjectsService,
        private maskPipe: MaskPipe
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
        this.registerData.countryCode = this.selectedCountryCode;
        this.loginService.signUpMember(this.registerData);
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    validateNumber(event) {
        if (!event.key.match(/^[0-9]+$/) && event.key.length == 1 && this.showZipMask)
            event.preventDefault();
    }

    onZipCodeChanged (event) {
        if (this.showZipMask)
            this.registerData.postalCode = this.maskPipe.transform(event.value, AppConsts.masks.zipCodeLong);
    }

    getChangedCountry($event) {
        this.selectedCountryCode = $event.countryCode;
        this.showZipMask = this.defaultCountryCode == this.selectedCountryCode;
        this.showZipMask ? this.patterns.zipPattern = AppConsts.regexPatterns.zipUsPattern : this.patterns.zipPattern = /.*/;
    }

    getDefaultCode($event) {
        setTimeout(() => {
            this.selectedCountryCode = this.defaultCountryCode = $event.intPhoneNumber.defaultCountry;
        }, 100);
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
