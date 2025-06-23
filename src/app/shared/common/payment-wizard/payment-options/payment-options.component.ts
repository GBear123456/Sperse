<<<<<<< HEAD
/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, Output, Injector, Input, ChangeDetectorRef, ElementRef, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import round from 'lodash/round';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';
import { StatusInfo } from '@app/shared/common/payment-wizard/models/status-info';
import { PaymentMethods } from '@app/shared/common/payment-wizard/models/payment-methods.enum';
import {
    ACHCustomerInfoDto,
    PaymentMethod,
    BankCardInfoDto,
    PaymentRequestInfoDto,
    TenantSubscriptionServiceProxy,
    PayPalInfoDto,
    PaymentInfoType,
    PaymentPeriodType,
    RequestPaymentDto,
    RequestPaymentType,
    ModuleSubscriptionInfo,
    BankTransferSettingsDto,
    RequestPaymentResult,
    RequestPaymentInput,
    PaymentSystemSettingsDto,
    PublicProductServiceProxy,
    CouponDiscountDuration,
    PublicCouponInfo,
    RequestProductPaymentOutput
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppService } from '@app/app.service';
import { PayPalComponent } from '@shared/common/paypal/paypal.component';
import { ButtonType } from '@shared/common/paypal/button-type.enum';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSubscriptionServiceProxy, PublicProductServiceProxy]
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
    private payPal: PayPalComponent;
    @ViewChild(PayPalComponent) set paypPalComponent(paypalComp: PayPalComponent) {
        this.payPal = paypalComp;
        if (this.selectedGateway == this.GATEWAY_PAYPAL)
            this.initializePayPal();
    };

    @Input() plan: PaymentOptions;
    @Input() steps: Step[] = [
        {
            name: this.l('ChooseYourPlan'),
            editable: true,
            completed: true
        },
        {
            name: this.l('PaymentOptions'),
            active: true
        },
        {
            name: this.l('PaymentConfirmation')
        }
    ];
    @Input() phoneNumber = '1-844-773-7739';
    @Output() onChangeStep: EventEmitter<number> = new EventEmitter<number>();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    @Output() onStatusChange: EventEmitter<StatusInfo> = new EventEmitter();
    @Output() refreshAfterClose: EventEmitter<null> = new EventEmitter();

    private paymentMethodsConfig = {
        [PaymentMethods.BankTransfer]: {
            successStatus: () => this.l('pendingBankTransferIntentRecorded'),
            successStatusText: (res: RequestPaymentResult) => this.l('pendingBankTransferReference', res.transactionId),
            showBack: false,
            skipRefreshAfterClose: true,
            downloadPdf: 'assets/documents/Sperse Bank Transfer Sending Instructions.pdf'
        },
        [PaymentMethods.Free]: {
            successStatus: this.l('PaymentStatus_payment-free-confirmed')
        }
    };

    GATEWAY_STRIPE = 0;
    GATEWAY_PAYPAL = 1;
    GATEWAY_C_CARD = 2;
    GATEWAY_ECHECK = 3;

    quantity = 1;

    selectedGateway: number = 0;
    paymentMethods = PaymentMethods;
    bankTransferSettings$: Observable<BankTransferSettingsDto>;
    paymentSystemSettings: PaymentSystemSettingsDto;
    productSubscriptionPreviouslyUsed: boolean = false;
    hasAnyPaymentSystemConfigured = false;
    payPalApplicable: boolean = false;
    stripeApplicable: boolean = false;
    receiptLink: string;

    isPayByStripeDisabled = false;

    couponInfoCache: { [code: string]: PublicCouponInfo } = {};
    couponLoading: boolean = false;
    showCouponError: boolean = false;
    couponInfo: PublicCouponInfo = null;
    couponCode: string = '';

    constructor(
        injector: Injector,
        private appHttpConfiguration: AppHttpConfiguration,
        private appService: AppService,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy,
        private publicProductService: PublicProductServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (this.plan.total)
            this.initPaymentSystems();
    }

    goToStep(i) {
        this.onChangeStep.emit(i);
    }

    getBillingTerm(billingPeriod: BillingPeriod) {
        return billingPeriod === BillingPeriod.Yearly ? 'annually' : 'monthly';
    }

    getProductUnit() {
        switch (this.plan.paymentPeriodType) {
            case PaymentPeriodType.Annual:
                return 'per year';
            case PaymentPeriodType.Monthly:
                return 'per month';
            case PaymentPeriodType.OneTime:
            case PaymentPeriodType.LifeTime:
                return 'per life time';
            case PaymentPeriodType.Custom:
                return this.plan.customPeriodDescription.toLowerCase();
            default:
                return '';
        }
    }

    selectedTabChange(e) {
        if (e.index == this.GATEWAY_PAYPAL)
            this.initializePayPal(true);
        //if (!this.bankTransferSettings$ && e.tab.textLabel === this.l('BankTransfer')) {
        /** Load transfer data */
        //    this.bankTransferSettings$ = this.tenantSubscriptionServiceProxy.getBankTransferSettings();
        //}
    }

    initPaymentSystems() {
        this.startLoading();
        forkJoin(
            [
                this.tenantSubscriptionServiceProxy.getPaymentSettingsInfo(),
                this.tenantSubscriptionServiceProxy.checkPaymentInfo(new RequestPaymentInput({
                    type: RequestPaymentType.PayPal,
                    paymentPeriodType: this.plan.paymentPeriodType,
                    productId: this.plan.productId,
                    quantity: this.quantity,
                    couponId: this.couponInfo ? this.couponInfo.id : undefined
                }))
            ]
        ).subscribe(([settings, productPaymentInfo]) => {
            this.paymentSystemSettings = settings;
            this.productSubscriptionPreviouslyUsed = productPaymentInfo.previouslyUsed;
            this.hasAnyPaymentSystemConfigured = !!settings.paypalClientId || settings.stripeIsEnabled;

            this.stripeApplicable = settings.stripeIsEnabled && productPaymentInfo.applicablePaymentTypes.some(v => v == RequestPaymentType.Stripe);
            this.payPalApplicable = settings.paypalClientId && productPaymentInfo.applicablePaymentTypes.some(v => v == RequestPaymentType.PayPal);

            if (this.payPalApplicable && !this.stripeApplicable) {
                this.GATEWAY_PAYPAL = 0;
                this.initializePayPal();
            }
            this.changeDetector.detectChanges();
            this.finishLoading();
        });
    }

    initializePayPal(reinitialize = false) {
        if (this.payPalApplicable && this.payPal && (!this.payPal.initialized || reinitialize)) {
            let type = this.plan.paymentPeriodType == PaymentPeriodType.OneTime || this.plan.paymentPeriodType == PaymentPeriodType.LifeTime ? ButtonType.Payment : ButtonType.Subscription;
            this.payPal.initialize(this.paymentSystemSettings.paypalClientId, type,
                () => this.payByPaypal(),
                () => this.payByPaypal(),
                this.plan.currencyId
            );
        }
    }

    submitData(data: any, paymentMethod: PaymentMethods = PaymentMethods.Free) {
        /** Go to the third step */
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.appHttpConfiguration.avoidErrorHandling = true;
        let paymentInfo: any = {
            subscriptionInfo: {
                //editionId: this.plan.selectedEditionId,
                //maxUserCount: this.plan.usersAmount,
                // frequency: this.plan.billingPeriod == BillingPeriod.Monthly
                //     ? PaymentPeriodType.Monthly
                //     : PaymentPeriodType.Annual
            }
        };
        switch (paymentMethod) {
            case PaymentMethods.eCheck:
                const eCheckData = data as ECheckDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Charge,
                    paymentInfoType: PaymentInfoType.ACH,
                    achCustomer: ACHCustomerInfoDto.fromJS({
                        customerRoutingNo: eCheckData.routingNumber,
                        customerAcctNo: eCheckData.bankAccountNumber,
                        memo: eCheckData.paymentDescription // this property does not exist !!!
                    })
                });
                break;
            case PaymentMethods.CreditCard:
                const creditCardData = data as BankCardDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Recurring,
                    paymentInfoType: PaymentInfoType.BankCard,
                    bankCard: BankCardInfoDto.fromJS({
                        holderName: creditCardData.holderName,
                        cardNumber: creditCardData.cardNumber.replace(/-|\s/g, ''),
                        expirationMonth: creditCardData.expirationMonth,
                        expirationYear: creditCardData.expirationYear,
                        cvv: creditCardData.cvv,
                        billingAddress: creditCardData.billingAddress,
                        billingZip: creditCardData.billingZip,
                        billingCity: creditCardData.billingCity,
                        billingStateCode: creditCardData.billingStateCode,
                        billingState: creditCardData.billingState['name'],
                        billingCountryCode: creditCardData.billingCountryCode,
                        billingCountry: creditCardData.billingCountry['name'],
                    })
                });
                break;
            case PaymentMethods.PayPal:
                const payPalData = data as PayPalDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Capture,
                    paymentInfoType: PaymentInfoType.PayPal,
                    payPal: PayPalInfoDto.fromJS({
                        paymentId: payPalData.paymentId,
                        payerId: payPalData.payerId
                    })
                });
                break;
            case PaymentMethods.BankTransfer:
                break;
            default:
                break;
        }
        /** Start submitting data and change status in a case of error or success */
        /*
        let method: Observable<any> = paymentMethod == PaymentMethods.PayPal
            ? this.tenantSubscriptionServiceProxy.completeSubscriptionPayment(paymentInfo.billingInfo)
            : paymentMethod === PaymentMethods.BankTransfer
                ? this.tenantSubscriptionServiceProxy.requestPayment(
                    new RequestPaymentDto({
                        subscriptionInfo: ModuleSubscriptionInfo.fromJS({
                            editionId: paymentInfo.subscriptionInfo.editionId,
                            maxUserCount: paymentInfo.subscriptionInfo.maxUserCount,
                            frequency: paymentInfo.subscriptionInfo.frequency
                        }),
                        requestType: RequestPaymentType.ManualBankTransfer
                    })
                )
                : this.tenantSubscriptionServiceProxy.setupSubscription(paymentInfo);

        method.pipe(finalize(() => { this.appHttpConfiguration.avoidErrorHandling = false; }))
            .subscribe(
                res => {
                    if (!this.paymentMethodsConfig[paymentMethod] || !this.paymentMethodsConfig[paymentMethod].skipRefreshAfterClose) {
                        this.refreshAfterClose.emit();
                    }
                    this.appService.loadModuleSubscriptions();
                    this.onStatusChange.emit({
                        status: this.getPaymentStatus(paymentMethod, res),
                        statusText: this.getPaymentStatusText(paymentMethod, res),
                        icon: PaymentStatusEnum.Confirmed,
                        downloadPdf: this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].downloadPdf,
                        showBack: this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].showBack
                    });
                },
                error => {
                    this.onStatusChange.emit({
                        status: PaymentStatusEnum.Failed,
                        statusText: error.message,
                        errorDetailsText: error.details
                    });
                }
            );
            */
    }

    getPaymentStatusText(paymentMethod: PaymentMethods, res: any) {
        let config = this.paymentMethodsConfig[paymentMethod];
        return config && config.successStatusText ?
            typeof config.successStatusText === 'function' ?
                config['successStatusText'](res) : config.successStatusText
            : '';
    }

    getPaymentStatus(paymentMethod: PaymentMethods, res: any) {
        return this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].successStatus ?
            typeof this.paymentMethodsConfig[paymentMethod].successStatus === 'function' ?
                this.paymentMethodsConfig[paymentMethod]['successStatus'](res) :
                this.paymentMethodsConfig[paymentMethod].successStatus
            : PaymentStatusEnum.Confirmed;
    }

    close() {
        this.onClose.emit();
    }

    getPaymentRequest(type: RequestPaymentType): Observable<RequestProductPaymentOutput> {
        return this.tenantSubscriptionServiceProxy.requestProductPayment(new RequestPaymentInput({
            type: type,
            productId: this.plan.productId,
            paymentPeriodType: this.plan.paymentPeriodType,
            quantity: 1,
            couponId: this.couponInfo ? this.couponInfo.id : undefined
        }));
    }

    payByStripe() {
        this.isPayByStripeDisabled = true;
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.getPaymentRequest(RequestPaymentType.Stripe).subscribe((response) => {
            window.location.href = response.stripePaymentLink;
        }, () => {
            this.isPayByStripeDisabled = false;
            this.loadingService.finishLoading(this.elementRef.nativeElement);
        });
    }

    payByPaypal(): Promise<string> {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        return this.getPaymentRequest(RequestPaymentType.PayPal).pipe(
            map(v => {
                this.receiptLink = v.receiptUrl;
                return v.paypalCode
            }),
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).toPromise();
    }

    onPayPalApprove() {
        location.href = this.receiptLink;
    }

    couponChange() {
        this.showCouponError = false;
    }

    clearCoupon() {
        this.couponInfo = null;
        this.couponCode = null;
        this.showCouponError = false;
    }

    loadCouponInfo() {
        if (!this.couponCode)
            return;

        if (this.couponInfoCache.hasOwnProperty(this.couponCode)) {
            this.couponInfo = this.couponInfoCache[this.couponCode];
            this.changeDetector.detectChanges();
            return;
        }

        this.couponLoading = true;
        this.publicProductService.getCouponInfo(0, this.couponCode, this.plan.currencyId)
            .pipe(
                finalize(() => {
                    this.couponLoading = false;
                    this.changeDetector.detectChanges();
                })
            )
            .subscribe(info => {
                info = info && info.id ? info : null;
                if (info) {
                    this.setCouponDescription(info);
                } else {
                    this.showCouponError = true;
                }
                this.couponInfo = info;
                this.couponInfoCache[this.couponCode] = info;
                this.changeDetector.detectChanges();
            });

    }

    setCouponDescription(coupon: PublicCouponInfo): void {
        let description = coupon.percentOff ?
            `${coupon.percentOff}%` : `${coupon.amountOff} ${this.plan.currencySymbol}`;

        coupon['description'] = `${description} Off ${coupon.duration}`;
    }

    getSubscriptionPrice(includeCoupon: boolean) {
        let price = this.plan.total;
        if (includeCoupon) {
            if (this.productSubscriptionPreviouslyUsed ||
                !this.plan.trialDayCount ||
                (this.plan.trialDayCount && !this.plan.signUpFee) ||
                (this.couponInfo && this.couponInfo.duration != CouponDiscountDuration.Once))
                price = this.applyCoupon(price);
        }
        return price;
    }

    applyCoupon(amount: number, usedAmountOff: number = 0): number {
        if (!this.couponInfo)
            return amount;

        if (this.couponInfo.amountOff)
            return amount - this.couponInfo.amountOff + usedAmountOff > 0 ? amount - this.couponInfo.amountOff + usedAmountOff : 0;

        return round(amount * (1 - this.couponInfo.percentOff / 100), 2);
    }

    getSignUpFee(includeCoupon: boolean): number {
        let fee = this.plan.signUpFee;
        if (includeCoupon) {
            let usedAmountOff = 0;
            if (!this.plan.trialDayCount) {
                usedAmountOff = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            }
            fee = this.applyCoupon(fee, usedAmountOff);
        }

        return fee;
    }

    getDiscount(): number {
        let amount = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
        if (this.plan.signUpFee && !this.productSubscriptionPreviouslyUsed)
            amount = amount + this.getSignUpFee(false) - this.getSignUpFee(true);
        return amount;
    }

    anyPaymentSystemIsApplicable() {
        return !this.isFreeSinglePayment() && (this.stripeApplicable || this.showPayPal());
    }

    showPayPal() {
        return this.payPalApplicable &&
            !this.isOnceCoupon() &&
            this.getSubscriptionPrice(true) > 0;
    }

    isOnceCoupon() {
        return this.couponInfo ? this.couponInfo.duration == CouponDiscountDuration.Once : false;
    }

    isFreeSinglePayment() {
        return (this.plan.paymentPeriodType == PaymentPeriodType.OneTime || this.plan.paymentPeriodType == PaymentPeriodType.LifeTime) &&
            this.getSubscriptionPrice(true) == 0;
    }

    subscribeToFree() {
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.tenantSubscriptionServiceProxy.requestProductPayment(new RequestPaymentInput({
            type: RequestPaymentType.Free,
            productId: this.plan.productId,
            paymentPeriodType: this.plan.paymentPeriodType,
            quantity: 1,
            couponId: this.couponInfo ? this.couponInfo.id : undefined
        })).subscribe(() => {
            this.refreshAfterClose.emit();
            this.onStatusChange.emit({
                status: PaymentStatusEnum.Confirmed,
                statusText: this.l('PaymentStatus_payment-free-confirmed'),
                icon: PaymentStatusEnum.Confirmed,
                showBack: false
            });
        });
    }
}
=======
/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, Output, Injector, Input, ChangeDetectorRef, ElementRef, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import round from 'lodash/round';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';
import { StatusInfo } from '@app/shared/common/payment-wizard/models/status-info';
import { PaymentMethods } from '@app/shared/common/payment-wizard/models/payment-methods.enum';
import {
    ACHCustomerInfoDto,
    PaymentMethod,
    BankCardInfoDto,
    PaymentRequestInfoDto,
    TenantSubscriptionServiceProxy,
    PayPalInfoDto,
    PaymentInfoType,
    PaymentPeriodType,
    RequestPaymentDto,
    RequestPaymentType,
    ModuleSubscriptionInfo,
    BankTransferSettingsDto,
    RequestPaymentResult,
    RequestPaymentInput,
    PaymentSystemSettingsDto,
    PublicProductServiceProxy,
    CouponDiscountDuration,
    PublicCouponInfo,
    RequestProductPaymentOutput
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppService } from '@app/app.service';
import { PayPalComponent } from '@shared/common/paypal/paypal.component';
import { ButtonType } from '@shared/common/paypal/button-type.enum';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSubscriptionServiceProxy, PublicProductServiceProxy]
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
    private payPal: PayPalComponent;
    @ViewChild(PayPalComponent) set paypPalComponent(paypalComp: PayPalComponent) {
        this.payPal = paypalComp;
        if (this.selectedGateway == this.GATEWAY_PAYPAL)
            this.initializePayPal();
    };

    @Input() plan: PaymentOptions;
    @Input() steps: Step[] = [
        {
            name: this.l('ChooseYourPlan'),
            editable: true,
            completed: true
        },
        {
            name: this.l('PaymentOptions'),
            active: true
        },
        {
            name: this.l('PaymentConfirmation')
        }
    ];
    @Input() phoneNumber = '1-844-773-7739';
    @Output() onChangeStep: EventEmitter<number> = new EventEmitter<number>();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    @Output() onStatusChange: EventEmitter<StatusInfo> = new EventEmitter();
    @Output() refreshAfterClose: EventEmitter<null> = new EventEmitter();

    private paymentMethodsConfig = {
        [PaymentMethods.BankTransfer]: {
            successStatus: () => this.l('pendingBankTransferIntentRecorded'),
            successStatusText: (res: RequestPaymentResult) => this.l('pendingBankTransferReference', res.transactionId),
            showBack: false,
            skipRefreshAfterClose: true,
            downloadPdf: 'assets/documents/Sperse Bank Transfer Sending Instructions.pdf'
        },
        [PaymentMethods.Free]: {
            successStatus: this.l('PaymentStatus_payment-free-confirmed')
        }
    };

    GATEWAY_STRIPE = 0;
    GATEWAY_PAYPAL = 1;
    GATEWAY_C_CARD = 2;
    GATEWAY_ECHECK = 3;

    quantity = 1;

    selectedGateway: number = 0;
    paymentMethods = PaymentMethods;
    bankTransferSettings$: Observable<BankTransferSettingsDto>;
    paymentSystemSettings: PaymentSystemSettingsDto;
    productSubscriptionPreviouslyUsed: boolean = false;
    hasAnyPaymentSystemConfigured = false;
    payPalApplicable: boolean = false;
    stripeApplicable: boolean = false;
    receiptLink: string;

    isPayByStripeDisabled = false;

    couponInfoCache: { [code: string]: PublicCouponInfo } = {};
    couponLoading: boolean = false;
    showCouponError: boolean = false;
    couponInfo: PublicCouponInfo = null;
    couponCode: string = '';

    constructor(
        injector: Injector,
        private appHttpConfiguration: AppHttpConfiguration,
        private appService: AppService,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy,
        private publicProductService: PublicProductServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (this.plan.total)
            this.initPaymentSystems();
    }

    goToStep(i) {
        this.onChangeStep.emit(i);
    }

    getBillingTerm(billingPeriod: BillingPeriod) {
        return billingPeriod === BillingPeriod.Yearly ? 'annually' : 'monthly';
    }

    getProductUnit() {
        switch (this.plan.paymentPeriodType) {
            case PaymentPeriodType.Annual:
                return 'per year';
            case PaymentPeriodType.Monthly:
                return 'per month';
            case PaymentPeriodType.OneTime:
            case PaymentPeriodType.LifeTime:
                return 'per life time';
            case PaymentPeriodType.Custom:
                return this.plan.customPeriodDescription.toLowerCase();
            default:
                return '';
        }
    }

    selectedTabChange(e) {
        if (e.index == this.GATEWAY_PAYPAL)
            this.initializePayPal(true);
        //if (!this.bankTransferSettings$ && e.tab.textLabel === this.l('BankTransfer')) {
        /** Load transfer data */
        //    this.bankTransferSettings$ = this.tenantSubscriptionServiceProxy.getBankTransferSettings();
        //}
    }

    initPaymentSystems() {
        this.startLoading();
        forkJoin(
            [
                this.tenantSubscriptionServiceProxy.getPaymentSettingsInfo(),
                this.tenantSubscriptionServiceProxy.checkPaymentInfo(new RequestPaymentInput({
                    type: RequestPaymentType.PayPal,
                    paymentPeriodType: this.plan.paymentPeriodType,
                    productId: this.plan.productId,
                    quantity: this.quantity,
                    couponId: this.couponInfo ? this.couponInfo.id : undefined
                }))
            ]
        ).subscribe(([settings, productPaymentInfo]) => {
            this.paymentSystemSettings = settings;
            this.productSubscriptionPreviouslyUsed = productPaymentInfo.previouslyUsed;
            this.hasAnyPaymentSystemConfigured = !!settings.paypalClientId || settings.stripeIsEnabled;

            this.stripeApplicable = settings.stripeIsEnabled && productPaymentInfo.applicablePaymentTypes.some(v => v == RequestPaymentType.Stripe);
            this.payPalApplicable = settings.paypalClientId && productPaymentInfo.applicablePaymentTypes.some(v => v == RequestPaymentType.PayPal);

            if (this.payPalApplicable && !this.stripeApplicable) {
                this.GATEWAY_PAYPAL = 0;
                this.initializePayPal();
            }
            this.changeDetector.detectChanges();
            this.finishLoading();
        });
    }

    initializePayPal(reinitialize = false) {
        if (this.payPalApplicable && this.payPal && (!this.payPal.initialized || reinitialize)) {
            let type = this.plan.paymentPeriodType == PaymentPeriodType.OneTime || this.plan.paymentPeriodType == PaymentPeriodType.LifeTime ? ButtonType.Payment : ButtonType.Subscription;
            this.payPal.initialize(this.paymentSystemSettings.paypalClientId, type,
                () => this.payByPaypal(),
                () => this.payByPaypal(),
                this.plan.currencyId
            );
        }
    }

    submitData(data: any, paymentMethod: PaymentMethods = PaymentMethods.Free) {
        /** Go to the third step */
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.appHttpConfiguration.avoidErrorHandling = true;
        let paymentInfo: any = {
            subscriptionInfo: {
                //editionId: this.plan.selectedEditionId,
                //maxUserCount: this.plan.usersAmount,
                // frequency: this.plan.billingPeriod == BillingPeriod.Monthly
                //     ? PaymentPeriodType.Monthly
                //     : PaymentPeriodType.Annual
            }
        };
        switch (paymentMethod) {
            case PaymentMethods.eCheck:
                const eCheckData = data as ECheckDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Charge,
                    paymentInfoType: PaymentInfoType.ACH,
                    achCustomer: ACHCustomerInfoDto.fromJS({
                        customerRoutingNo: eCheckData.routingNumber,
                        customerAcctNo: eCheckData.bankAccountNumber,
                        memo: eCheckData.paymentDescription // this property does not exist !!!
                    })
                });
                break;
            case PaymentMethods.CreditCard:
                const creditCardData = data as BankCardDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Recurring,
                    paymentInfoType: PaymentInfoType.BankCard,
                    bankCard: BankCardInfoDto.fromJS({
                        holderName: creditCardData.holderName,
                        cardNumber: creditCardData.cardNumber.replace(/-|\s/g, ''),
                        expirationMonth: creditCardData.expirationMonth,
                        expirationYear: creditCardData.expirationYear,
                        cvv: creditCardData.cvv,
                        billingAddress: creditCardData.billingAddress,
                        billingZip: creditCardData.billingZip,
                        billingCity: creditCardData.billingCity,
                        billingStateCode: creditCardData.billingStateCode,
                        billingState: creditCardData.billingState['name'],
                        billingCountryCode: creditCardData.billingCountryCode,
                        billingCountry: creditCardData.billingCountry['name'],
                    })
                });
                break;
            case PaymentMethods.PayPal:
                const payPalData = data as PayPalDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentMethod.Capture,
                    paymentInfoType: PaymentInfoType.PayPal,
                    payPal: PayPalInfoDto.fromJS({
                        paymentId: payPalData.paymentId,
                        payerId: payPalData.payerId
                    })
                });
                break;
            case PaymentMethods.BankTransfer:
                break;
            default:
                break;
        }
        /** Start submitting data and change status in a case of error or success */
        /*
        let method: Observable<any> = paymentMethod == PaymentMethods.PayPal
            ? this.tenantSubscriptionServiceProxy.completeSubscriptionPayment(paymentInfo.billingInfo)
            : paymentMethod === PaymentMethods.BankTransfer
                ? this.tenantSubscriptionServiceProxy.requestPayment(
                    new RequestPaymentDto({
                        subscriptionInfo: ModuleSubscriptionInfo.fromJS({
                            editionId: paymentInfo.subscriptionInfo.editionId,
                            maxUserCount: paymentInfo.subscriptionInfo.maxUserCount,
                            frequency: paymentInfo.subscriptionInfo.frequency
                        }),
                        requestType: RequestPaymentType.ManualBankTransfer
                    })
                )
                : this.tenantSubscriptionServiceProxy.setupSubscription(paymentInfo);

        method.pipe(finalize(() => { this.appHttpConfiguration.avoidErrorHandling = false; }))
            .subscribe(
                res => {
                    if (!this.paymentMethodsConfig[paymentMethod] || !this.paymentMethodsConfig[paymentMethod].skipRefreshAfterClose) {
                        this.refreshAfterClose.emit();
                    }
                    this.appService.loadModuleSubscriptions();
                    this.onStatusChange.emit({
                        status: this.getPaymentStatus(paymentMethod, res),
                        statusText: this.getPaymentStatusText(paymentMethod, res),
                        icon: PaymentStatusEnum.Confirmed,
                        downloadPdf: this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].downloadPdf,
                        showBack: this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].showBack
                    });
                },
                error => {
                    this.onStatusChange.emit({
                        status: PaymentStatusEnum.Failed,
                        statusText: error.message,
                        errorDetailsText: error.details
                    });
                }
            );
            */
    }

    getPaymentStatusText(paymentMethod: PaymentMethods, res: any) {
        let config = this.paymentMethodsConfig[paymentMethod];
        return config && config.successStatusText ?
            typeof config.successStatusText === 'function' ?
                config['successStatusText'](res) : config.successStatusText
            : '';
    }

    getPaymentStatus(paymentMethod: PaymentMethods, res: any) {
        return this.paymentMethodsConfig[paymentMethod] && this.paymentMethodsConfig[paymentMethod].successStatus ?
            typeof this.paymentMethodsConfig[paymentMethod].successStatus === 'function' ?
                this.paymentMethodsConfig[paymentMethod]['successStatus'](res) :
                this.paymentMethodsConfig[paymentMethod].successStatus
            : PaymentStatusEnum.Confirmed;
    }

    close() {
        this.onClose.emit();
    }

    getPaymentRequest(type: RequestPaymentType): Observable<RequestProductPaymentOutput> {
        return this.tenantSubscriptionServiceProxy.requestProductPayment(new RequestPaymentInput({
            type: type,
            productId: this.plan.productId,
            paymentPeriodType: this.plan.paymentPeriodType,
            quantity: 1,
            couponId: this.couponInfo ? this.couponInfo.id : undefined
        }));
    }

    payByStripe() {
        this.isPayByStripeDisabled = true;
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.getPaymentRequest(RequestPaymentType.Stripe).subscribe((response) => {
            window.location.href = response.stripePaymentLink;
        }, () => {
            this.isPayByStripeDisabled = false;
            this.loadingService.finishLoading(this.elementRef.nativeElement);
        });
    }

    payByPaypal(): Promise<string> {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        return this.getPaymentRequest(RequestPaymentType.PayPal).pipe(
            map(v => {
                this.receiptLink = v.receiptUrl;
                return v.paypalCode
            }),
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).toPromise();
    }

    onPayPalApprove() {
        location.href = this.receiptLink;
    }

    couponChange() {
        this.showCouponError = false;
    }

    clearCoupon() {
        this.couponInfo = null;
        this.couponCode = null;
        this.showCouponError = false;
    }

    loadCouponInfo() {
        if (!this.couponCode)
            return;

        if (this.couponInfoCache.hasOwnProperty(this.couponCode)) {
            this.couponInfo = this.couponInfoCache[this.couponCode];
            this.changeDetector.detectChanges();
            return;
        }

        this.couponLoading = true;
        this.publicProductService.getCouponInfo(0, this.couponCode, this.plan.currencyId)
            .pipe(
                finalize(() => {
                    this.couponLoading = false;
                    this.changeDetector.detectChanges();
                })
            )
            .subscribe(info => {
                info = info && info.id ? info : null;
                if (info) {
                    this.setCouponDescription(info);
                } else {
                    this.showCouponError = true;
                }
                this.couponInfo = info;
                this.couponInfoCache[this.couponCode] = info;
                this.changeDetector.detectChanges();
            });

    }

    setCouponDescription(coupon: PublicCouponInfo): void {
        let description = coupon.percentOff ?
            `${coupon.percentOff}%` : `${coupon.amountOff} ${this.plan.currencySymbol}`;

        coupon['description'] = `${description} Off ${coupon.duration}`;
    }

    getSubscriptionPrice(includeCoupon: boolean) {
        let price = this.plan.total;
        if (includeCoupon) {
            if (this.productSubscriptionPreviouslyUsed ||
                !this.plan.trialDayCount ||
                (this.plan.trialDayCount && !this.plan.signUpFee) ||
                (this.couponInfo && this.couponInfo.duration != CouponDiscountDuration.Once))
                price = this.applyCoupon(price);
        }
        return price;
    }

    applyCoupon(amount: number, usedAmountOff: number = 0): number {
        if (!this.couponInfo)
            return amount;

        if (this.couponInfo.amountOff)
            return amount - this.couponInfo.amountOff + usedAmountOff > 0 ? amount - this.couponInfo.amountOff + usedAmountOff : 0;

        return round(amount * (1 - this.couponInfo.percentOff / 100), 2);
    }

    getSignUpFee(includeCoupon: boolean): number {
        let fee = this.plan.signUpFee;
        if (includeCoupon) {
            let usedAmountOff = 0;
            if (!this.plan.trialDayCount) {
                usedAmountOff = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
            }
            fee = this.applyCoupon(fee, usedAmountOff);
        }

        return fee;
    }

    getDiscount(): number {
        let amount = this.getSubscriptionPrice(false) - this.getSubscriptionPrice(true);
        if (this.plan.signUpFee && !this.productSubscriptionPreviouslyUsed)
            amount = amount + this.getSignUpFee(false) - this.getSignUpFee(true);
        return amount;
    }

    anyPaymentSystemIsApplicable() {
        return !this.isFreeSinglePayment() && (this.stripeApplicable || this.showPayPal());
    }

    showPayPal() {
        return this.payPalApplicable &&
            !this.isOnceCoupon() &&
            this.getSubscriptionPrice(true) > 0;
    }

    isOnceCoupon() {
        return this.couponInfo ? this.couponInfo.duration == CouponDiscountDuration.Once : false;
    }

    isFreeSinglePayment() {
        return (this.plan.paymentPeriodType == PaymentPeriodType.OneTime || this.plan.paymentPeriodType == PaymentPeriodType.LifeTime) &&
            this.getSubscriptionPrice(true) == 0;
    }

    subscribeToFree() {
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.tenantSubscriptionServiceProxy.requestProductPayment(new RequestPaymentInput({
            type: RequestPaymentType.Free,
            productId: this.plan.productId,
            paymentPeriodType: this.plan.paymentPeriodType,
            quantity: 1,
            couponId: this.couponInfo ? this.couponInfo.id : undefined
        })).subscribe(() => {
            this.refreshAfterClose.emit();
            this.onStatusChange.emit({
                status: PaymentStatusEnum.Confirmed,
                statusText: this.l('PaymentStatus_payment-free-confirmed'),
                icon: PaymentStatusEnum.Confirmed,
                showBack: false
            });
        });
    }
}
>>>>>>> f999b481882149d107812286d0979872df712626
