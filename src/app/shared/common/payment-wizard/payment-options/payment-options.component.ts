/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, Output, Injector, Input, ChangeDetectorRef, ElementRef, OnInit } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
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
    PublicCouponInfo
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppService } from '@app/app.service';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSubscriptionServiceProxy, PublicProductServiceProxy]
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
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

    readonly GATEWAY_STRIPE = 0;
    readonly GATEWAY_PAYPAL = 1;
    readonly GATEWAY_C_CARD = 2;
    readonly GATEWAY_ECHECK = 3;

    quantity = 1;

    selectedGateway: number = this.GATEWAY_STRIPE;
    paymentMethods = PaymentMethods;
    bankTransferSettings$: Observable<BankTransferSettingsDto>;
    paymentSystemSettings: PaymentSystemSettingsDto;
    hasAnyPaymentSystem;
    showPayPal: boolean = false;

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
        if (!this.bankTransferSettings$ && e.tab.textLabel === this.l('BankTransfer')) {
            /** Load transfer data */
            this.bankTransferSettings$ = this.tenantSubscriptionServiceProxy.getBankTransferSettings();
        }
    }

    initPaymentSystems() {
        forkJoin(
            [
                this.tenantSubscriptionServiceProxy.getPaymentSettingsInfo(),
                this.tenantSubscriptionServiceProxy.checkPaypalIsApplicable(new RequestPaymentInput({
                    paymentPeriodType: this.plan.paymentPeriodType,
                    productId: this.plan.productId,
                    quantity: this.quantity,
                    couponId: this.couponInfo ? this.couponInfo.id : undefined
                }))
            ]
        ).subscribe(([settings, isApplicable]) => {
            this.paymentSystemSettings = settings;
            if (settings.paypalClientId && isApplicable) {
                this.showPayPal = true;
            }
            this.hasAnyPaymentSystem = settings.stripeIsEnabled || this.showPayPal;
            if (this.hasAnyPaymentSystem && !settings.stripeIsEnabled)
                this.selectedGateway = this.GATEWAY_PAYPAL;
            this.changeDetector.detectChanges();
        });
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

    payByStripe() {
        this.isPayByStripeDisabled = true;
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.tenantSubscriptionServiceProxy.requestStripePayment(new RequestPaymentInput({
            productId: this.plan.productId,
            paymentPeriodType: this.plan.paymentPeriodType,
            quantity: 1,
            couponId: this.couponInfo ? this.couponInfo.id : undefined
        })).subscribe((response) => {
            window.location.href = response.paymentLink;
        }, () => {
            this.isPayByStripeDisabled = false;
            this.loadingService.finishLoading();
        });
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
                info = Object.keys(info).length == 0 ? null : info;
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

    applyCoupon(amount: number, usedAmountOff: number = 0): number {
        if (!this.couponInfo)
            return amount;

        if (this.couponInfo.amountOff)
            return amount - this.couponInfo.amountOff + usedAmountOff > 0 ? amount - this.couponInfo.amountOff + usedAmountOff : 0;

        return round(amount * (1 - this.couponInfo.percentOff / 100), 2);
    }

    getDiscount(): number {
        let amount = this.plan.total - this.applyCoupon(this.plan.total);
        if (this.plan.signUpFee)
            amount = amount + this.plan.signUpFee - this.applyCoupon(this.plan.signUpFee);
        return amount;
    }

    isOnceCoupon() {
        return this.couponInfo ? this.couponInfo.duration == CouponDiscountDuration.Once : false;
    }

    subscribeToFree() {
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.tenantSubscriptionServiceProxy.requestFreeProduct(new RequestPaymentInput({
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
