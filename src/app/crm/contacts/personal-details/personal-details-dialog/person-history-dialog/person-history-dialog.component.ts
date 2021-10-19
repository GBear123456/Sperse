/** Core imports */
import {
    ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild
} from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { Observable, combineLatest } from 'rxjs';
import { finalize, first, filter } from 'rxjs/operators';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';

/** Application imports */
import { PersonContactServiceProxy, PersonHistoryDto, CountryDto, CountryStateDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppConsts } from '../../../../../../shared/AppConsts';
import {
    CountriesStoreSelectors,
    RootStore,
    StatesStoreActions,
    StatesStoreSelectors
} from '@root/store';

@Component({
    templateUrl: 'person-history-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/metronic/m-alert.less',
        '../../../../../../shared/metronic/m-helpers.less',
        'person-history-dialog.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    personHistory: PersonHistoryDto[] = [];
    processedHistory: any[] = [];
    personHistoryProperties: string[];
    Object = Object;
    ignoreFields = ['creationTime', 'creatorUserId', 'creatorUserName', 'creatorUserPhotoPublicId', 'source'];
    countries: { [code: string]: { name: string, states: { [code: string]: string } } } = {};

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private personProxy: PersonContactServiceProxy,
        public profileService: ProfileService,
        private store$: Store<RootStore.State>,
        public ls: AppLocalizationService
    ) {
        this.personHistoryProperties = Object.keys(PersonHistoryDto.fromJS({})).filter(prop => !this.ignoreFields.some(x => x == prop));
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.personProxy.getPersonHistory(this.data.contactId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: PersonHistoryDto[]) => {
                this.personHistory = result;
                this.getCountryStates(result, () => {
                    this.processHistory(result.slice().reverse());
                    this.changeDetectorRef.detectChanges();
                });
            });
    }

    getCountryStates(result: PersonHistoryDto[], callback) {
        let countryCodes: string[] = _.unique(result.filter(x => x.drivingLicenseState).map(x => x.citizenship || (x.isUSCitizen ? AppConsts.defaultCountryCode : null)).filter(Boolean));
        let observables: any[] = countryCodes.map(x => this.getStatesByCode(x));
        observables.unshift(this.getCountries());
        combineLatest(observables).subscribe(([countries, ...countryStates]: [CountryDto[], ...CountryStateDto[][]]) => {
            countries.forEach(c => this.countries[c.code] = { name: c.name, states: {} });
            countryCodes.forEach((v, i) => {
                countryStates[i].forEach(state => this.countries[v].states[state.code] = state.name);
            });

            if (callback)
                callback();
        });
    }

    getCountries(): Observable<CountryDto[]> {
        return this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(x => Boolean(x)),
            first()
        );
    }

    getStatesByCode(countryCode: string) : Observable<CountryStateDto[]> {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, {
                countryCode: countryCode
            }),
            filter(x => Boolean(x)),
            first());
    }

    processHistory(personHistory: PersonHistoryDto[]) {
        let processedHistory = [];
        for (let i = 0; i < personHistory.length; i++) {
            let obj = {};

            for (let prop of this.personHistoryProperties) {
                let propValue = personHistory[i][prop];
                let propValueFormatted = this.formatPropValue(prop, propValue, personHistory[i]);

                if (i == 0) {
                    if (propValue || propValue === 0) {
                        obj[prop] = propValueFormatted;
                    }
                } else {
                    let previuosRecordValue = personHistory[i - 1][prop];
                    let isDate = moment.isMoment(propValue);
                    if ((!isDate && previuosRecordValue !== propValue) ||
                        (isDate && !propValue.isSame(previuosRecordValue))) {
                        obj[prop] = propValueFormatted;
                    }
                }
            }

            processedHistory.push(obj);
        }

        this.processedHistory = processedHistory.reverse();
    }

    formatPropValue(propName: string, value: any, object: PersonHistoryDto): string {
        if (!value)
            return value;

        if (moment.isMoment(value)) {
            return moment(value).format(AppConsts.formatting.fieldDate);
        }

        if (propName == 'citizenship') {
            value = this.countries[value] && this.countries[value].name || value;
        }
        if (propName == 'drivingLicenseState' && value) {
            let countryCode = object.citizenship || (object.isUSCitizen ? AppConsts.defaultCountryCode : null);
            if (countryCode) {
                let countryInfo = this.countries[countryCode];
                if (countryInfo) {
                    value = countryInfo.states[value] || value;
                }
            }
        }

        return value;
    }

    getCreationTimeAgo(personHistory: PersonHistoryDto): string {
        return moment(personHistory.creationTime).fromNow();
    }

    getCreationTimeHint(personHistory: PersonHistoryDto): string {
        return moment(personHistory.creationTime).format('YYYY-MM-DD hh:mm:ss');
    }

    canShowProperty(object, index: number, isFirstColumn: boolean): boolean {
        let propsCount = Object.keys(object).length;
        let firstColumnCount = Math.ceil(propsCount / 2);
        return isFirstColumn ? index < firstColumnCount : index >= firstColumnCount;
    }
}
