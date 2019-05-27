import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CacheService } from 'ng2-cache-service';
import * as moment from 'moment';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PeriodModel } from '@app/shared/common/period/period.model';

@Component({
    selector: 'app-period',
    templateUrl: './period.component.html',
    styleUrls: [ '../../../shared/common/styles/select-box.less']
})
export class PeriodComponent implements AfterViewInit {
    @Output() onChange = new EventEmitter();
    @Input() selectedPeriod: string;
    private readonly PERIOD_CACHE_KEY = 'selected.period';
    availablePeriods = [
        this._ls.l('Today'),
        this._ls.l('Yesterday'),
        this._ls.l('This_Week'),
        this._ls.l('This_Month'),
        this._ls.l('Last_Month'),
        this._ls.l('This_Year'),
        this._ls.l('Last_Year'),
        this._ls.l('All_Periods')
    ];

    constructor(
        private _cacheService: CacheService,
        private _ls: AppLocalizationService
    ) {}

    getCacheKey(key) {
        return this.constructor.name + '_' + key;
    }

    ngAfterViewInit(): void {
        if (this._cacheService.exists(this.getCacheKey(this.PERIOD_CACHE_KEY)))
            this.selectedPeriod = this._cacheService.get(this.getCacheKey(this.PERIOD_CACHE_KEY));
        else
            this.selectedPeriod = this.selectedPeriod || this.availablePeriods[this.availablePeriods.length - 1];
    }

    onPeriodChanged($event) {
        this.onChange.emit(this.getDatePeriodFromName($event.value));
        this._cacheService.set(this.getCacheKey(this.PERIOD_CACHE_KEY), $event.value);
    }

    getDatePeriodFromName(name: string): PeriodModel {
        let period: string;
        let startDate: moment.Moment = moment();
        let endDate: moment.Moment = moment();
        switch (name) {
            case this._ls.l('Today'):
                period = 'day';
                break;
            case this._ls.l('Yesterday'):
                period = 'day';
                startDate.subtract(1, 'day');
                endDate.subtract(1, 'day');
                break;
            case this._ls.l('This_Week'):
                period = 'week';
                break;
            case this._ls.l('This_Month'):
                period = 'month';
                break;
            case this._ls.l('Last_Month'):
                period = 'month';
                startDate.subtract(1, 'month');
                endDate.subtract(1, 'month');
                break;
            case this._ls.l('This_Year'):
                period = 'year';
                break;
            case this._ls.l('Last_Year'):
                period = 'year';
                startDate.subtract(1, 'year');
                endDate.subtract(1, 'year');
                break;
            case this._ls.l('All_Periods'):
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
