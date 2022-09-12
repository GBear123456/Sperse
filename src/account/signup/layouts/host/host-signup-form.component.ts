/// <reference path="../../../login/login.service.ts" />
/// <reference path="../../../login/login.service.ts" />
/** Core imports */
import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { MessageService, NotifyService } from 'abp-ng2-module';
import { MatDialog } from '@angular/material/dialog';
import { first, finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AbpSessionService } from 'abp-ng2-module';
import { SessionServiceProxy, LeadServiceProxy, TenantProductInfo, PaymentPeriodType, RecurringPaymentFrequency, 
    SubmitTenancyRequestOutput, TenantSubscriptionServiceProxy, CompleteTenantRegistrationOutput,
    ProductServiceProxy, SubmitTenancyRequestInput, ProductInfo, CompleteTenantRegistrationInput,
    LinkedInServiceProxy, LinkedInUserData} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ExternalLoginProvider, LoginService } from '../../../login/login.service';

const psl = require('psl');

@Component({
    templateUrl: './host-signup-form.component.html',
    styleUrls: [
        '../../../../assets/fonts/fonts-outfit-light.css',
        '../../../../assets/fonts/sperser-extension.css',
        './host-signup-form.component.less',
    ],
    providers: [LeadServiceProxy, ProductServiceProxy, TenantSubscriptionServiceProxy, LinkedInServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostSignupFormComponent {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('secondStepForm') secondStepForm;
    @ViewChild('phoneNumber') phoneNumber;

    defaultCountryCode: string;
    selectedCountryCode: string;

    tenancyRequestModel = new SubmitTenancyRequestInput();
    tenantRegistrationModel = new CompleteTenantRegistrationInput();
    signUpProduct: ProductInfo;

    nameRegexp = AppConsts.regexPatterns.name;
    emailRegexp = AppConsts.regexPatterns.email;
    agreedTermsAndServices: boolean = false;
    congratulationLink: string;
    leadRequestXref: string;

    linkedIdLoginProvider: ExternalLoginProvider;
    conditions = ConditionsType;

    constructor(
        private notifyService: NotifyService,
        private sessionService: AbpSessionService,
        private changeDetectorRef: ChangeDetectorRef,
        private sessionAppService: SessionServiceProxy,
        private tenantProxy: TenantSubscriptionServiceProxy,
        private productProxy: ProductServiceProxy,
        private loadingService: LoadingService,
        private leadProxy: LeadServiceProxy,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public loginService: LoginService,
        public router: Router,
        private activatedRoute: ActivatedRoute,
        private linkedInService: LinkedInServiceProxy,
        private messageService: MessageService
    ) {
        this.tenancyRequestModel.tag = 'Demo Request';
        this.tenancyRequestModel.stage = 'Interested';
        this.productProxy.getSubscriptionProductsByGroupName('Extention').subscribe(products => {
            this.signUpProduct = products[0];
            if (this.signUpProduct) {
                let option = this.signUpProduct.productSubscriptionOptions
                    .filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
                this.signUpProduct.price = option.fee;
                this.tenancyRequestModel.products = [new TenantProductInfo({
                    productId: this.signUpProduct.id,
                    paymentPeriodType: option && PaymentPeriodType[option.frequency],
                    quantity: 1,
                })];
            }
            this.loginService.linkedIdLoginProvider$.subscribe((provider: ExternalLoginProvider) => {
                this.linkedIdLoginProvider = provider;

                this.activatedRoute.queryParamMap.pipe(
                    first()
                ).subscribe((paramsMap: ParamMap) => {
                    let exchangeCode = paramsMap.get('code');
                    let state = paramsMap.get('state');
                    if (!!exchangeCode && !!state) {
                        abp.ui.setBusy();
                        let loginReturnUrl = this.loginService.clearLinkedInParamsAndGetReturnUrl(exchangeCode, state);

                        this.linkedInService.getUserData(exchangeCode, loginReturnUrl)
                            .pipe(finalize(() => abp.ui.clearBusy()))
                            .subscribe((result: LinkedInUserData) => {
                                this.tenancyRequestModel.firstName = result.name;
                                this.tenancyRequestModel.lastName = result.surname;
                                this.tenancyRequestModel.email = result.emailAddress;

                                this.messageService.info('The data provided by LinkedIn is not enough for Create Your Sperse Account');

                                this.changeDetectorRef.detectChanges();
                            });
                    }
                });

                this.changeDetectorRef.detectChanges();
            });

            this.changeDetectorRef.detectChanges();
        });
    }

    startLoading() {
        this.loadingService.startLoading();
    }

    finishLoading() {
        this.loadingService.finishLoading();
    }

    getDefaultCode(event) {
        setTimeout(() => {
            this.selectedCountryCode = this.defaultCountryCode = event.intPhoneNumber.defaultCountry;
        }, 100);
    }

    getChangedCountry(event) {
        this.selectedCountryCode = event.countryCode;
    }

    processTenantRegistrationRequest() {
        //if (!this.firstStepForm.valid || (this.phoneNumber && !this.phoneNumber.isValid()))
        //    return;

        this.startLoading();
        this.leadProxy.submitTenancyRequest(this.tenancyRequestModel).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((responce: SubmitTenancyRequestOutput) => {
            this.leadRequestXref = responce.leadRequestXref;
            this.changeDetectorRef.detectChanges();
        });
    }

    clearUrlPrefix(url) {
        return url ? url.replace('http://','').replace('https://','').replace('www.','') : undefined;
    }

    onBlurSiteUrl() {
        if (this.tenantRegistrationModel && !this.tenantRegistrationModel.tenancyName) {
            let suggestedDomain,
                psl = require('psl'),
                parsedDomain = psl.parse(this.clearUrlPrefix(this.tenantRegistrationModel.siteUrl));
            if (parsedDomain) {
                suggestedDomain = parsedDomain.sld;
            }
            if (suggestedDomain) {
                this.tenantRegistrationModel.tenancyName = 'https://' + suggestedDomain;
                this.changeDetectorRef.detectChanges();
            }
        }
    }

    completeTenantRegistrationRequest() {
        if (!this.secondStepForm.valid)
            return;

        this.tenantRegistrationModel.requestXref = this.leadRequestXref;
        this.tenantRegistrationModel.companyName = this.tenantRegistrationModel.tenantName;
        this.tenantRegistrationModel.tenancyName = this.clearUrlPrefix(this.tenantRegistrationModel.tenancyName);

        this.startLoading();
        this.tenantProxy.completeTenantRegistration(this.tenantRegistrationModel).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((res: CompleteTenantRegistrationOutput) => {
            this.congratulationLink = res.paymentLink || res.loginLink;
            this.changeDetectorRef.detectChanges();            
        });
    }

    openConditionsDialog(type: ConditionsType) {
        window.open(this.getApiLink(type), '_blank');
    }

    getApiLink(type: ConditionsType) {
        if (this.appSession.tenant)
            return AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/Get' + 
                (type == ConditionsType.Policies ? 'PrivacyPolicy' : 'TermsOfService') + 
                'Document?tenantId=' + this.appSession.tenant.id;
        else
            return AppConsts.appBaseHref + 'assets/documents/' + 
                (type == ConditionsType.Terms ? 'SperseTermsOfService.pdf' : 'SpersePrivacyPolicy.pdf');
    }
}