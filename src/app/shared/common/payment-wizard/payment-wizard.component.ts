import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { Observable } from 'rxjs';

import { MatDialogRef, MatStepper } from '@angular/material';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService ]
})
export class PaymentWizardComponent implements OnInit {
    @ViewChild('stepper') stepper: MatStepper;
    plan$: Observable<OptionsPaymentPlan>;
    paymentStatus: PaymentStatusEnum;
    constructor(private dialogRef: MatDialogRef<PaymentWizardComponent>,
                private paymentService: PaymentService) { }

    ngOnInit() {
        this.plan$ = this.paymentService.plan$;
        this.paymentService.plan$.subscribe(plan => {
            console.log(plan);
        });
    }

    moveToPaymentOptionsStep() {
        this.stepper.next();
    }

    changePlan(e) {
        this.paymentService._plan.next(e);
    }

    changeStatus(status: PaymentStatusEnum) {
        this.paymentStatus = status;
    }

    close() {
        this.dialogRef.close();
    }
}
