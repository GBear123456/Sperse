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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    GetApplicationDetailsOutput,
    CampaignProviderType,
    OfferServiceProxy,
    SubmitApplicationInput,
    OfferProviderType,
    LoanReason,
    SubmitApplicationOutput,
    PayFrequency,
    CreditScoreRating,
    IncomeType,
    Gender,
    TimeOfDay,
    BankAccountType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'app-offers-wizard',
    templateUrl: './offers-wizard.component.html',
    styleUrls: ['./offers-wizard.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersWizardComponent implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    submitApplicationProfileInput = new SubmitApplicationInput();
    dialogRef: MatDialogRef<OffersWizardComponent, any>;
    domain = environment.LENDSPACE_DOMAIN;
    rules = {'X': /[02-9]/};
    termsData = {
        title: this.ls.l('TermsOfUse'),
        bodyUrl: this.domain + '/documents/terms.html',
        downloadDisabled: true
    };
    privacyData = {
        title: this.ls.l('PrivacyPolicy'),
        bodyUrl: this.domain + '/documents/policy.html',
        downloadDisabled: true
    };
    private readonly INPUT_MASK = {
        ssn: '000-00-0000',
        phone: '+1 (X00) 000-0000',
        zipCode: '00000',
        phoneExt: '99999'
    };
    today: Date = new Date();
    emailRegEx = AppConsts.regexPatterns.email;
    radioGroup = [
        { value: true, text: 'Yes' },
        { value: false, text: 'No' }
    ];
    contactTime = Object.keys(TimeOfDay);
    gender = Object.keys(Gender);
    creditScore = Object.keys(CreditScoreRating);
    loanReason = Object.keys(LoanReason);
    payFrequency = Object.keys(PayFrequency);
    incomeType = Object.keys(IncomeType);
    bankAccountType = Object.keys(BankAccountType);

    constructor(
        injector: Injector,
        private _changeDetectionRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef = <any>injector.get(MatDialogRef);
    }

    ngOnInit() {
        this.submitApplicationProfileInput.systemType = OfferProviderType.EPCVIP;
        this.offersServiceProxy.getApplicationDetails().subscribe(
            (output: GetApplicationDetailsOutput) => {
                if (output) {
                    this.submitApplicationProfileInput = SubmitApplicationInput.fromJS({
                        ...output
                    });
                    this._changeDetectionRef.detectChanges();
                }
            },
            (error) => console.log(error)
        );
        this._changeDetectionRef.detectChanges();
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.target;
            event.component.option({
                mask: this.INPUT_MASK[input.name],
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '' });
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    removeTimeZone(date) {
        return DateHelper.removeTimezoneOffset(date);
    }

    goToNextStep(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) this.stepper.next();
    }

    submitApplicationProfile() {
        let applyOfferDialog;
        if (this.data.campaignId && this.data.offer) {
            const modalData = {
                processingSteps: [null, null, null, null],
                completeDelays: [ 1000, 1000, 1000, null ],
                delayMessages: <any>[ null, null, null, this.ls.l('Offers_TheNextStepWillTake') ],
                title: 'Offers_ProcessingLoanRequest',
                subtitle: 'Offers_WaitLoanRequestProcessing',
                redirectUrl: this.data.offer.redirectUrl,
                logoUrl: this.data.offer.campaignProviderType === CampaignProviderType.CreditLand
                    ? this.data.offercreditLandLogoUrl
                    : (this.data.isCreditCard ? null : this.data.offer.logoUrl)
            };
            applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
                width: '530px',
                panelClass: 'apply-offer-dialog',
                data: modalData
            });
        }
        this.submitApplicationProfileInput.legalInformation.isTCPAChecked = true;
        this.submitApplicationProfileInput.campaignId = this.data.campaignId;
        this.offersServiceProxy.submitApplication(this.submitApplicationProfileInput).subscribe(
            (result: SubmitApplicationOutput) => {
                if (result) {
                    if (this.data.campaignId) applyOfferDialog.close();
                    this.dialogRef.close(result);
                }
            },
            (error) => {
                if (this.data.campaignId) applyOfferDialog.close();
            });
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
}
}
