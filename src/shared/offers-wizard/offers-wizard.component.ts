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
import { pluck } from 'rxjs/operators';
import { Observable } from 'rxjs';

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
    BankAccountType,
    NameValueDtoListResultDto,
    TimingServiceProxy,
    SettingScopes
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { environment } from '@root/environments/environment';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppTimezoneScope } from '@shared/AppEnums';

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
    today: Date = new Date();
    emailRegEx = AppConsts.regexPatterns.email;
    radioGroup = [
        { value: true, text: 'Yes' },
        { value: false, text: 'No' }
    ];
    contactTime = Object.keys(TimeOfDay).map(e => ({key: e, text: this.ls.l(e)}));
    gender = Object.keys(Gender).map(e => ({key: e, text: this.ls.l(e)}));
    creditScore = Object.keys(CreditScoreRating).map(e => ({key: e, text: this.ls.l(e)}));
    loanReason = Object.keys(LoanReason).map(e => ({key: e, text: this.ls.l(e)}));
    payFrequency = Object.keys(PayFrequency).map(e => ({key: e, text: this.ls.l(e)}));
    incomeType = Object.keys(IncomeType).map(e => ({key: e, text: this.ls.l(e)}));
    bankAccountType = Object.keys(BankAccountType).map(e => ({key: e, text: this.ls.l(e)}));
    timeZones$: Observable<NameValueDtoListResultDto[]>;
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;

    constructor(
        injector: Injector,
        private _changeDetectionRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        private dialog: MatDialog,
        public inputStatusesService: InputStatusesService,
        private appHttpConfiguration: AppHttpConfiguration,
        private _timingService: TimingServiceProxy,
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
        this.getTimezoneList();
        this._changeDetectionRef.detectChanges();
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    removeTimeZone(date) {
        return DateHelper.removeTimezoneOffset(date);
    }

    getTimezoneList() {
        this.timeZones$ = this._timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
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
        this.appHttpConfiguration.avoidErrorHandling = true;
        this.offersServiceProxy.submitApplication(this.submitApplicationProfileInput).subscribe(
            (result: SubmitApplicationOutput) => {
                if (result) {
                    if (this.data.campaignId) applyOfferDialog.close();
                    this.dialogRef.close(result);
                }
            },
            (error) => {
                if (this.data.campaignId) applyOfferDialog.close();
                if (error && error.validationErrors) {
                    let data = '<div class="scroll-zone">';
                    error.validationErrors.forEach(item => {
                        data += `<p><b>${this.ls.l(item.members[0])}</b> - ${item.message}</p>`;
                    });
                    data += '</div>';
                    abp.message.error(data, 'Your request is not valid!\nThe following errors were detected during validation.', true);
                } else {
                    abp.message.error(null, error.message);
                }
            },
            () => this.appHttpConfiguration.avoidErrorHandling = false
        );
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
    }
}
