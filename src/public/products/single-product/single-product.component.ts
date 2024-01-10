/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import round from 'lodash/round';

/** Application imports */
import {
    CompleteTenantRegistrationInput,
    CouponDiscountDuration,
    CustomPeriodType,
    LeadServiceProxy,
    PasswordComplexitySetting,
    PaymentPeriodType,
    ProductType,
    ProfileServiceProxy,
    PublicCouponInfo,
    PublicProductInfo,
    PublicProductServiceProxy,
    PublicProductSubscriptionOptionInfo,
    RecurringPaymentFrequency,
    SubmitProductRequestInput,
    SubmitProductRequestOutput,
    SubmitTenancyRequestInput,
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

@Component({
    selector: 'single-product',
    templateUrl: 'single-product.component.html',
    styleUrls: [
        './single-product.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleProductComponent implements OnInit {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('phoneNumber') phoneNumber;
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

    productInfo: PublicProductInfo;
    requestInfo: SubmitProductRequestInput = new SubmitProductRequestInput();
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

    constructor(
        private route: ActivatedRoute,
        private titleService: Title,
        private publicProductService: PublicProductServiceProxy,
        private leadProxy: LeadServiceProxy,
        private tenantProxy: TenantSubscriptionServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private changeDetector: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
        private profileService: ProfileServiceProxy,
        public ls: AppLocalizationService,
        public conditionsModalService: ConditionsModalService
    ) {
        this.requestInfo.quantity = 1;
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.productPublicName = this.route.snapshot.paramMap.get('productPublicName');
        this.ref = this.route.snapshot.queryParamMap.get('ref');
        this.optionId = Number(this.route.snapshot.queryParamMap.get('optionId'));

        this.getProductInfo();
    }

    initializePayPal() {
        if (this.payPal && this.productInfo && !this.payPal.initialized) {
            let type: ButtonType;
            if (this.productInfo.type == ProductType.General || this.productInfo.type == ProductType.Digital)
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
                this.productInfo.data.currency
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
                    this.currencySymbol = getCurrencySymbol(result.data.currency, 'narrow');
                    this.showNoPaymentSystems = !result.data.paypalClientId && !result.data.stripeConfigured;
                    this.titleService.setTitle(this.productInfo.name);
                    if (result.descriptionHtml)
                        this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(result.descriptionHtml);
                    if (result.data.hasTenantService)
                        this.initializePasswordComplexity();
                    this.initConditions();
                    this.initSubscriptionProduct();
                    this.initializePayPal();
                    this.checkIsFree();
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
                location.href = res.paymentData;
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
            paymentPeriodType: PaymentPeriodType[this.selectedSubscriptionOption.frequency],
            quantity: 1
        })];
        tenancyRequestModel.couponCode = this.isFreeProductSelected ? null : this.requestInfo.couponCode;
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
        let isValidObj = this.agreedTermsAndServices && this.firstStepForm && this.firstStepForm.valid && (!this.phoneNumber || this.phoneNumber.isValid());
        return !!isValidObj;
    }

    getSubmitRequest(paymentGateway: string): Observable<SubmitProductRequestOutput> {
        if (!this.isFormValid()) {
            abp.notify.error(this.ls.l('SaleProductValidationError'));
            return of();
        }

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.requestInfo.phone = undefined;

        this.requestInfo.tenantId = this.tenantId;
        this.requestInfo.affiliateCode = this.ref;
        this.requestInfo.paymentGateway = paymentGateway;
        this.requestInfo.productId = this.productInfo.id;
        if (this.isFreeProductSelected)
            this.requestInfo.couponCode = null;

        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
                this.requestInfo.unit = this.productInfo.unit;
                break;
            case ProductType.Subscription:
                this.requestInfo.optionId = this.selectedSubscriptionOption.id;
                this.requestInfo.unit = PaymentService.getProductMeasurementUnit(this.selectedSubscriptionOption.frequency);
                break;
        }

        this.requestInfo.successUrl = `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/{initialInvoiceXref}`;
        this.requestInfo.cancelUrl = location.href;

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

        let periods: RecurringPaymentFrequency[] = this.productInfo.productSubscriptionOptions.map(v => v.frequency);

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
                this.isFreeProductSelected = this.productInfo.price == 0;
                break;
            case ProductType.Subscription:
                this.isFreeProductSelected = this.selectedSubscriptionOption.fee == 0;
                break;
        }
    }

    initConditions() {
        if (!this.tenantId) {
            this.hasToSOrPolicy = AppConsts.isSperseHost;
            this.agreedTermsAndServices = !AppConsts.isSperseHost;
        } else {
            this.hasToSOrPolicy = this.productInfo.data.tenantHasTerms || this.productInfo.data.tenantHasPrivacyPolicy;
            this.agreedTermsAndServices = !this.hasToSOrPolicy;
        }
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

            if (this.couponInfo && this.getPricePerPeriod(true) == 0)
                return false;
        }

        return this.productInfo.data.paypalClientId &&
            (!this.couponInfo || this.couponInfo.duration == CouponDiscountDuration.Forever);
    }

    showSubmitButton() {
        if (this.isFreeProductSelected)
            return true;

        if (this.productInfo.type == ProductType.Subscription && this.couponInfo &&
            (this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.OneTime ||
                this.selectedSubscriptionOption.frequency == RecurringPaymentFrequency.LifeTime) &&
            this.getPricePerPeriod(true) == 0)
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
    }

    updateSubscriptionOptionPaypalButton() {
        this.paypalButtonType = this.selectedBillingPeriod == BillingPeriod.OneTime || this.selectedBillingPeriod == BillingPeriod.LifeTime ?
            ButtonType.Payment :
            ButtonType.Subscription;
    }

    getPricePerPeriod(includeCoupon: boolean): number {
        let price = this.selectedSubscriptionOption.fee;
        if (includeCoupon) {
            if (!this.selectedSubscriptionOption.signupFee || (this.couponInfo && this.couponInfo.duration != CouponDiscountDuration.Once))
                price = this.applyCoupon(price);
        }
        return this.selectedBillingPeriod === BillingPeriod.Yearly ?
            round(price / 12, 2) :
            price;
    }

    getSignUpFee(includeCoupon: boolean): number {
        let fee = this.selectedSubscriptionOption.signupFee;
        if (includeCoupon)
            fee = this.applyCoupon(fee);
        return fee;
    }

    getPriceDescription(): string {
        if (this.selectedBillingPeriod == BillingPeriod.Custom) {
            return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedSubscriptionOption.customPeriodCount,
                this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedSubscriptionOption.customPeriodType]));
        } else if (this.selectedBillingPeriod == BillingPeriod.OneTime) {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod], this.selectedSubscriptionOption.customPeriodCount);
        } else {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod]);
        }
    }

    getGeneralPrice(includeCoupon: boolean): number {
        let price = this.productInfo.price * this.requestInfo.quantity;
        if (includeCoupon)
            price = this.applyCoupon(price);
        return price;
    }

    getDiscount(): number {
        if (this.productInfo.type == ProductType.Subscription) {
            let amount = this.getPricePerPeriod(false) - this.getPricePerPeriod(true);
            if (this.selectedSubscriptionOption.trialDayCount)
                amount = amount + this.getSignUpFee(false) - this.getSignUpFee(true);
            return amount;
        }

        return this.getGeneralPrice(false) - this.getGeneralPrice(true);
    }

    changeQuantity(quantity: number) {
        this.requestInfo.quantity = quantity;
    }

    couponChange() {
        this.showCouponError = false;
    }

    loadCouponInfo() {
        if (!this.requestInfo.couponCode)
            return;

        if (this.couponInfoCache.hasOwnProperty(this.requestInfo.couponCode)) {
            this.couponInfo = this.couponInfoCache[this.requestInfo.couponCode];
            this.changeDetector.detectChanges();
            return;
        }

        this.couponLoading = true;
        this.publicProductService.getCouponInfo(this.tenantId, this.requestInfo.couponCode)
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
            });
    }

    setCouponDescription(coupon: PublicCouponInfo): void {
        let description = coupon.percentOff ?
            `${coupon.percentOff}%` : `${coupon.amountOff} ${this.currencySymbol}`;

        coupon['description'] = `${description} Off ${coupon.duration}`;
    }

    applyCoupon(amount: number): number {
        if (!this.couponInfo)
            return amount;

        if (this.couponInfo.amountOff)
            return amount - this.couponInfo.amountOff > 0 ? amount - this.couponInfo.amountOff : 0;

        return round(amount * (1 - this.couponInfo.percentOff / 100), 2);
    }

    clearCoupon() {
        this.couponInfo = null;
        this.requestInfo.couponCode = null;
        this.showCouponError = false;
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
}
