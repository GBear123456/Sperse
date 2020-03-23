/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { filter, pluck, publishReplay, refCount } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { Store, select } from '@ngrx/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { MaskPipe } from 'ngx-mask';

/** Application imports */
import {
    BankAccountType,
    CampaignProviderType,
    CountryStateDto,
    CreditScoreRating,
    Gender,
    GetApplicationDetailsOutput,
    IncomeType,
    LoanReason,
    NameValueDto,
    OfferProviderType,
    OfferServiceProxy,
    PayFrequency,
    SettingScopes,
    SubmitApplicationInput,
    SubmitApplicationOutput,
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
    USER_EMAIL: string;
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
    timeZones$: Observable<NameValueDto[]>;
    applicationDetails$: Observable<GetApplicationDetailsOutput> = this.offersServiceProxy.getApplicationDetails().pipe(publishReplay(), refCount());
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;
    countryCode = 'US';
    states$: Observable<CountryStateDto[]> = this.store$.pipe(
        select(StatesStoreSelectors.getCountryStates, { countryCode: this.countryCode }),
        filter(Boolean)
    ) as Observable<CountryStateDto[]>;

    constructor(
        public ls: AppLocalizationService,
        private offersServiceProxy: OfferServiceProxy,
        private _timingService: TimingServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private store$: Store<RootStore.State>,
        private dialog: MatDialog,
        private maskPipe: MaskPipe
    ) {
        this.submitApplicationProfileInput.systemType = OfferProviderType.EPCVIP;
        this.timeZones$ = this._timingService.getTimezones(this.defaultTimezoneScope).pipe(
            pluck('items')
        );
        this.applicationDetails$.subscribe(
            (output: GetApplicationDetailsOutput) => {
                if (output) {
                    this.submitApplicationProfileInput = SubmitApplicationInput.fromJS({
                        ...output
                    });
                    this.USER_EMAIL = output.personalInformation.email;
                }
            },
            (error) => console.log(error)
        );
        this.getStates();
    }

    get isApplicationSubmission() {
        return !!this.data.campaignId;
    }

    arrayFromEnum(enumData) {
        return Object.keys(enumData).map(e => ({key: e, text: this.ls.l(e)}));
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
    }

    validateName(event) {
        if (!event.key.match(/^[a-zA-Z]+$/))
            event.preventDefault();
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
    }

    isEmailChanged() {
        return this.submitApplicationProfileInput.personalInformation.email !== this.USER_EMAIL;
    }

    checkIfEmailChanged() {
        if (!this.data.campaignId && this.isEmailChanged()) {
            abp.message.confirm(
                this.ls.l(
                    'EmailChangeText',
                    '<b>' + this.submitApplicationProfileInput.personalInformation.email + '</b>'
                ),
                this.ls.l('EmailChangeTitle'), result => {
                    if (result) {
                        this.submitApplicationProfile();
                    }
                },
                true);
        } else {
            this.submitApplicationProfile();
        }
    }

    removeEmptyData(obj) {
        Object.keys(obj).forEach((prop) => {
            if (obj[prop] && typeof obj[prop] === 'object') {
                this.removeEmptyData(obj[prop]);
            } else {
                obj[prop] = obj[prop] === '' ? null : obj[prop];
            }
        });
    }

    submitApplicationProfile(): Observable<SubmitApplicationOutput> {
        let applyOfferDialog;
        this.submitApplicationProfileInput.personalInformation.doB ?
            this.submitApplicationProfileInput.personalInformation.doB = DateHelper.removeTimezoneOffset(moment(this.submitApplicationProfileInput.personalInformation.doB).toDate(), false, 'from') :
            this.submitApplicationProfileInput.personalInformation.doB = null;
        this.submitApplicationProfileInput.employmentInformation.payNextDate ?
            this.submitApplicationProfileInput.employmentInformation.payNextDate = DateHelper.removeTimezoneOffset(moment(this.submitApplicationProfileInput.employmentInformation.payNextDate).toDate(), false, 'from') :
            this.submitApplicationProfileInput.employmentInformation.payNextDate = null;
        this.submitApplicationProfileInput.employmentInformation.payAfterNextDate ?
            this.submitApplicationProfileInput.employmentInformation.payAfterNextDate = DateHelper.removeTimezoneOffset(moment(this.submitApplicationProfileInput.employmentInformation.payAfterNextDate).toDate(), false, 'from') :
            this.submitApplicationProfileInput.employmentInformation.payAfterNextDate = null;
        this.removeEmptyData(this.submitApplicationProfileInput);

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
                width: '577px',
                height: '330px',
                panelClass: 'apply-offer-dialog',
                data: modalData
            });
        }
        this.submitApplicationProfileInput.legalInformation.isTCPAChecked = true;
        this.submitApplicationProfileInput.campaignId = this.data.campaignId;
        this.appHttpConfiguration.avoidErrorHandling = true;
        const submitApplication$ = this.offersServiceProxy.submitApplication(this.submitApplicationProfileInput).pipe(
            publishReplay(),
            refCount()
        );
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

    clearPhoneMask(value: string) {
        return value.replace(/\D/g, '').slice(1);
    }

    validateRequiredField = (options) => {
        return !this.isApplicationSubmission ||
            (options.value !== undefined && options.value !== null && options.value !== '' && options.value !== 0);
    }

    transformPostalCode(inputElement): string {
        if (inputElement.value.length > 10)
            inputElement.value = inputElement.value.slice(0, 10);
        return this.maskPipe.transform(inputElement.value, AppConsts.masks.zipCodeLong);
    }
}
