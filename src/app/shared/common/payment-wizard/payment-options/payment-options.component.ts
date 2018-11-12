/** Core imports */
import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';
import { StatusInfo } from '@app/shared/common/payment-wizard/models/status-info';
import { PaymentMethods } from '@app/shared/common/payment-wizard/models/payment-methods.enum';
import {
    ACHCustomerInfoDto,
    PaymentRequestInfoDtoPaymentMethod,
    BankCardInfoDto,
    PaymentRequestInfoDto,
    TenantSubscriptionServiceProxy,
    PayPalInfoDto,
    PaymentRequestInfoDtoPaymentInfoType,
    ModuleSubscriptionInfoFrequency,
    RequestPaymentDto,
    RequestPaymentDtoRequestType,
    ModuleSubscriptionInfo,
    BankTransferSettingsDto
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { PayPalDataModel } from '@app/shared/common/payment-wizard/models/pay-pal-data.model';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ TenantSubscriptionServiceProxy ]
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
    @Input() plan: PackageOptions;
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

    private paymentMethodsConfig = {
        [PaymentMethods.BankTransfer]: {
            successStatus: res => this.l('pendingBankTransferIntentRecorded', res),
            showBack: false
        },
        [PaymentMethods.Free]: {
            successStatus: this.l('PaymentStatus_payment-free-confirmed')
        }
    }

    readonly GATEWAY_ECHECK = 0;
    readonly GATEWAY_C_CARD = 1;
    readonly GATEWAY_PAYPAL = 2;

    selectedGateway: number = this.GATEWAY_ECHECK;
    paymentMethods = PaymentMethods;
    bankTransferSettings$: Observable<BankTransferSettingsDto>;
    payPalEnvironmentSetting: string;

    constructor(
        private injector: Injector,
        private appHttpConfiguration: AppHttpConfiguration,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
    }

    goToStep(i) {
        this.onChangeStep.emit(i);
    }

    getBillingTerm(billingPeriod: BillingPeriod) {
        return billingPeriod === BillingPeriod.Yearly ? 'annually' : 'monthly';
    }

    selectedTabChange(e) {
        if (!this.bankTransferSettings$ && e.tab.textLabel === this.l('BankTransfer')) {
            /** Load transfer data */
            this.bankTransferSettings$ = this.tenantSubscriptionServiceProxy.getBankTransferSettings();
        } else if (!this.payPalEnvironmentSetting && e.tab.textLabel === this.l('PayPal')) {
            this.tenantSubscriptionServiceProxy.getPayPalSettings()
                .subscribe(settings => this.payPalEnvironmentSetting = settings.environment);
        }
    }

    submitData(data: any, paymentMethod: PaymentMethods = PaymentMethods.Free) {
        /** Go to the third step */
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.appHttpConfiguration.avoidErrorHandling = true;
        let paymentInfo: any = {
            subscriptionInfo: {
                editionId: this.plan.selectedEditionId,
                maxUserCount: this.plan.usersAmount,
                frequency: this.plan.billingPeriod == BillingPeriod.Monthly
                    ? ModuleSubscriptionInfoFrequency._30
                    : ModuleSubscriptionInfoFrequency._365
            }
        };
        switch (paymentMethod) {
            case PaymentMethods.eCheck:
                const eCheckData = data as ECheckDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentRequestInfoDtoPaymentMethod.Charge,
                    paymentInfoType: PaymentRequestInfoDtoPaymentInfoType.ACH,
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
                    paymentMethod: PaymentRequestInfoDtoPaymentMethod.Recurring,
                    paymentInfoType: PaymentRequestInfoDtoPaymentInfoType.BankCard,
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
                    paymentMethod: PaymentRequestInfoDtoPaymentMethod.Capture,
                    paymentInfoType: PaymentRequestInfoDtoPaymentInfoType.PayPal,
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
        let method = paymentMethod == PaymentMethods.PayPal ?
            this.tenantSubscriptionServiceProxy.completeSubscriptionPayment(paymentInfo.billingInfo) :
            paymentMethod === PaymentMethods.BankTransfer ?
                this.tenantSubscriptionServiceProxy.requestPayment(
                    new RequestPaymentDto({
                        subscriptionInfo: ModuleSubscriptionInfo.fromJS({
                            editionId: paymentInfo.subscriptionInfo.editionId,
                            maxUserCount: paymentInfo.subscriptionInfo.maxUserCount,
                            frequency: paymentInfo.subscriptionInfo.frequency
                        }),
                        requestType: RequestPaymentDtoRequestType.ManualBankTransfer
                    })
                ) :
                this.tenantSubscriptionServiceProxy.setupSubscription(paymentInfo);

        method
            .pipe(finalize(() => { this.appHttpConfiguration.avoidErrorHandling = false; }))
            .subscribe(
                res => {
                    this.onStatusChange.emit({
                        status: this.getPaymentStatus(paymentMethod, res),
                        icon: PaymentStatusEnum.Confirmed,
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
}
