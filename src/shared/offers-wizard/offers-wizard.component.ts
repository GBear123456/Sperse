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
import {
    GetApplicationDetailsOutput,
    OfferServiceProxy, PersonalInformation,
    SubmitApplicationInput
} from '@shared/service-proxies/service-proxies';
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
        'Debt Consolidation',
        'Emergency Situation',
        'Auto Repairs',
        'Auto Purchase',
        'Moving',
        'Home Improvement',
        'Medical',
        'Business',
        'Vacation',
        'Rent Or Mortgage',
        'Wedding',
        'Major Purchases',
        'Other',
        'Credit Card Debt Relief',
        'Student Loan Debt Relief'
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
    }

    ngOnInit() {
        this.submitApplicationInput.systemType = this.data.offer.systemType;
        this.submitApplicationInput.personalInformation.isActiveMilitary = false;
        this.submitApplicationInput.campaignId = this.data.offer.campaignId;
        this.submitApplicationInput.personalInformation = PersonalInformation.fromJS({
            email: this.data.submitRequestInput.emailAddress,
            postalCode: this.data.submitRequestInput.zipCode,
            address1: this.data.submitRequestInput.streetAddress,
            creditScoreRating: this.data.submitRequestInput.creditScore,
            phone: this.data.submitRequestInput.phoneNumber,
            ...this.data.submitRequestInput
        });
        console.log(this.submitApplicationInput);
        this.offersServiceProxy.getApplicationDetails().subscribe(
            (output: GetApplicationDetailsOutput) => {
                if (output) {
                    this.submitApplicationInput = SubmitApplicationInput.fromJS({
                        ...output
                    });
                }
            },
            (error) => console.log(error)
        );
        this._changeDetectionRef.detectChanges();
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    goToNextStep(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) this.stepper.next();
    }

    submitApplication() {
        this.offersServiceProxy.submitApplication(this.submitApplicationInput).subscribe(() => {
            this.dialogRef.close(true);
        });
    }

}
