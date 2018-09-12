import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';
import { StatusInfo } from '@app/shared/common/payment-wizard/models/status-info';
import { PaymentMethods } from '@app/shared/common/payment-wizard/models/payment-methods.enum';
import {
    ACHCustomerDto,
    SetupSubscriptionWithBankCardInfoDto,
    SetupSubscriptionWithBankCardInfoDtoFrequency,
    BankCardDto,
    PaymentRequestInfoDto,
    TenantSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { BankCardDataModel } from '@app/shared/common/payment-wizard/models/bank-card-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';

import { EditionPaymentType } from '@shared/AppEnums';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Component({
    selector: 'payment-options',
    templateUrl: './payment-options.component.html',
    styleUrls: ['./payment-options.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ TenantSubscriptionServiceProxy ]
})
export class PaymentOptionsComponent extends AppComponentBase implements OnInit {
    @Input() plan: OptionsPaymentPlan;
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
    editionPaymentType = EditionPaymentType.NewRegistration;

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
        switch (paymentMethod) {
            case PaymentMethods.eCheck:
                const eCheckData = data as ECheckDataModel;
                const paymentInfo = PaymentRequestInfoDto.fromJS({
                    achCustomer: ACHCustomerDto.fromJS({
                        customerRoutingNo: eCheckData.routingNumber,
                        customerAcctNo: eCheckData.bankAccountNumber,
                        memo: eCheckData.paymentDescription
                    })
                });
                /** Start submitting data and change status in a case of error or success */
                this.tenantSubscriptionServiceProxy.addPaymentInfo(paymentInfo).subscribe(
                    res => {
                        this.onStatusChange.emit({ status: PaymentStatusEnum.Confirmed });
                    },
                    error => {
                        this.appHttpConfiguration.avoidErrorHandling = false;
                        this.onStatusChange.emit({
                            status: PaymentStatusEnum.Failed,
                            statusText: error.message
                        });
                    }
                );
                break;
            case PaymentMethods.CreditCard:
                const creditCardData = data as BankCardDataModel;
                const cardPaymentInfo = SetupSubscriptionWithBankCardInfoDto.fromJS({
                    editionId: this.plan.selectedEditionId,
                    frequency: this.plan.billingPeriod == BillingPeriod.Monthly
                        ? SetupSubscriptionWithBankCardInfoDtoFrequency._30
                        : SetupSubscriptionWithBankCardInfoDtoFrequency._365,
                    bankCard: BankCardDto.fromJS({
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
                this.tenantSubscriptionServiceProxy.setupSubscriptionWithBankCard(cardPaymentInfo).subscribe(
                    res => { this.onStatusChange.emit({ status: PaymentStatusEnum.Confirmed }); },
                    err => {
                        this.appHttpConfiguration.avoidErrorHandling = false;
                        this.onStatusChange.emit({
                            status: PaymentStatusEnum.Failed,
                            statusText: err.message
                        });
                    }
                );
                break;
            case PaymentMethods.PayPal:
                break;
            case PaymentMethods.BankTransfer:
                break;
            case PaymentMethods.Bitcoin:
                break;
            default:
                break;
        }
    }

    close() {
        this.onClose.emit();
    }
}
