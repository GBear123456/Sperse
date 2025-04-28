/// <reference path="../../../login/login.service.ts" />
/// <reference path="../../../login/login.service.ts" />
/** Core imports */
import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MessageService } from 'abp-ng2-module';
import { MatDialog } from '@angular/material/dialog';
import { first, finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import round from 'lodash/round';

/** Application imports */
import { environment } from '@root/environments/environment';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import {
    LeadServiceProxy, TenantProductInfo, PaymentPeriodType, RecurringPaymentFrequency,
    PasswordComplexitySetting, SubmitTenancyRequestOutput, TenantSubscriptionServiceProxy, CompleteTenantRegistrationOutput,
    ProductServiceProxy, SubmitTenancyRequestInput, ProductInfo, CompleteTenantRegistrationInput, ProfileServiceProxy,
    ExternalUserDataServiceProxy, GetExternalUserDataOutput, GetExternalUserDataInput, PriceOptionInfo, PublicPriceOptionInfo
} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ExternalLoginProvider, LoginService } from '../../../login/login.service';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';

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
        ExternalUserDataServiceProxy,
        ProfileServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostSignupFormComponent {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('secondStepForm') secondStepForm;
    @ViewChild('phoneNumber') phoneNumber;

    appMemberPortalUrl = AppConsts.appMemberPortalUrl || environment.portalUrl;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    hostName = AppConsts.defaultTenantName;
    isSperseHost = AppConsts.isSperseHost;
    loginReferer: string = '';
    isExtLogin: boolean = false;
    defaultCountryCode: string;
    selectedCountryCode: string;

    showPasswordComplexity: boolean;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    tenancyRequestModel = new SubmitTenancyRequestInput();
    tenantRegistrationModel = new CompleteTenantRegistrationInput();
    signUpProduct: ProductInfo;
    selectedSubscriptionOption: PublicPriceOptionInfo;
    descriptionHtml: SafeHtml;
    currencySymbol = '$';
    buttonText = '';

    nameRegexp = AppConsts.regexPatterns.name;
    emailRegexp = AppConsts.regexPatterns.email;
    agreedTermsAndServices: boolean = !AppConsts.isSperseHost;
    congratulationLink: string;
    leadRequestXref: string;

    showProviders = false;
    linkedInProvider: ExternalLoginProvider;
    discordProvider: ExternalLoginProvider;
    conditions = ConditionsType;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private tenantProxy: TenantSubscriptionServiceProxy,
        private productProxy: ProductServiceProxy,
        private loadingService: LoadingService,
        private leadProxy: LeadServiceProxy,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public loginService: LoginService,
        public router: Router,
        public conditionsModalService: ConditionsModalService,
        private activatedRoute: ActivatedRoute,
        private externalUserDataService: ExternalUserDataServiceProxy,
        private messageService: MessageService,
        private profileService: ProfileServiceProxy,
        private sanitizer: DomSanitizer
    ) {
        this.tenancyRequestModel.tag = 'Demo Request';
        this.tenancyRequestModel.stage = 'Interested';

        this.activatedRoute.queryParamMap.pipe(
            first()
        ).subscribe((paramsMap: ParamMap) => {
            this.isExtLogin = paramsMap.get('extlogin') == 'true';        
            this.loginReferer = paramsMap.get('referer');
            if(!['login', 'portal'].includes(this.loginReferer))
                this.loginReferer = '';
        });

        this.productProxy.getSubscriptionProductsByGroupName('Main', true, false).subscribe(products => {
            this.signUpProduct = products.sort((prev, next) => {
                let prevOption = this.getProductMonthlyOrFirstOption(prev),
                    nextOption = this.getProductMonthlyOrFirstOption(next);
                return prevOption.fee > nextOption.fee ? 1 : -1;
            })[0];
            if (this.signUpProduct) {
                this.currencySymbol = getCurrencySymbol(this.signUpProduct.currencyId, 'narrow');
                if (this.signUpProduct.descriptionHtml)
                    this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(this.signUpProduct.descriptionHtml);
            }
            this.loginService.externalLoginProviders$.subscribe((providers: ExternalLoginProvider[]) => {
                this.linkedInProvider = providers.find(x => x.name == ExternalLoginProvider.LINKEDIN && !!x.clientId);
                this.discordProvider = providers.find(x => x.name == ExternalLoginProvider.DISCORD && !!x.clientId);
                this.showProviders = !!this.linkedInProvider || !!this.discordProvider;

                this.activatedRoute.queryParamMap.pipe(
                    first()
                ).subscribe((paramsMap: ParamMap) => {
                    let exchangeCode = paramsMap.get('code');
                    let state = paramsMap.get('state');
                    let providerName = paramsMap.get('provider') || ExternalLoginProvider.LINKEDIN;
                    if (!!exchangeCode && !!state) {
                        abp.ui.setBusy();
                        this.loginService.clearOAuth2Params()
                            .then(() => {
                                this.getUserData(exchangeCode, providerName)
                                    .pipe(finalize(() => abp.ui.clearBusy()))
                                    .subscribe((result: GetExternalUserDataOutput) => {
                                        this.tenancyRequestModel.firstName = result.name;
                                        this.tenancyRequestModel.lastName = result.surname;
                                        this.tenancyRequestModel.email = result.emailAddress;
                                        this.tenancyRequestModel.comments = this.getTenancyRequestComment(result);

                                        this.messageService.info(`The data provided by ${providerName} has been successfully received. Please check the data and finalize creating Sperse Account.`);

                                        this.changeDetectorRef.detectChanges();
                                    });
                            });
                    } else if (providerName)
                        this.loginService.clearOAuth2Params();
                });

                this.changeDetectorRef.detectChanges();
            });

            this.changeDetectorRef.detectChanges();
        });

        this.profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
        });
    }

    getUserData(exchangeCode, providerName): Observable<GetExternalUserDataOutput> {
        let state = this.loginService.lastOAuth2Result;
        if (state && state.userNotFound) //user was redirected from signin
            return of(new GetExternalUserDataOutput({
                name: state.firstName,
                surname: state.lastName,
                emailAddress: state.email,
                additionalData: null
            }));
        else {
            let options = {};
            if (providerName == ExternalLoginProvider.DISCORD.toLowerCase())
                options['IncludeUserGuilds'] = true;
            return this.externalUserDataService.getUserData(new GetExternalUserDataInput({
                provider: providerName,
                exchangeCode: exchangeCode,
                loginReturnUrl: this.loginService.getRedirectUrl(providerName),
                options: options
            }));
        }
    }

    getTenancyRequestComment(result: GetExternalUserDataOutput): string {
        if (result.additionalData) {
            let discordGuilds: any[] = result.additionalData['DiscordUserGuilds'];
            if (discordGuilds) {
                let comment = 'Owned Discord servers:\n';
                discordGuilds.map(v => comment += `- ${v['name']} (${v['id']})`);
                return comment;
            }
        }

        return null;
    }

    onFocus(): void {
        this.showPasswordComplexity = true;
    }

    getProductMonthlyOrFirstOption(product: ProductInfo): PriceOptionInfo {
        let monthly = product.priceOptions.filter(option => option.frequency == RecurringPaymentFrequency.Monthly)[0];
        return monthly || product.priceOptions[0];
    }

    onProductOptionSelect(event: PublicPriceOptionInfo) {
        this.selectedSubscriptionOption = event;

        let buttonText = 'Start ';
        if (this.selectedSubscriptionOption.trialDayCount) {
            buttonText += 'Your ';
            if (!this.selectedSubscriptionOption.signupFee)
                buttonText += ' Free ';
            buttonText += `${this.selectedSubscriptionOption.trialDayCount}-Day Trial `;
        }
        buttonText += 'Today!';
        this.buttonText = buttonText;
    }

    getPricePerPeriod(): number {
        let price = this.selectedSubscriptionOption.fee;
        return this.selectedSubscriptionOption.frequency === RecurringPaymentFrequency.Annual ?
            round(price / 12, 2) :
            price;
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
        this.tenancyRequestModel.products = [new TenantProductInfo({
            productId: this.signUpProduct.id,
            priceOptionId: this.selectedSubscriptionOption.id,
            paymentPeriodType: PaymentPeriodType[this.selectedSubscriptionOption.frequency],
            quantity: 1,
        })];

        this.leadProxy.submitTenancyRequest(this.tenancyRequestModel).pipe(
            finalize(() => this.finishLoading())
        ).subscribe((responce: SubmitTenancyRequestOutput) => {
            this.leadRequestXref = responce.leadRequestXref;
            this.changeDetectorRef.detectChanges();
        });
    }

    clearUrlPrefix(url) {
        return url ? url.replace('http://', '').replace('https://', '').replace('www.', '') : undefined;
    }

    onBlurSiteUrl() {
        if (this.tenantRegistrationModel && !this.tenantRegistrationModel.tenancyName) {
            let suggestedDomain,
                psl = require('psl'),
                parsedDomain = this.tenantRegistrationModel.siteUrl ?
                    psl.parse(this.clearUrlPrefix(this.tenantRegistrationModel.siteUrl)) : '';
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
        window.open(this.conditionsModalService.getHtmlUrl(type), '_blank');
    }
}