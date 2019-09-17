/** Core imports */
import { Injectable, Inject, Optional, Injector } from '@angular/core';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import * as moment from 'moment';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CFOService } from '@shared/cfo/cfo.service';
import { Period } from '@app/shared/common/period/period.enum';

@Injectable()
export class PeriodService {
    private readonly PERIOD_CACHE_KEY = 'dashboard.selected.period';
    availablePeriods: Period[] = [
        Period.Today,
        Period.Yesterday,
        Period.ThisWeek,
        Period.ThisMonth,
        Period.LastMonth,
        Period.LastQuarter,
        Period.ThisYear,
        Period.LastYear,
        Period.AllPeriods
    ];

    selectedPeriod: PeriodModel;
    considerSettingsTimezone = true;

    constructor(
        injector: Injector,
        private cfoService: CFOService,
        private cacheService: CacheService,
        private ls: AppLocalizationService,
        @Inject('considerSettingsTimezone') @Optional() considerSettingsTimezone?: boolean,
        @Inject('defaultPeriod') @Optional() defaultPeriod?: Period
    ) {
        this.selectedPeriod = this.getDatePeriod(
            this.cacheService.get(this.getCacheKey()) || defaultPeriod || Period.ThisYear
        );
        if (considerSettingsTimezone !== null) {
            this.considerSettingsTimezone = considerSettingsTimezone;
        }
    }

    getCacheKey() {
        return [
            this.PERIOD_CACHE_KEY,
            this.cfoService.instanceId ||
            this.cfoService.instanceType
        ].join('_');
    }

    saveSelectedPeriodInCache(period: Period) {
        this.cacheService.set(this.getCacheKey(), period.toString());
    }

    getDatePeriod(period: Period): PeriodModel {
        let periodName: string;
        let startDate: moment.Moment = this.considerSettingsTimezone ? moment() : DateHelper.getCurrentUtcDate();
        let endDate: moment.Moment = this.considerSettingsTimezone ? moment() : DateHelper.getCurrentUtcDate();
        switch (period) {
            case Period.Today:
                periodName = 'day';
                break;
            case Period.Yesterday:
                periodName = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case Period.ThisWeek:
                periodName = 'isoWeek';
                break;
            case Period.ThisMonth:
                periodName = 'month';
                break;
            case Period.LastMonth:
                periodName = 'month';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case Period.LastQuarter:
                periodName = 'quarter';
                startDate.subtract(1, 'quarter');
                endDate.subtract(1, 'quarter');
                break;
            case Period.ThisYear:
                periodName = 'year';
                break;
            case Period.LastYear:
                periodName = 'year';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            default:
                periodName = 'all';
                break;
        }

        return {
            name: periodName,
            period: period,
            from: periodName !== 'all' ? startDate.startOf(periodName) : undefined,
            to: periodName !== 'all' ? endDate.endOf(periodName) : undefined
        };
    }
}
