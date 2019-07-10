/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    Injector,
    OnInit,
    ViewChild
} from '@angular/core';

/** Third party imports */
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatHorizontalStepper} from '@angular/material';

/** Application imports */

@Component({
    selector: 'app-offers-wizard',
    templateUrl: './offers-wizard.component.html',
    styleUrls: ['./offers-wizard.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersWizardComponent implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    dialogRef: MatDialogRef<OffersWizardComponent, any>;
    today: Date = new Date();
    rules: any;
    radioGroup = [
        {value: true, text: 'Yes'},
        {value: false, text: 'No'}
    ];
    contactTime = [
        'Morning', 'Afternoon', 'Evening', 'Anytime'
    ];
    gender = [
        'Female', 'Male'
    ];
    creditScore = [
        'NotSure', 'Excellent', 'Good', 'Fair', 'Poor'
    ];
    loanReason = [
        'DebtConsolidation',
        'EmergencySituation',
        'AutoRepairs',
        'AutoPurchase',
        'Moving',
        'HomeImprovement',
        'Medical',
        'Business',
        'Vacation',
        'RentOrMortgage',
        'Wedding',
        'MajorPurchases',
        'Other',
        'CreditCardDebtRelief',
        'StudentLoanDebtRelief'
    ];
    payFrequency = [
        'Weekly', 'BiWeekly', 'Monthly', 'SemiMonthly'
    ];
    incomeType = [ 'Employed', 'Benefits', 'SelfEmployed' ];
    bankAccountType = [ 'Checking', 'Savings' ];

    constructor(
        injector: Injector,
        private _changeDetectionRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef = <any>injector.get(MatDialogRef);
        this.rules = {'X': /[02-9]/};
        console.log(this.dialogRef);
    }

    ngOnInit() {
        this._changeDetectionRef.detectChanges();
    }

    goToStep(index) {
        this.stepper.selectedIndex = index;
    }

}
