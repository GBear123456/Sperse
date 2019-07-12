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

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    GetApplicationDetailsOutput,
    OfferServiceProxy,
    PersonalInformation,
    SubmitApplicationProfileInput, SubmitApplicationProfileInputSystemType
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
    submitApplicationProfileInput = new SubmitApplicationProfileInput();
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
        this.submitApplicationProfileInput.systemType = SubmitApplicationProfileInputSystemType.EPCVIP;
        this.offersServiceProxy.getApplicationDetails().subscribe(
            (output: GetApplicationDetailsOutput) => {
                if (output) {
                    this.submitApplicationProfileInput = SubmitApplicationProfileInput.fromJS({
                        ...output
                    });
                    this._changeDetectionRef.detectChanges();
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

    submitApplicationProfile() {
        this.offersServiceProxy.submitApplicationProfile(this.submitApplicationProfileInput).subscribe(() => {
            this.dialogRef.close(true);
        });
    }

}
