import { Component, Output, Injector, EventEmitter, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CacheService } from 'ng2-cache-service';

import * as moment from 'moment';

@Component({
    selector: 'app-period',
    templateUrl: './period.component.html',
    styleUrls: ['./period.component.less']
})
export class PeriodComponent extends AppComponentBase implements AfterViewInit {
    @Output() onChange = new EventEmitter();

    private readonly PERIOD_CACHE_KEY = 'selected.period';
    private readonly LOCAL_STORAGE = 0;

    availablePeriods = [
        this.l('Today'),
        this.l('Yesterday'),
        this.l('This_Week'),
        this.l('This_Month'),
        this.l('Last_Month'),
        this.l('This_Year'),
        this.l('Last_Year'),
        this.l('All_Periods')
    ];
    selectedPeriod;

    constructor(
        injector: Injector,
        private _cacheService: CacheService
    ) {
        super(injector);

        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        if (this._cacheService.exists(this.getCacheKey(this.PERIOD_CACHE_KEY)))
            this.selectedPeriod = this._cacheService.get(this.getCacheKey(this.PERIOD_CACHE_KEY));
        else
            this.selectedPeriod = this.availablePeriods[this.availablePeriods.length - 1];
    }

    getCacheKey(key) {
        return this.constructor.name + '_' + key;
    }

    ngAfterViewInit(): void {
        this.onChange.emit(this.getDatePeriodFromName(this.selectedPeriod));
    }

    onPeriodChanged($event) {
        this.onChange.emit(this.getDatePeriodFromName($event.value));
        this._cacheService.set(this.getCacheKey(this.PERIOD_CACHE_KEY), $event.value);
    }

    getDatePeriodFromName(name) {
        let period;
        let startDate = moment();
        let endDate = moment();
        switch (name) {
            case this.l('Today'):
                period = 'day';
                break;
            case this.l('Yesterday'):
                period = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this.l('This_Week'):
                period = 'week';
                break;
            case this.l('This_Month'):
                period = 'month';
                break;
            case this.l('Last_Month'):
                period = 'month';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case this.l('This_Year'):
                period = 'year';
                break;
            case this.l('Last_Year'):
                period = 'year';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            case this.l('All_Periods'):
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
        }
    }
}
