/// <reference path="../../../login/login.service.ts" />
/// <reference path="../../../login/login.service.ts" />
/** Core imports */
import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { MessageService, NotifyService } from 'abp-ng2-module';
import { MatDialog } from '@angular/material/dialog';
import { first, finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AbpSessionService } from 'abp-ng2-module';
import { SessionServiceProxy, LeadServiceProxy, TenantProductInfo, PaymentPeriodType, RecurringPaymentFrequency, 
    PasswordComplexitySetting, SubmitTenancyRequestOutput, TenantSubscriptionServiceProxy, CompleteTenantRegistrationOutput,
    ProductServiceProxy, SubmitTenancyRequestInput, ProductInfo, CompleteTenantRegistrationInput, ProfileServiceProxy,
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
    providers: [
        LeadServiceProxy, 
        ProductServiceProxy, 
        TenantSubscriptionServiceProxy, 
        LinkedInServiceProxy,
        ProfileServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostSignupFormComponent {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('secondStepForm') secondStepForm;
    @ViewChild('phoneNumber') phoneNumber;

    isExtLogin: boolean = false; 
    defaultCountryCode: string;
    selectedCountryCode: string;

    showPasswordComplexity: boolean;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
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
        private messageService: MessageService,
        private profileService: ProfileServiceProxy
    ) {
        this.tenancyRequestModel.tag = 'Demo Request';
        this.tenancyRequestModel.stage = 'Interested';

        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            this.isExtLogin = paramsMap.get('extlogin') == 'true';
        });

        this.productProxy.getSubscriptionProductsByGroupName('Main').subscribe(products => {
            this.signUpProduct = products.sort((prev, next) => {
                let prevOption = this.getProductMonthlyOption(prev), 
                    nextOption = this.getProductMonthlyOption(next);
                return prevOption.fee > nextOption.fee ? 1: -1;
            })[0];
            if (this.signUpProduct) {
                let option = this.getProductMonthlyOption(this.signUpProduct);
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
                        this.loginService.clearLinkedInParamsAndGetReturnUrl(exchangeCode, state)
                            .then(() => {
                                this.getUserData(exchangeCode, window.location.href)
                                    .pipe(finalize(() => abp.ui.clearBusy()))
                                    .subscribe((result: LinkedInUserData) => {
                                        this.tenancyRequestModel.firstName = result.name;
                                        this.tenancyRequestModel.lastName = result.surname;
                                        this.tenancyRequestModel.email = result.emailAddress;

                                        this.messageService.info('The data provided by LinkedIn has been successfully received. Please check the data and finalize creating Sperse Account.');

                                        this.changeDetectorRef.detectChanges();
                                    });
                            });
                    }
                });

                this.changeDetectorRef.detectChanges();
            });

            this.changeDetectorRef.detectChanges();
        });

        this.profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
        });
    }

    getUserData(exchangeCode, url): Observable<LinkedInUserData> {
        let state = this.router.getCurrentNavigation().extras.state;
        if (state && state.userNotFound)
            return of(new LinkedInUserData({
                name: state.firstName,
                surname: state.lastName,
                emailAddress: state.email
            }));
        else
            return this.linkedInService.getUserData(exchangeCode, url);
    }

    onFocus(): void {
        this.showPasswordComplexity = true;
    }

    getProductMonthlyOption(product) {
        return product.productSubscriptionOptions.filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
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
        if (!this.firstStepForm.valid || (this.phoneNumber && !this.phoneNumber.isValid()))
            return;

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.tenancyRequestModel.phone = undefined;

        this.startLoading();
        this.tenancyRequestModel.email = this.tenancyRequestModel.email.trim();
        this.tenancyRequestModel.lastName = this.tenancyRequestModel.lastName.trim();
        this.tenancyRequestModel.firstName = this.tenancyRequestModel.firstName.trim();
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
        this.tenantRegistrationModel.returnBearerToken = this.isExtLogin;
        this.tenantRegistrationModel.companyName = (this.tenantRegistrationModel.tenantName || '').trim();
        this.tenantRegistrationModel.tenancyName = this.clearUrlPrefix(this.tenantRegistrationModel.tenancyName);

        this.startLoading();
        this.tenantProxy.completeTenantRegistration(this.tenantRegistrationModel).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((res: CompleteTenantRegistrationOutput) => {
            this.congratulationLink = res.paymentLink || res.loginLink;

            if (res.bearerAccessToken)
                abp.auth.setToken(
                    res.bearerAccessToken,
                    undefined
                );

            if (res.bearerRefreshToken)
                abp.utils.setCookieValue(
                    AppConsts.authorization.refreshAuthTokenName,
                    res.bearerRefreshToken,
                    undefined,
                    abp.appPath
                );

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