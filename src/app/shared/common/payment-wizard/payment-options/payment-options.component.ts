/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, Output, Injector, Input, ChangeDetectorRef, ElementRef, OnInit } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

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
    RequestPaymentInput
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
    providers: [ TenantSubscriptionServiceProxy ]
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
    payPalClientId: string;
    showPayPal: boolean = false;

    isPayByStripeDisabled = false;

    constructor(
        injector: Injector,
        private appHttpConfiguration: AppHttpConfiguration,
        private appService: AppService,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.initPayPal();
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

    initPayPal() {
        forkJoin(
            this.tenantSubscriptionServiceProxy.getPayPalSettings(),
            this.tenantSubscriptionServiceProxy.checkPaypalIsApplicable(new RequestPaymentInput({
                paymentPeriodType: this.plan.paymentPeriodType,
                productId: this.plan.productId,
                quantity: this.quantity,
            }))
        ).subscribe(([settings, isApplicable]) => {
            if (settings.clientId && isApplicable) {
                this.payPalClientId = settings.clientId;
                this.showPayPal = true;
                this.changeDetector.detectChanges();
            }
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
            quantity: 1
        })).subscribe((response) => {
            window.location.href = response.paymentLink;
        }, () => {
            this.isPayByStripeDisabled = false;
            this.loadingService.finishLoading();
        });
    }
}
