import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
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
    SetupSubscriptionInfoDto,
    PayPalInfoDto,
    SetupSubscriptionInfoDtoFrequency,
    PaymentRequestInfoDtoPaymentInfoType
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

    readonly GATEWAY_ECHECK = 0;
    readonly GATEWAY_C_CARD = 1;
    readonly GATEWAY_PAYPAL = 2;

    selectedGateway: number = this.GATEWAY_ECHECK;

    paymentMethods = PaymentMethods;
    constructor(
        private injector: Injector,
        private appHttpConfiguration: AppHttpConfiguration,
        private tenantSubscriptionServiceProxy: TenantSubscriptionServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {}

    goToStep(i) {
        this.onChangeStep.emit(i);
    }

    getBillingTerm(billingPeriod: BillingPeriod) {
        return billingPeriod === BillingPeriod.Yearly ? 'annually' : 'monthly';
    }

    submitData(data: any, paymentMethod: PaymentMethods) {
        /** Go to the third step */
        this.onStatusChange.emit({ status: PaymentStatusEnum.BeingConfirmed });
        this.onChangeStep.emit(2);
        this.appHttpConfiguration.avoidErrorHandling = true;
        let paymentInfo = SetupSubscriptionInfoDto.fromJS({
            editionId: this.plan.selectedEditionId,
            maxUserCount: this.plan.usersAmount,
            frequency: this.plan.billingPeriod == BillingPeriod.Monthly
                ? SetupSubscriptionInfoDtoFrequency._30
                : SetupSubscriptionInfoDtoFrequency._365
        });
        switch (paymentMethod) {
            case PaymentMethods.eCheck:
                const eCheckData = data as ECheckDataModel;
                paymentInfo.billingInfo = PaymentRequestInfoDto.fromJS({
                    paymentMethod: PaymentRequestInfoDtoPaymentMethod.Recurring,
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
            default:
                break;
        }
        /** Start submitting data and change status in a case of error or success */
        this.tenantSubscriptionServiceProxy.setupSubscription(paymentInfo).subscribe(
            () => { this.onStatusChange.emit({ status: PaymentStatusEnum.Confirmed }); },
            error => {
                this.appHttpConfiguration.avoidErrorHandling = false;
                this.onStatusChange.emit({
                    status: PaymentStatusEnum.Failed,
                    statusText: error.message,
                    errorDetailsText: error.details
                });
            }
        );
    }

    close() {
        this.onClose.emit();
    }
}
