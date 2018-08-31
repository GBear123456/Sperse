import { Component, ChangeDetectionStrategy, EventEmitter, OnInit, Output, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { Step } from '@app/shared/common/payment-wizard/models/step.model';
import { PaymentMethods } from '@app/shared/common/payment-wizard/models/payment-methods.enum';
import {
    ACHCustomerDto,
    PaymentRequestDto,
    TenantSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ECheckDataModel } from '@app/shared/common/payment-wizard/models/e-check-data.model';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';

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
    @Output() onStatusChange: EventEmitter<PaymentStatusEnum> = new EventEmitter();
    paymentMethods = PaymentMethods;
    constructor(
        injector: Injector,
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
        this.onStatusChange.emit(PaymentStatusEnum.Pending);
        this.onChangeStep.emit(2);
        if (paymentMethod === PaymentMethods.eCheck && data instanceof ECheckDataModel) {
            const eCheckData = data as ECheckDataModel;
            const paymentInfo = PaymentRequestDto.fromJS({
                achCustomer: ACHCustomerDto.fromJS({
                    customerRoutingNo: eCheckData.routingNumber,
                    customerAcctNo: eCheckData.bankAccountNumber,
                    memo: eCheckData.paymentDescription
                })
            });
            /** Start submitting data and change status in a case of error or success */
            this.tenantSubscriptionServiceProxy.addPaymentInfo(paymentInfo).subscribe(
                res => {
                    /** @todo change for getting of the status from the server */
                    this.onStatusChange.emit(res ? PaymentStatusEnum.BeingConfirmed : PaymentStatusEnum.Failed);

                },
                () => this.onStatusChange.emit(PaymentStatusEnum.Failed)
            );
        }
    }

    close() {
        this.onClose.emit();
    }
}
