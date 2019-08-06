/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { pluck, publishReplay, refCount } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import {
    BankAccountType, CampaignProviderType,
    CreditScoreRating,
    Gender,
    GetApplicationDetailsOutput,
    IncomeType,
    LoanReason,
    NameValueDtoListResultDto,
    OfferProviderType,
    OfferServiceProxy,
    PayFrequency,
    SettingScopes,
    SubmitApplicationInput, SubmitApplicationOutput,
    TimeOfDay,
    TimingServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { environment } from '@root/environments/environment';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Injectable()
export class OffersWizardService {
    emailRegEx = AppConsts.regexPatterns.email;
    domain = environment.LENDSPACE_DOMAIN;
    dialogRef: any;
    rules = {'X': /[02-9]/};
    data: any;
    radioGroup = [
        { value: true, text: 'Yes' },
        { value: false, text: 'No' }
    ];
    submitApplicationProfileInput = new SubmitApplicationInput();
    contactTime = this.arrayFromEnum(TimeOfDay);
    gender = this.arrayFromEnum(Gender);
    creditScore = this.arrayFromEnum(CreditScoreRating);
    loanReason = this.arrayFromEnum(LoanReason);
    payFrequency = this.arrayFromEnum(PayFrequency);
    incomeType = this.arrayFromEnum(IncomeType);
    bankAccountType = this.arrayFromEnum(BankAccountType);
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
    timeZones$: Observable<NameValueDtoListResultDto[]>;
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;

    constructor(
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        private _timingService: TimingServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private dialog: MatDialog
    ) {
        this.submitApplicationProfileInput.systemType = OfferProviderType.EPCVIP;
        this.timeZones$ = this._timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
        this.getApplicationDetails();
    }

    getApplicationDetails() {
        this.offersServiceProxy.getApplicationDetails().subscribe(
            (output: GetApplicationDetailsOutput) => {
                if (output) {
                    this.submitApplicationProfileInput = SubmitApplicationInput.fromJS({
                        ...output
                    });
                }
            },
            (error) => console.log(error)
        );
    }

    arrayFromEnum(enumData) {
        return Object.keys(enumData).map(e => ({key: e, text: this.ls.l(e)}));
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
    }

    submitApplicationProfile(): Observable<SubmitApplicationOutput> {
        let applyOfferDialog;
        this.submitApplicationProfileInput.personalInformation.doB = DateHelper.getDateWithoutTime(this.submitApplicationProfileInput.personalInformation.doB);
        this.submitApplicationProfileInput.employmentInformation.payNextDate = DateHelper.getDateWithoutTime(this.submitApplicationProfileInput.employmentInformation.payNextDate);
        this.submitApplicationProfileInput.employmentInformation.payAfterNextDate = DateHelper.getDateWithoutTime(this.submitApplicationProfileInput.employmentInformation.payAfterNextDate);
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
        const submitApplication$ = this.offersServiceProxy.submitApplication(this.submitApplicationProfileInput).pipe(publishReplay(), refCount());
        submitApplication$.subscribe(
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
            () => {
                this.appHttpConfiguration.avoidErrorHandling = false;
            }
        );
        return submitApplication$;
    }
}
