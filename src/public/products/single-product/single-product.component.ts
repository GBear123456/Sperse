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
    PublicProductSubscriptionOptionInfo,
    RecurringPaymentFrequency,
    SubmitProductRequestInput,
    SubmitProductRequestOutput,
    SubmitTenancyRequestInput,
    TaxCalculationResultDto,
    TenantProductInfo,
    TenantSubscriptionServiceProxy
} from '@root/shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
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
    billingPeriod = BillingPeriod;

    defaultCountryCode = abp.setting.get('App.TenantManagement.DefaultCountryCode');
    selectedSubscriptionOption: PublicProductSubscriptionOptionInfo;
    static availablePeriodsOrder = [BillingPeriod.Monthly, BillingPeriod.Yearly, BillingPeriod.LifeTime, BillingPeriod.OneTime, BillingPeriod.Custom];
    availablePeriods: BillingPeriod[] = [];
    selectedBillingPeriod;
    isFreeProductSelected = false;

    initialInvoiceXref: string = null;

    couponLoading: boolean = false;
    showCouponError: boolean = false;
    couponInfo: PublicCouponInfo = null;
    couponInfoCache: { [code: string]: PublicCouponInfo } = {};
    optionId: number;

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
            let type: ButtonType;
            if (this.productInfo.type == ProductType.General || this.productInfo.type == ProductType.Digital || this.productInfo.type == ProductType.Event || this.productInfo.type == ProductType.Donation)
                type = ButtonType.Payment;
            else {
                let hasPayment = false;
                let hasRecurring = false;
                let singlePaymentOptions = [RecurringPaymentFrequency.LifeTime, RecurringPaymentFrequency.OneTime];
                this.productInfo.productSubscriptionOptions.map(v => {
                    if (singlePaymentOptions.includes(v.frequency))
                        hasPayment = true
                    else
                        hasRecurring = true;
                });

                type = hasRecurring && hasPayment ? ButtonType.Both :
                    hasRecurring ? ButtonType.Subscription : ButtonType.Payment;
            }
            this.payPal.initialize(this.productInfo.data.paypalClientId, type,
                this.getPayPalRequest.bind(this),
                this.getPayPalRequest.bind(this),
                this.productInfo.currencyId
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

                    this.isInStock = this.productInfo.stock == null || this.productInfo.stock > 0;
                    this.isDonationGoalReached = this.productInfo.type == ProductType.Donation && this.productInfo.productDonation.goalAmount &&
                        this.productInfo.productDonation.raisedAmount >= this.productInfo.productDonation.goalAmount;

                    if (this.isInStock && (!this.isDonationGoalReached || this.productInfo.productDonation.keepActiveIfGoalReached)) {
                        this.currencySymbol = getCurrencySymbol(result.currencyId, 'narrow');
                        this.showNoPaymentSystems = !result.data.paypalClientId && !result.data.stripeConfigured;
                        this.titleService.setTitle(this.productInfo.name);
                        if (result.descriptionHtml)
                            this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(result.descriptionHtml);
                        if (result.data.hasTenantService)
                            this.initializePasswordComplexity();
                        this.initConditions();
                        this.initSubscriptionProduct();
                        this.initCustomerPrice();
                        this.initializePayPal();
                        this.checkIsFree();
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
            return of();
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
            priceOptionId: this.selectedSubscriptionOption.id,
            paymentPeriodType: PaymentPeriodType[this.selectedSubscriptionOption.frequency],
            quantity: 1
        })];
        tenancyRequestModel.couponCode = this.isFreeProductSelected || this.productInfo.customerChoosesPrice ? null : this.requestInfo.couponCode;
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
        if (this.googleAutoComplete) {
            this.billingAddress.streetAddress = [
                this.address['streetNumber'],
                this.address['street']
            ].filter(val => val).join(' ');
        }
        this.billingAddress.countryId = this.getCountryCode(this.address.countryName);
        this.billingAddress.stateId = this.statesService.getAdjustedStateCode(
            this.billingAddress.stateId,
            this.billingAddress.stateName
        );

        if (this.productInfo.data.isStripeTaxationEnabled && (!this.billingAddress.countryId || !this.billingAddress.zip ||
            !this.billingAddress.stateId || !this.billingAddress.city || !this.billingAddress.streetAddress)) {
            abp.notify.error(this.ls.l('Invalid Address'));
            return of();
        }

        if ((this.productInfo.customerChoosesPrice && (!this.productInfo.price || this.customerPriceEditMode)) ||
            (this.selectedSubscriptionOption && this.selectedSubscriptionOption.customerChoosesPrice && (!this.selectedSubscriptionOption.fee || this.customerPriceEditMode))) {
            abp.notify.error(this.ls.l('Invalid Price'));
            return of();
        }

        if (!this.isInStock || (this.productInfo.stock != null && this.productInfo.stock - this.productInput.quantity < 0)) {
            abp.notify.error(this.ls.l('Invalid Quantity'));
            return of();
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
        if (this.isFreeProductSelected || this.productInfo.customerChoosesPrice || (this.selectedSubscriptionOption && this.selectedSubscriptionOption.customerChoosesPrice))
            this.requestInfo.couponCode = null;
        this.requestInfo.billingAddress = this.billingAddress;

        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
            case ProductType.Event:
            case ProductType.Donation:
                this.productInput.unit = this.productInfo.unit;
                if (this.productInfo.customerChoosesPrice || this.productInfo.type == ProductType.Donation)
                    this.productInput.price = this.productInfo.price;

                break;
            case ProductType.Subscription:
                this.productInput.optionId = this.selectedSubscriptionOption.id;
                this.productInput.unit = PaymentService.getProductMeasurementUnit(this.selectedSubscriptionOption.frequency);
                if (this.selectedSubscriptionOption.customerChoosesPrice)
                    this.productInput.price = this.selectedSubscriptionOption.fee;
                break;
        }

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

    onPayPalApprove() {
        location.href = this.getReceiptUrl();
    }

    getReceiptUrl() {
        return `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/${this.initialInvoiceXref}`;
    }

    openConditionsDialog(type: ConditionsType) {
        window.open(this.conditionsModalService.getHtmlUrl(type, this.tenantId), '_blank');
    }

    initSubscriptionProduct() {
        if (this.productInfo.type != ProductType.Subscription)
            return;

        let periods: RecurringPaymentFrequency[] = [];
        this.productInfo.productSubscriptionOptions.forEach(v => {
            periods.push(v.frequency);

            if (v.customerChoosesPrice)
                v['initialFee'] = v.fee;
        });

        let billingPeriods = periods.map(v => PaymentService.getBillingPeriodByPaymentFrequency(v));
        this.availablePeriods = [];
        SingleProductComponent.availablePeriodsOrder.forEach(v => {
            if (billingPeriods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });

        let selectedBillingPeriod = this.availablePeriods[0];
        if (this.optionId) {
            const selectedOption = this.productInfo.productSubscriptionOptions.find(v => v.id == this.optionId);
            if (selectedOption)
                selectedBillingPeriod = PaymentService.getBillingPeriodByPaymentFrequency(selectedOption.frequency);
        }

        this.toggle(selectedBillingPeriod);
    }

    checkIsFree() {
        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
            case ProductType.Event:
                this.isFreeProductSelected = this.productInfo.price == 0 && !this.productInfo.customerChoosesPrice;
                break;
            case ProductType.Subscription:
                this.isFreeProductSelected = this.selectedSubscriptionOption.fee == 0 && !this.selectedSubscriptionOption.customerChoosesPrice;
                break;
        }
    }

    initConditions() {
        this.hasToSOrPolicy = this.productInfo.data.tenantHasTerms || this.productInfo.data.tenantHasPrivacyPolicy;
        this.agreedTermsAndServices = !this.hasToSOrPolicy;
    }

    showStripeButton() {
        if (this.productInfo.type == ProductType.Subscription) {
            if (this.selectedSubscriptionOption.trialDayCount > 0 &&
                (this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.LifeTime ||
                    this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.OneTime))
                return false;
        }

        return this.productInfo.data.stripeConfigured;
    }

    showPayPalButton() {
        if (this.productInfo.type == ProductType.Subscription) {
            if (this.selectedSubscriptionOption.trialDayCount > 0 &&
                (this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.LifeTime ||
                    this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.OneTime))
                return false;

            if (this.couponInfo && this.getSubscriptionPrice(true) == 0)
                return false;
        }

        if (this.productInfo.data.isStripeTaxationEnabled)
            return false;

        return this.productInfo.data.paypalClientId &&
            (!this.couponInfo || this.couponInfo.duration == CouponDiscountDuration.Forever);
    }

    showSubmitButton() {
        if (this.isFreeProductSelected)
            return true;

        if (this.productInfo.type == ProductType.Subscription && this.couponInfo &&
            (this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.OneTime ||
                this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.LifeTime) &&
            this.getSubscriptionPrice(true) == 0)
            return true;

        if (this.productInfo.type != ProductType.Subscription && this.couponInfo && this.getGeneralPrice(true) == 0)
            return true;

        return false;
    }

    getActiveStatus(period: BillingPeriod) {
        return this.selectedBillingPeriod == period;
    }

    toggle(value: BillingPeriod) {
        this.selectedBillingPeriod = value;
        this.updateSelectedSubscriptionOption();
        this.updateSubscriptionOptionPaypalButton();
        this.checkIsFree();
    }

    getSliderValue(): number {
        let periodIndex = this.availablePeriods.findIndex(v => v == this.selectedBillingPeriod);
        let value = periodIndex * (100 / this.availablePeriods.length);
        return +value.toFixed();
    }

    updateSelectedSubscriptionOption() {
        this.selectedSubscriptionOption = this.productInfo.productSubscriptionOptions.find(v => v.frequency == PaymentService.getRecurringPaymentFrequency(this.selectedBillingPeriod));
        this.initCustomerPrice();
        this.calculateTax();
    }

    updateSubscriptionOptionPaypalButton() {
        this.paypalButtonType = this.selectedBillingPeriod == BillingPeriod.OneTime || this.selectedBillingPeriod == BillingPeriod.LifeTime ?
            ButtonType.Payment :
            ButtonType.Subscription;
    }

    getSubscriptionPrice(includeCoupon: boolean) {
        let price = this.selectedSubscriptionOption.fee;
        if (includeCoupon) {
            if (!this.selectedSubscriptionOption.trialDayCount ||
                (this.selectedSubscriptionOption.trialDayCount && !this.selectedSubscriptionOption.signupFee) ||
                (this.couponInfo && this.couponInfo.duration != CouponDiscountDuration.Once))
                price = this.applyCoupon(price);
        }
        return price;
    }

    getSignUpFee(includeCoupon: boolean): number {
        let fee = this.selectedSubscriptionOption.signupFee;
        if (includeCoupon) {
            let usedAmountOff = 0;
            if (!this.selectedSubscriptionOption.trialDayCount) {
                usedAmountOff = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            }
            fee = this.applyCoupon(fee, usedAmountOff);
        }

        return fee;
    }

    getPriceDescription(): string {
        var description = this.getPricePeriodDescription();
        if (this.selectedSubscriptionOption.cycles)
            description += `, ${this.selectedSubscriptionOption.cycles} billing cycles`;

        return description;
    }

    getPricePeriodDescription() {
        if (this.selectedBillingPeriod == BillingPeriod.Custom) {
            return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedSubscriptionOption.customPeriodCount,
                this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedSubscriptionOption.customPeriodType]));
        } else if (this.selectedBillingPeriod == BillingPeriod.OneTime) {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod], this.selectedSubscriptionOption.customPeriodCount);
        } else if (this.selectedBillingPeriod == BillingPeriod.Yearly)
            return this.ls.l(BillingPeriod[this.selectedBillingPeriod]);
        else {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod]);
        }
    }

    getGeneralPrice(includeCoupon: boolean): number {
        let price = this.productInfo.price * this.productInput.quantity;
        if (includeCoupon)
            price = this.applyCoupon(price);
        return price;
    }

    getDiscount(): number {
        if (this.productInfo.type == ProductType.Subscription) {
            let amount = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            if (this.selectedSubscriptionOption.signupFee)
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
        if (this.selectedSubscriptionOption.trialDayCount) {
            buttonText += 'Your ';
            if (!this.selectedSubscriptionOption.signupFee)
                buttonText += ' Free ';
            buttonText += `${this.selectedSubscriptionOption.trialDayCount}-Day Trial `;
        }
        buttonText += 'Today!';
        return buttonText;
    }

    initCustomerPrice() {
        let customerChoosesPrice, price, min, max;
        if (this.productInfo.type == ProductType.Subscription) {
            customerChoosesPrice = this.selectedSubscriptionOption.customerChoosesPrice;
            if (customerChoosesPrice) {
                this.selectedSubscriptionOption.fee = this.selectedSubscriptionOption.fee || this.selectedSubscriptionOption['initialFee'];
                this.clearCoupon();
            }
            price = this.selectedSubscriptionOption.fee;
            min = this.selectedSubscriptionOption.minCustomerPrice;
            max = this.selectedSubscriptionOption.maxCustomerPrice;
        } else {
            customerChoosesPrice = this.productInfo.customerChoosesPrice;
            price = this.productInfo.price;
            min = this.productInfo.minCustomerPrice;
            max = this.productInfo.maxCustomerPrice;
        }

        if (!customerChoosesPrice) {
            this.customerPriceEditMode = false;
            return;
        }

        if (!price) {
            this.customerPriceEditMode = true;
            this.focusCustomerPriceInput();
        } else {
            this.customerPriceEditMode = false;
        }

        this.initCustomerPriceInputErrorDefs(min, max);
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

    selectSuggestedAmount(suggestedAmount: ProductDonationSuggestedAmountInfo) {
        this.customerPriceEditMode = false;
        this.productInfo.price = suggestedAmount.amount;
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
        this.productTaxInput.price = this.getGeneralPrice(true);
        this.productTaxInput.quantity = 1;
        
        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
            case ProductType.Event:
            case ProductType.Donation:
                if (this.productInfo.customerChoosesPrice || this.productInfo.type == ProductType.Donation)
                    this.productTaxInput.price = this.productInfo.price;
                break;
            case ProductType.Subscription:
                if (this.selectedSubscriptionOption.customerChoosesPrice)
                    this.productTaxInput.price = this.selectedSubscriptionOption.fee;
                else
                    this.productTaxInput.price = this.getSubscriptionPrice(true);
                this.productTaxInput.price = this.productTaxInput.price + this.getSignUpFee(true);
                break;
        }
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
}
