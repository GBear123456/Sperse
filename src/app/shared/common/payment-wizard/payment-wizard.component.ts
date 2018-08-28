import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MatStepper } from '@angular/material';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class PaymentWizardComponent implements OnInit {
    @ViewChild('stepper') stepper: MatStepper;
    plan: OptionsPaymentPlan;
    constructor(private dialogRef: MatDialogRef<PaymentWizardComponent>) { }

    ngOnInit() {
    }

    moveToPaymentOptionsStep(e) {
        this.plan = e;
        this.stepper.next();
    }

    close() {
        this.dialogRef.close();
    }
}
