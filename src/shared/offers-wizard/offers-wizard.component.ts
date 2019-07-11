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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { OfferServiceProxy, SubmitApplicationInput, SubmitApplicationInputSystemType } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-offers-wizard',
    templateUrl: './offers-wizard.component.html',
    styleUrls: ['./offers-wizard.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersWizardComponent implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    submitApplicationInput = new SubmitApplicationInput();
    dialogRef: MatDialogRef<OffersWizardComponent, any>;
    today: Date = new Date();
    emailRegEx = AppConsts.regexPatterns.email;
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
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef = <any>injector.get(MatDialogRef);
        this.rules = {'X': /[02-9]/};
        console.log(this.dialogRef);
        console.log(this.data);
    }

    ngOnInit() {
        console.log(this.data.offer.systemType);
        console.log(this.data.offer.campaignId);
        this.submitApplicationInput.systemType = this.data.offer.systemType;
        this.submitApplicationInput.personalInformation.doB = moment();
        this.submitApplicationInput.personalInformation.isActiveMilitary = false;
        this.submitApplicationInput.campaignId = this.data.offer.campaignId;
        /*this.offersServiceProxy.getApplicationDetails().subscribe(response => {
            console.log(response);
        });*/
        this._changeDetectionRef.detectChanges();
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    goToNextStep(event) {
        console.log(event);
        // this.stepper.selectedIndex = index;
        // event.preventDefault();
        console.log(this.submitApplicationInput);
        // validate before next
        this.stepper.next();
    }

    submitApplication() {
        console.log(this.submitApplicationInput);
        this.offersServiceProxy.submitApplication(this.submitApplicationInput).subscribe(result => {
            console.log(result);
        });
    }

}
