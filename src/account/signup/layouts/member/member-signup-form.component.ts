/** Core imports */
import { Component, ChangeDetectionStrategy, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import capitalize from 'underscore.string/capitalize';
import { filter, takeUntil } from 'rxjs/operators';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxValidatorComponent } from 'devextreme-angular/ui/validator';
import { MessageService } from 'abp-ng2-module';
import { MaskPipe } from 'ngx-mask';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ApplicationServiceProxy, SignUpMemberRequest } from '@shared/service-proxies/service-proxies';
import { LoginService, ExternalLoginProvider } from '@root/account/login/login.service';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'member-signup-form',
    templateUrl: './member-signup-form.component.html',
    styleUrls: [
        './member-signup-form.component.less'
    ],
    providers: [ ApplicationServiceProxy, LoginService, LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberSignupFormComponent implements OnInit, OnDestroy {
    @ViewChild('agreeWithTermsCheckBox') agreeWithTermsCheckBox: DxCheckBoxComponent;
    @ViewChild('emailAddress') emailAddress: DxTextBoxComponent;
    @ViewChild('zipValidator') zipValidator: DxValidatorComponent;
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

    showExternalLogin = true;
    isAgreeWithTerms = true;
    registerData: SignUpMemberRequest = new SignUpMemberRequest();
    isRoutProcessed = false;
    tenantId = abp.session.tenantId;

    constructor(
        public loginService: LoginService,
        private dialog: MatDialog,
        private router: Router,
        private messageService: MessageService,
        private lifecycleService: LifecycleSubjectsService,
        private maskPipe: MaskPipe,
        public ls: AppLocalizationService
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
        if (!this.registerData.firstName || !this.registerData.lastName)
            return this.messageService.error(
                this.ls.l('FullNameIsRequired'),
                this.ls.l('InvalidFormMessage')
            );

        if (!this.registerData.email || !this.emailAddress.isValid)
            return this.messageService.error(
                this.ls.l(this.registerData.email ? 'EmailIsNotValid' : 'EmailIsRequired'),
                this.ls.l('InvalidFormMessage')
            );

        this.registerData.firstName = capitalize(this.registerData.firstName);
        this.registerData.lastName = capitalize(this.registerData.lastName);
        this.registerData.countryCode = this.selectedCountryCode;
        this.loginService.signUpMember(this.registerData);
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    onZipCodeInput (e) {
        if (this.showZipMask) {
            if (e.event.target.value.length > 10)
                e.event.target.value = e.event.target.value.slice(0, 10);
            e.event.target.value = this.maskPipe.transform(e.event.target.value, AppConsts.masks.zipCodeLong);
        }
    }

    zipCodeChange(e) {
        this.registerData.postalCode = e.value;
    }

    getChangedCountry($event) {
        this.selectedCountryCode = $event.countryCode;
        this.showZipMask = this.defaultCountryCode == this.selectedCountryCode;
        this.showZipMask ? this.patterns.zipPattern = AppConsts.regexPatterns.zipUsPattern : this.patterns.zipPattern = /.*/;
        this.zipValidator.validationRules[0]['reevaluate'] = true;
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
        if (this.isAgreeWithTerms)
            this.loginService.externalAuthenticate(provider);
        else {
            this.agreeWithTermsCheckBox['validator'].instance.validate();
        }
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}