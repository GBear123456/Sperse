/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize, first, map, tap } from 'rxjs/operators';
import round from 'lodash/round';
import * as _ from 'underscore';

/** Application imports */
import {
    AddressInfoDto,
    CompleteTenantRegistrationInput,
    CountryDto,
    CountryStateDto,
    CouponDiscountDuration,
    CustomPeriodType,
    GetTaxCalculationInput,
    LeadServiceProxy,
    PasswordComplexitySetting,
    PaymentPeriodType,
    ProductDonationSuggestedAmountInfo,
    ProductTaxInput,
    ProductType,
    ProfileServiceProxy,
    PublicCouponInfo,
    PublicProductInfo,
    PublicProductInput,
    PublicProductServiceProxy,
    PublicPriceOptionInfo,
    RecurringPaymentFrequency,
    SubmitProductRequestInput,
    SubmitProductRequestOutput,
    SubmitTenancyRequestInput,
    TaxCalculationResultDto,
    TenantProductInfo,
    TenantSubscriptionServiceProxy,
    ProductAddOnDto,
    ProductAddOnOptionDto,
    PriceOptionType,
    ExternalUserDataServiceProxy,
    GetExternalUserDataInput,
    PublicProductAddOnOptionInfo,
    PublicProductChargeInput
} from '@root/shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { PayPalComponent } from '@shared/common/paypal/paypal.component';
import { ButtonType } from '@shared/common/paypal/button-type.enum';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { getCurrencySymbol } from '@angular/common';
import { DomHelper } from '../../../shared/helpers/DomHelper';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { GooglePlaceService } from '../../../shared/common/google-place/google-place.service';
import { StatesService } from '../../../store/states-store/states.service';
import { select, Store } from '@ngrx/store';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore, StatesStoreActions, StatesStoreSelectors } from '../../../store';
import { AppSessionService } from '../../../shared/common/session/app-session.service';
import { SpreedlyPayButtonsComponent } from '@shared/common/spreedly-pay-buttons/spreedly-pay-buttons.component';

declare const Stripe: any;

@Component({
    selector: 'single-product',
    templateUrl: 'single-product.component.html',
    styleUrls: [
        './single-product.component.less',
        '../../../../node_modules/devextreme/dist/css/dx.light.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})

export class SingleProductComponent implements OnInit {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('phoneNumber') phoneNumber;
    @ViewChild('customerPriceElement') customerPriceElement;
    @ViewChild('addressInput') addressInput: ElementRef;
    @ViewChild(PayPalComponent) set paypPalComponent(paypalComp: PayPalComponent) {
        this.payPal = paypalComp;
        this.initializePayPal();
    };

    private payPal: PayPalComponent;
    paypalButtonType: ButtonType = null;

    hostName = AppConsts.defaultTenantName;
    currentYear: number = new Date().getFullYear();
    currencySymbol = '';

    tenantId: number;
    productPublicName: string;
    ref: string;
    optionId: number;
    embeddedCheckout = false;
    showCheckout = false;
    stripeCheckoutObj;

    productInfo: PublicProductInfo;
    requestInfo: SubmitProductRequestInput = new SubmitProductRequestInput();
    taxCalcInfo: GetTaxCalculationInput = new GetTaxCalculationInput();
    productTaxInput: ProductTaxInput = new ProductTaxInput();
    billingAddress: AddressInfoDto = new AddressInfoDto();
    productInput = new PublicProductInput();
    tenantRegistrationModel = new CompleteTenantRegistrationInput();
    passwordComplexitySetting: PasswordComplexitySetting;

    agreedTermsAndServices: boolean = false;
    hasToSOrPolicy: boolean = false;
    nameRegexp = /^[a-zA-Z-.' ]+$/;
    emailRegexp = AppConsts.regexPatterns.email;
    conditions = ConditionsType;

    descriptionHtml: SafeHtml;

    showNotFound = false;
    showNoPaymentSystems = false;
    productType = ProductType;
    priceOptionType = PriceOptionType;

    defaultCountryCode = abp.setting.get('App.TenantManagement.DefaultCountryCode');
    selectedPriceOption: PublicPriceOptionInfo;
    singlePaymentOptions = [RecurringPaymentFrequency.LifeTime, RecurringPaymentFrequency.OneTime];
    isFreeProductSelected = false;

    initialInvoiceXref: string = null;

    couponLoading: boolean = false;
    showCouponError: boolean = false;
    couponInfo: PublicCouponInfo = null;
    couponInfoCache: { [code: string]: PublicCouponInfo } = {};

    customerPriceEditMode = false;
    customerPriceRegexp = /^\d+(.\d{1,2})?$/;
    customerPriceInputErrorDefs: any[] = [];

    isDonationGoalReached = false;
    isInStock = true;

    countries: any;
    googleAutoComplete = Boolean(window['google']);
    address: any = {
        countryCode: null,
        countryName: null,
        address: null
    };

    taxCalculation: TaxCalculationResultDto;
    private calculationTaxTimeout;

    discordPopup: Window;
    lastSubmittedLeadRequestId: number;

    constructor(
        private sessionService: AppSessionService,
        private route: ActivatedRoute,
        private titleService: Title,
        private publicProductService: PublicProductServiceProxy,
        private leadProxy: LeadServiceProxy,
        private tenantProxy: TenantSubscriptionServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private changeDetector: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
        private profileService: ProfileServiceProxy,
        private externalUserDataService: ExternalUserDataServiceProxy,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        public ls: AppLocalizationService,
        public conditionsModalService: ConditionsModalService
    ) {
        this.productInput.quantity = 1;
        this.requestInfo.products = [this.productInput];
        this.taxCalcInfo.products = [this.productTaxInput];
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.productPublicName = this.route.snapshot.paramMap.get('productPublicName');
        this.ref = this.route.snapshot.paramMap.get('refCode');
        if (!this.ref)
            this.ref = this.route.snapshot.queryParamMap.get('ref');
        if (!this.ref)
            this.ref = this.route.snapshot.queryParamMap.get('referralCode');
        this.optionId = Number(this.route.snapshot.queryParamMap.get('optionId'));
        this.embeddedCheckout = Boolean(this.route.snapshot.queryParamMap.get('embeddedCheckout'));

        this.countriesStateLoad();
        this.getProductInfo();
    }

    onPhoneFieldInitialize(phoneField) {
        if (phoneField && phoneField.intPhoneNumber && this.defaultCountryCode) {
            setTimeout(() => {
                phoneField.intPhoneNumber.phoneNumber = '';
                phoneField.intPhoneNumber.updatePhoneInput(this.defaultCountryCode.toLowerCase());
            });
        }
    }

    initializePayPal() {
        if (this.payPal && this.productInfo && !this.payPal.initialized) {
            let hasPayment = false;
            let hasRecurring = false;
            this.productInfo.priceOptions.map(v => {
                if (v.type == PriceOptionType.OneTime || this.singlePaymentOptions.includes(v.frequency))
                    hasPayment = true
                else
                    hasRecurring = true;
            });

            let type = hasRecurring && hasPayment ? ButtonType.Both :
                hasRecurring ? ButtonType.Subscription : ButtonType.Payment;

            this.payPal.initialize(this.productInfo.data.paypalClientId, type,
                this.getPayPalRequest.bind(this),
                this.getPayPalRequest.bind(this),
                this.productInfo.currencyId,
                this.productInfo.data.paypalMerchantId,
                this.productInfo.data.paypalBNCode
            );
        }
    }

    initializePasswordComplexity() {
        this.profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
            this.changeDetector.detectChanges();
        });
    }

    getPayPalRequest(): Promise<string> {
        return this.getSubmitRequest('PayPal')
            .pipe(
                map(v => v.paymentData)
            )
            .toPromise();
    }

    getProductInfo() {
        abp.ui.setBusy();
        this.appHttpConfiguration.avoidErrorHandling = true;
        this.publicProductService
            .getProductInfo(this.tenantId, this.productPublicName)
            .pipe(
                finalize(() => {
                    this.appHttpConfiguration.avoidErrorHandling = false;
                    abp.ui.clearBusy();
                })
            )
            .subscribe(result => {
                if (result.id) {
                    this.productInfo = result;
                    this.titleService.setTitle(this.productInfo.name);
                    this.currencySymbol = getCurrencySymbol(result.currencyId, 'narrow');
                    this.initPriceOptions();

                    this.isInStock = this.productInfo.stock == null || this.productInfo.stock > 0;
                    this.isDonationGoalReached = this.productInfo.type == ProductType.Donation && this.productInfo.productDonation.goalAmount &&
                        this.productInfo.productDonation.raisedAmount >= this.productInfo.productDonation.goalAmount;

                    if (this.isInStock && (!this.isDonationGoalReached || this.productInfo.productDonation.keepActiveIfGoalReached)) {
                        this.showNoPaymentSystems = !result.data.paypalClientId && !result.data.stripeConfigured && !result.data.spreedlyConfiguration?.spreedlyGateways.length;
                        if (result.descriptionHtml)
                            this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(result.descriptionHtml);
                        if (result.data.hasTenantService)
                            this.initializePasswordComplexity();
                        this.initConditions();
                        this.initializePayPal();
                    }
                } else {
                    this.showNotFound = true;
                }

                this.changeDetector.detectChanges();
            }, () => {
                this.showNotFound = true;
                this.changeDetector.detectChanges();
            });
    }

    submitStripeRequest() {
        if (!this.productInfo.data.stripeConfigured)
            return;

        abp.ui.setBusy();
        this.getSubmitRequest('Stripe')
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(res => {
                if (this.embeddedCheckout) {
                    if (!window['Stripe']) {
                        DomHelper.addScriptLink("https://js.stripe.com/v3/", 'text/javascript', () => {
                            this.showStripeCheckout(res.paymentData);
                        });
                    } else {
                        this.showStripeCheckout(res.paymentData);
                    }
                } else {
                    location.href = res.paymentData;
                }
            });
    }

    showStripeCheckout(clientSecret) {
        let stripe = Stripe(this.productInfo.data.stripePublishableKey);
        const fetchClientSecret = () => Promise.resolve(clientSecret);
        stripe.initEmbeddedCheckout({
            fetchClientSecret
        }).then(checkout => {
            this.stripeCheckoutObj = checkout;
            checkout.mount('#stripe-checkout');
            this.showCheckout = true;
            this.changeDetector.detectChanges();
        });
    }

    returnFromStripeCheckout() {
        this.stripeCheckoutObj.destroy();
        this.showCheckout = false;
    }

    onSpreedlyClick(event) {
        abp.ui.setBusy();
        this.getSubmitRequest('Spreedly')
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(res => {
                this.lastSubmittedLeadRequestId = Number(res.paymentData);
                let spreedlyComponent: SpreedlyPayButtonsComponent = event.component;
                let displayOptions = {
                    amount: spreedlyComponent.formatAmount(this.getGeneralPrice(true), this.productInfo.currencyId),
                    company_name: this.productInfo.name,
                    sidebar_top_description: '',
                    sidebar_bottom_description: this.selectedPriceOption.name,
                    full_name: this.requestInfo.firstName + ' ' + this.requestInfo.lastName
                };
                let paymentMethodParams = {
                    email: this.requestInfo.email.trim(),
                    country: "US"
                };
                spreedlyComponent.showBankCardPopup(event.providerId, displayOptions, paymentMethodParams);
            });
    }

    onSpreedlyPaymentMethod(event) {
        if (!this.lastSubmittedLeadRequestId)
            return;

        abp.ui.setBusy();
        this.publicProductService.publicProductCharge(new PublicProductChargeInput({
            tenantId: this.tenantId,
            leadRequestId: this.lastSubmittedLeadRequestId,
            paymentGateway: 'Spreedly',
            paymentGatewayTokenId: event.providerId,
            paymentMethodToken: event.token
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe(res => {
            if (res.errorMessage) {
                abp.message.error(res.errorMessage);
            } else {
                this.initialInvoiceXref = res.invoicePublicId;
                this.redirectToReceipt();
            }
        });
    }

    submitFreeRequest() {
        abp.ui.setBusy();
        this.getSubmitRequest(null)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(() => {
                location.href = this.getReceiptUrl();
            });
    }

    submitTenant() {
        if (!this.isFormValid()) {
            abp.notify.error(this.ls.l('SaleProductValidationError'));
            return;
        }

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.requestInfo.phone = undefined;

        abp.ui.setBusy();
        let tenancyRequestModel = new SubmitTenancyRequestInput();
        tenancyRequestModel.email = this.requestInfo.email.trim();
        tenancyRequestModel.lastName = this.requestInfo.lastName;
        tenancyRequestModel.firstName = this.requestInfo.firstName;
        tenancyRequestModel.phone = this.requestInfo.phone;
        tenancyRequestModel.products = [new TenantProductInfo({
            productId: this.productInfo.id,
            priceOptionId: this.selectedPriceOption.id,
            paymentPeriodType: PaymentPeriodType[this.selectedPriceOption.frequency],
            quantity: 1
        })];
        tenancyRequestModel.couponCode = this.isFreeProductSelected || this.selectedPriceOption.customerChoosesPrice ? null : this.requestInfo.couponCode;
        tenancyRequestModel.affiliateCode = this.ref;

        this.leadProxy.submitTenancyRequest(tenancyRequestModel).subscribe(response => {
            this.completeTenantRegistration(response.leadRequestXref);
        }, () => abp.ui.clearBusy());
    }

    completeTenantRegistration(leadRequestXref: string) {
        this.tenantRegistrationModel.requestXref = leadRequestXref;
        this.tenantRegistrationModel.returnBearerToken = false;

        this.tenantProxy.completeTenantRegistration(this.tenantRegistrationModel).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe(res => {
            window.location.href = res.loginLink;
        });
    }

    isFormValid(): boolean {
        let isValidObj = this.agreedTermsAndServices && this.firstStepForm && this.firstStepForm.valid && (!this.phoneNumber || this.phoneNumber.isValid()) && this.isInStock &&
            (!this.productInfo.data.isStripeTaxationEnabled || (this.billingAddress.countryId && this.billingAddress.zip &&
                (this.billingAddress.stateId || this.billingAddress.stateName) && this.billingAddress.city));
        return !!isValidObj;
    }

    getSubmitRequest(paymentGateway: string): Observable<SubmitProductRequestOutput> {
        if (this.productInfo.data.isStripeTaxationEnabled) {
            if (this.googleAutoComplete) {
                this.billingAddress.streetAddress = this.addressInput.nativeElement.value;
            }
            this.billingAddress.countryId = this.getCountryCode(this.address.countryName);
            this.billingAddress.stateId = this.statesService.getAdjustedStateCode(
                this.billingAddress.stateId,
                this.billingAddress.stateName
            );

            if (!this.billingAddress.countryId || !this.billingAddress.zip ||
                !(this.billingAddress.stateId || this.billingAddress.stateName) ||
                !this.billingAddress.city || !this.billingAddress.streetAddress) {

                abp.notify.error(this.ls.l('Invalid Address'));
                return of();
            }
        }

        if (this.productInfo.data.hasDiscordService && this.productInfo.data.discordAppId && !this.requestInfo.discordUserId) {
            abp.notify.error(this.ls.l('Please authorize Discord before submit'));
            return of();
        }

        let submitPriceOption = this.selectedPriceOption;
        if ((submitPriceOption.customerChoosesPrice && (!submitPriceOption.fee || this.customerPriceEditMode))) {
            abp.notify.error(this.ls.l('Invalid Price'));
            return of();
        }

        if (!this.isInStock || (this.productInfo.stock != null && this.productInfo.stock - this.productInput.quantity < 0)) {
            abp.notify.error(this.ls.l('Invalid Quantity'));
            return of();
        }

        if (submitPriceOption.type == PriceOptionType.OneTime && this.productInfo.productAddOns && this.productInfo.productAddOns.length) {
            if (this.productInfo.productAddOns.some(v => v.required && !v.productAddOnOptions.some(o => o['selected']))) {
                abp.notify.error(this.ls.l('Select an option for required Add-Ons'));
                return of();
            }
        }

        if (!this.isFormValid()) {
            abp.notify.error(this.ls.l('SaleProductValidationError'));
            return of();
        }

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.requestInfo.phone = undefined;

        this.requestInfo.tenantId = this.tenantId;
        this.requestInfo.affiliateCode = this.ref;
        this.requestInfo.paymentGateway = paymentGateway;
        this.productInput.productId = this.productInfo.id;
        this.productInput.optionId = submitPriceOption.id;
        if (this.isFreeProductSelected || submitPriceOption.customerChoosesPrice)
            this.requestInfo.couponCode = null;
        this.requestInfo.billingAddress = this.billingAddress;

        this.productInput.unit = submitPriceOption.unit;
        if (submitPriceOption.customerChoosesPrice || this.productInfo.type == ProductType.Donation)
            this.productInput.price = submitPriceOption.fee;

        if (submitPriceOption.type == PriceOptionType.OneTime)
            this.productInput.addOnOptionIds = this.getSelectedAddOns().map(v => v.id);

        if (this.embeddedCheckout) {
            this.requestInfo.embeddedPayment = this.embeddedCheckout;
            this.requestInfo.returnUrl = `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/{initialInvoiceXref}`;
        } else {
            this.requestInfo.successUrl = `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/{initialInvoiceXref}`;
            this.requestInfo.cancelUrl = location.href;
        }

        return this.publicProductService.submitProductRequest(this.requestInfo).pipe(
            tap(v => { this.initialInvoiceXref = v.initialInvoicePublicId })
        );
    }

    redirectToReceipt() {
        abp.ui.setBusy();
        location.href = this.getReceiptUrl();
    }

    getReceiptUrl() {
        return `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/${this.initialInvoiceXref}`;
    }

    openConditionsDialog(type: ConditionsType) {
        window.open(this.conditionsModalService.getHtmlUrl(type, this.tenantId), '_blank');
    }

    initPriceOptions() {
        this.productInfo.priceOptions.forEach(v => {
            if (v.customerChoosesPrice)
                v['initialFee'] = v.fee;
        });

        let selectedPriceOption = this.productInfo.priceOptions[0];
        if (this.optionId) {
            selectedPriceOption = this.productInfo.priceOptions.find(v => v.id == this.optionId);
        }

        this.onPriceOptionChanged(selectedPriceOption);
    }

    checkIsFree() {
        let selectedAddOnsAmount = this.getSelectedAddOns().reduce((p, c) => p += c.price, 0);
        let currentIsFreeProductSelected = this.isFreeProductSelected;
        this.isFreeProductSelected = (this.selectedPriceOption.fee + selectedAddOnsAmount) == 0 && !this.selectedPriceOption.customerChoosesPrice;
        if (this.isFreeProductSelected && !currentIsFreeProductSelected)
            this.productInput.quantity = 1;
    }

    initConditions() {
        this.hasToSOrPolicy = this.productInfo.data.tenantHasTerms || this.productInfo.data.tenantHasPrivacyPolicy;
        this.agreedTermsAndServices = !this.hasToSOrPolicy;
    }

    showStripeButton() {
        if (this.selectedPriceOption.type == PriceOptionType.Subscription) {
            if (this.selectedPriceOption.trialDayCount > 0 && this.singlePaymentOptions.includes(this.selectedPriceOption.frequency))
                return false;
        }

        return this.productInfo.data.stripeConfigured;
    }

    showPayPalButton() {
        if (this.selectedPriceOption.type == PriceOptionType.Subscription) {
            if (this.selectedPriceOption.trialDayCount > 0 && this.singlePaymentOptions.includes(this.selectedPriceOption.frequency))
                return false;

            if (this.couponInfo && this.getSubscriptionPrice(true) == 0)
                return false;
        }

        if (this.productInfo.data.isStripeTaxationEnabled)
            return false;

        return this.productInfo.data.paypalClientId &&
            (!this.couponInfo || this.couponInfo.duration == CouponDiscountDuration.Forever);
    }

    showSpreedlyButtons() {
        if (!this.productInfo.data.spreedlyConfiguration?.spreedlyGateways.length)
            return false;

        if (this.selectedPriceOption.type == PriceOptionType.Subscription &&
            (this.selectedPriceOption.trialDayCount > 0 || !this.singlePaymentOptions.includes(this.selectedPriceOption.frequency)))
            return false;

        if (this.productInfo.data.isStripeTaxationEnabled)
            return false;

        return !!this.productInfo.data.spreedlyConfiguration.spreedlyGateways.length;
    }

    showSubmitButton() {
        if (this.isFreeProductSelected)
            return true;

        if (this.selectedPriceOption.type == PriceOptionType.Subscription && this.couponInfo &&
            this.singlePaymentOptions.includes(this.selectedPriceOption.frequency) &&
            this.getSubscriptionPrice(true) == 0)
            return true;

        if (this.selectedPriceOption.type == PriceOptionType.OneTime && this.couponInfo && this.getGeneralPrice(true) == 0)
            return true;

        return false;
    }

    onPriceOptionChanged(value: PublicPriceOptionInfo) {
        this.selectedPriceOption = value;

        this.initCustomerPrice();
        this.calculateTax();
        this.updatePriceOptionPaypalButton();
        this.checkIsFree();
    }

    updatePriceOptionPaypalButton() {
        this.paypalButtonType = this.selectedPriceOption.type == PriceOptionType.OneTime || this.singlePaymentOptions.includes(this.selectedPriceOption.frequency) ?
            ButtonType.Payment :
            ButtonType.Subscription;
    }

    getSubscriptionPrice(includeCoupon: boolean) {
        let price = this.selectedPriceOption.fee;
        if (includeCoupon) {
            if (!this.selectedPriceOption.trialDayCount ||
                (this.selectedPriceOption.trialDayCount && !this.selectedPriceOption.signupFee) ||
                (this.couponInfo && this.couponInfo.duration != CouponDiscountDuration.Once))
                price = this.applyCoupon(price);
        }
        return price;
    }

    getSignUpFee(includeCoupon: boolean): number {
        let fee = this.selectedPriceOption.signupFee;
        if (includeCoupon) {
            let usedAmountOff = 0;
            if (!this.selectedPriceOption.trialDayCount) {
                usedAmountOff = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            }
            fee = this.applyCoupon(fee, usedAmountOff);
        }

        return fee;
    }

    getPriceDescription(): string {
        var description = this.getPricePeriodDescription();
        if (this.selectedPriceOption.cycles)
            description += `, ${this.selectedPriceOption.cycles} billing cycles`;

        return description;
    }

    getPricePeriodDescription() {
        if (this.selectedPriceOption.frequency == RecurringPaymentFrequency.Custom) {
            return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedPriceOption.customPeriodCount,
                this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedPriceOption.customPeriodType]));
        } else if (this.selectedPriceOption.frequency == RecurringPaymentFrequency.OneTime) {
            return this.ls.l('price' + this.selectedPriceOption.frequency, this.selectedPriceOption.customPeriodCount);
        } else {
            return this.ls.l('price' + this.selectedPriceOption.frequency);
        }
    }

    getGeneralPrice(includeCoupon: boolean, includeAddOns: boolean = true): number {
        let pricePerItem = this.selectedPriceOption.fee;
        if (includeAddOns) {
            pricePerItem += this.getSelectedAddOns().reduce((p, c) => p += c.price, 0);
        }
        let price = pricePerItem * this.productInput.quantity;
        if (includeCoupon)
            price = this.applyCoupon(price);
        return price;
    }

    getSelectedAddOns(): PublicProductAddOnOptionInfo[] {
        if (this.productInfo.productAddOns && this.productInfo.productAddOns.length)
            return this.productInfo.productAddOns.flatMap(v => v.productAddOnOptions).filter(v => v['selected']);
        return [];
    }

    getDiscount(): number {
        if (this.selectedPriceOption.type == PriceOptionType.Subscription) {
            let amount = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            if (this.selectedPriceOption.signupFee)
                amount = amount + this.getSignUpFee(false) - this.getSignUpFee(true);
            return amount;
        }

        return this.getGeneralPrice(false) - this.getGeneralPrice(true);
    }

    changeQuantity(quantity: number) {
        this.productInput.quantity = quantity;
        this.calculateTax();
    }

    couponChange() {
        this.showCouponError = false;
    }

    loadCouponInfo() {
        if (!this.requestInfo.couponCode)
            return;

        if (this.couponInfoCache.hasOwnProperty(this.requestInfo.couponCode)) {
            this.couponInfo = this.couponInfoCache[this.requestInfo.couponCode];
            this.calculateTax();
            this.changeDetector.detectChanges();
            return;
        }

        this.couponLoading = true;
        this.publicProductService.getCouponInfo(this.tenantId, this.requestInfo.couponCode, this.productInfo.currencyId)
            .pipe(
                finalize(() => {
                    this.couponLoading = false;
                    this.changeDetector.detectChanges();
                })
            )
            .subscribe(info => {
                info = Object.keys(info).length == 0 ? null : info;
                if (info) {
                    this.setCouponDescription(info);
                } else {
                    this.showCouponError = true;
                }
                this.couponInfo = info;
                this.couponInfoCache[this.requestInfo.couponCode] = info;
                this.calculateTax();
            });
    }

    setCouponDescription(coupon: PublicCouponInfo): void {
        let description = coupon.percentOff ?
            `${coupon.percentOff}%` : `${coupon.amountOff} ${this.currencySymbol}`;

        coupon['description'] = `${description} Off ${coupon.duration}`;
    }

    applyCoupon(amount: number, usedAmountOff: number = 0): number {
        if (!this.couponInfo)
            return amount;

        if (this.couponInfo.amountOff)
            return amount - this.couponInfo.amountOff + usedAmountOff > 0 ? amount - this.couponInfo.amountOff + usedAmountOff : 0;

        return amount - round(amount * (this.couponInfo.percentOff / 100), 2);
    }

    clearCoupon() {
        this.couponInfo = null;
        this.requestInfo.couponCode = null;
        this.showCouponError = false;
        this.calculateTax();
    }

    getTenantButtonText(): string {
        let buttonText = 'Start ';
        if (this.selectedPriceOption.trialDayCount) {
            buttonText += 'Your ';
            if (!this.selectedPriceOption.signupFee)
                buttonText += ' Free ';
            buttonText += `${this.selectedPriceOption.trialDayCount}-Day Trial `;
        }
        buttonText += 'Today!';
        return buttonText;
    }

    initCustomerPrice() {
        let customerChoosesPrice = this.selectedPriceOption.customerChoosesPrice;
        if (!customerChoosesPrice) {
            this.customerPriceEditMode = false;
            return;
        }

        this.selectedPriceOption.fee = this.selectedPriceOption.fee || this.selectedPriceOption['initialFee'];
        this.clearCoupon();

        if (!this.selectedPriceOption.fee) {
            this.customerPriceEditMode = true;
            this.focusCustomerPriceInput();
        } else {
            if (this.selectedPriceOption.minCustomerPrice && this.selectedPriceOption.fee < this.selectedPriceOption.minCustomerPrice ||
                this.selectedPriceOption.maxCustomerPrice && this.selectedPriceOption.fee > this.selectedPriceOption.maxCustomerPrice)
                this.selectedPriceOption.fee = this.selectedPriceOption['initialFee'];

            this.customerPriceEditMode = false;
        }

        this.initCustomerPriceInputErrorDefs(this.selectedPriceOption.minCustomerPrice, this.selectedPriceOption.maxCustomerPrice);
    }

    initCustomerPriceInputErrorDefs(min, max) {
        this.customerPriceInputErrorDefs = [
            { required: this.ls.l('Invalid Price') },
            { pattern: this.ls.l('Invalid Price') }
        ];

        if (min)
            this.customerPriceInputErrorDefs.push({ min: `${this.ls.l('The minimum amount is ')}${this.currencySymbol}${min}` });
        if (max)
            this.customerPriceInputErrorDefs.push({ max: `${this.ls.l('The maximum amount is ')}${this.currencySymbol}${max}` });
    }

    showCustomerPriceInput() {
        this.customerPriceEditMode = true;
        this.focusCustomerPriceInput();
    }

    customerPriceFocusOut(event, input) {
        if (!input.valid) {
            event.preventDefault();
        }
        else {
            this.customerPriceEditMode = false;
            this.calculateTax();
        }
    }

    focusCustomerPriceInput() {
        setTimeout(() => {
            if (this.customerPriceElement && this.customerPriceElement.nativeElement)
                this.customerPriceElement.nativeElement.focus();
        });
    }

    onAddOnChange(addOn: ProductAddOnDto, addOnOption: ProductAddOnOptionDto, newValue: boolean) {
        let recalculateTaxes = !!addOnOption.price;
        if (newValue && !addOn.multiselect) {
            addOn.productAddOnOptions.forEach(v => {
                if (v.id != addOnOption.id && v['selected']) {
                    recalculateTaxes = recalculateTaxes || !!v.price;
                    v['selected'] = false;
                }
            });
        }

        if (recalculateTaxes)
            this.calculateTax();

        this.checkIsFree();
    }

    getDonationSuggestedAmounts(): ProductDonationSuggestedAmountInfo[] {
        const donation = this.productInfo.productDonation;
        if (!donation)
            return [];

        const suggestions = donation.productDonationSuggestedAmounts;
        const min = this.selectedPriceOption.minCustomerPrice;
        const max = this.selectedPriceOption.maxCustomerPrice;

        if (!min && !max) return suggestions;

        return suggestions.filter(({ amount }) =>
            (!min || amount >= min) && (!max || amount <= max)
        );
    }

    selectSuggestedAmount(suggestedAmount: ProductDonationSuggestedAmountInfo) {
        this.customerPriceEditMode = false;
        this.selectedPriceOption.fee = suggestedAmount.amount;
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((countries: CountryDto[]) => {
            this.countries = countries;
            this.changeDetector.detectChanges();
        });
    }

    onCountryChange(event) {
        let countryCode = this.getCountryCode(event.value);
        this.address.countryCode = countryCode;
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        }

        this.statesService.updateState(countryCode, this.billingAddress.stateId, this.billingAddress.stateName);
        this.calculateTax();
        this.changeDetector.detectChanges();
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.address.countryCode }),
            map((states: CountryStateDto[]) => states || [])
        );
    }

    stateChanged(e) {
        if (e.value) {
            this.store$.pipe(
                select(StatesStoreSelectors.getStateCodeFromStateName, {
                    countryCode: this.address.countryCode,
                    stateName: e.value
                }),
                first()
            ).subscribe((stateCode: string) => {
                this.billingAddress.stateId = stateCode;
                this.calculateTax();
            });
        }
    }

    onCustomStateCreate(e) {
        this.billingAddress.stateId = null;
        this.billingAddress.stateName = e.text;
        this.statesService.updateState(this.address.countryCode, null, e.text);
        e.customItem = {
            code: null,
            name: e.text
        };
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, { name: name });
        return country && country.code;
    }

    onAddressChanged(address: Address) {
        const countryCode = GooglePlaceService.getCountryCode(address.address_components);
        const stateCode = GooglePlaceService.getStateCode(address.address_components);
        const stateName = GooglePlaceService.getStateName(address.address_components);
        this.statesService.updateState(countryCode, stateCode, stateName);
        const countryName = GooglePlaceService.getCountryName(address.address_components);
        this.address.countryName = this.sessionService.getCountryNameByCode(countryCode) || countryName;
        this.billingAddress.zip = GooglePlaceService.getZipCode(address.address_components);
        this.address.street = GooglePlaceService.getStreet(address.address_components);
        this.address.streetNumber = GooglePlaceService.getStreetNumber(address.address_components);
        this.billingAddress.stateId = stateCode;
        this.billingAddress.stateName = stateName;
        this.address.countryCode = countryCode;
        this.billingAddress.city = GooglePlaceService.getCity(address.address_components);
        this.address.address = this.addressInput.nativeElement.value = (this.address.streetNumber
            ? this.address.streetNumber + ' ' + this.address.street
            : this.address.street) || '';
    }

    calculateTax() {
        if (!this.productInfo?.data?.isStripeTaxationEnabled)
            return;

        this.taxCalculation = null;

        clearTimeout(this.calculationTaxTimeout);
        this.calculationTaxTimeout = setTimeout(() => {
            this.calculateTaxFunc();
        }, 500);

    }

    calculateTaxFunc() {
        this.billingAddress.countryId = this.getCountryCode(this.address.countryName);
        this.billingAddress.stateId = this.statesService.getAdjustedStateCode(
            this.billingAddress.stateId,
            this.billingAddress.stateName
        );

        if (!this.billingAddress.countryId || (this.billingAddress.countryId == 'US' && !this.billingAddress.zip)
            || (this.billingAddress.countryId == 'CA' && !this.billingAddress.zip && !this.billingAddress.stateId))
            return;

        this.taxCalcInfo.tenantId = this.tenantId;
        this.taxCalcInfo.paymentGateway = 'Stripe';
        this.taxCalcInfo.stateId = this.billingAddress.stateId;
        this.taxCalcInfo.zip = this.billingAddress.zip;
        this.taxCalcInfo.countryId = this.billingAddress.countryId;
        this.taxCalcInfo.currency = this.productInfo.currencyId;

        this.productTaxInput.productId = this.productInfo.id;
        this.productTaxInput.stripeTaxProcuctCode = this.productInfo.stripeTaxProcuctCode;
        this.productTaxInput.quantity = 1;

        if (this.selectedPriceOption.customerChoosesPrice || this.productInfo.type === ProductType.Donation) {
            this.productTaxInput.price = this.selectedPriceOption.fee;
        } else {
            this.productTaxInput.price = this.selectedPriceOption.type === PriceOptionType.OneTime ?
                this.getGeneralPrice(true) :
                this.getSubscriptionPrice(true);
        }
        if (this.selectedPriceOption.type === PriceOptionType.Subscription)
            this.productTaxInput.price += this.getSignUpFee(true);

        this.appHttpConfiguration.avoidErrorHandling = true;
        this.publicProductService
            .getTaxCalculation(this.taxCalcInfo)
            .pipe(
                finalize(() => {
                    this.appHttpConfiguration.avoidErrorHandling = false;
                })
            )
            .subscribe(result => {
                this.taxCalculation = result;
                this.changeDetector.detectChanges();
            });
    }

    discordOAuth() {
        let scopes = ['email', 'identify', 'guilds.join'];
        let scopesString = scopes.join('%20');
        let redirectUrl = `${AppConsts.appConfigOrigin.remoteServiceBaseUrl}/account/oauth-redirect?provider=discord`;
        let popupUrl = 'https://discord.com/oauth2/authorize?response_type=code&client_id=' + this.productInfo.data.discordAppId +
            `&redirect_uri=${redirectUrl}&state=${this.tenantId}&scope=${scopesString}&prompt=none`;

        this.discordPopup = window.open(popupUrl, 'discordOAuth', 'width=500,height=600');
        if (!this.discordPopup) {
            abp.notify.error('Please allow popups to authorize in Discord');
            return;
        }

        const popupCheckInterval = setInterval(() => {
            if (this.discordPopup.closed) {
                this.discordPopup = null;
                clearInterval(popupCheckInterval);
                window.removeEventListener('message', messageHandler);
            }
        }, 500);

        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== AppConsts.remoteServiceBaseUrl)
                return;

            if (event.data.code) {
                const authCode = event.data.code;
                this.externalUserDataService.getUserData(new GetExternalUserDataInput({
                    tenantId: 0,
                    provider: 'Discord',
                    exchangeCode: authCode,
                    loginReturnUrl: redirectUrl,
                    options: null,
                    vault: true
                })).subscribe(res => {
                    this.requestInfo.discordUserId = res.additionalData["Id"];
                    this.requestInfo.discordUserName = res.additionalData["Username"];
                    if (!this.requestInfo.email && res.emailAddress)
                        this.requestInfo.email = res.emailAddress;
                    this.changeDetector.detectChanges();
                });
            } else {
                abp.notify.error(event.data.error || 'Failed to get ');
            }

            clearInterval(popupCheckInterval);
            window.removeEventListener('message', messageHandler);
            this.discordPopup.close();
            this.discordPopup = null;
        };

        window.addEventListener('message', messageHandler);
    }
}