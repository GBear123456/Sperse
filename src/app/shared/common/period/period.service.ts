import { Injectable } from '@angular/core';
import { CacheService } from '@node_modules/ng2-cache-service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PeriodModel } from '@app/shared/common/period/period.model';
import * as moment from 'moment';

@Injectable()
export class PeriodService {
    private readonly PERIOD_CACHE_KEY = 'dashboard.selected.period';
    availablePeriods: string[] = [
        this.ls.l('Today'),
        this.ls.l('Yesterday'),
        this.ls.l('This_Week'),
        this.ls.l('This_Month'),
        this.ls.l('Last_Month'),
        this.ls.l('This_Year'),
        this.ls.l('Last_Year'),
        this.ls.l('All_Periods')
    ];
    selectedPeriod: PeriodModel = this.getDatePeriodFromName(this.cacheService.exists(this.PERIOD_CACHE_KEY)
        ? this.cacheService.get(this.PERIOD_CACHE_KEY)
        : this.ls.l('This_Month')
    );

    constructor(
        private cacheService: CacheService,
        private ls: AppLocalizationService
    ) {}

    saveSelectedPeriodInCache(period: string) {
        this.cacheService.set(this.PERIOD_CACHE_KEY, period);
    }

    getDatePeriodFromName(name: string): PeriodModel {
        let period: string;
        let startDate: moment.Moment = moment();
        let endDate: moment.Moment = moment();
        switch (name) {
            case this.ls.l('Today'):
                period = 'day';
                break;
            case this.ls.l('Yesterday'):
                period = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this.ls.l('This_Week'):
                period = 'week';
                break;
            case this.ls.l('This_Month'):
                period = 'month';
                break;
            case this.ls.l('Last_Month'):
                period = 'month';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case this.ls.l('This_Year'):
                period = 'year';
                break;
            case this.ls.l('Last_Year'):
                period = 'year';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            case this.ls.l('All_Periods'):
                period = 'all';
                break;
            default:
                period = 'all';
                break;
        }

        return {
            name: name,
            period: period,
            from: period !== 'all' ? startDate.startOf(period) : undefined,
            to: period !== 'all' ? endDate.endOf(period) : undefined
        };
    }
}
