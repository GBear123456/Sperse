import { Component, Injector, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { BankAccountDailyStatDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'source-data',
    templateUrl: './source-data.component.html',
    styleUrls: ['./source-data.component.less'],
})
export class SourceDataComponent extends AppComponentBase implements OnInit {
    @Input() historicalSourceData: Array<BankAccountDailyStatDto>;
    @Input() forecastSourceData: Array<BankAccountDailyStatDto>;
    @Output('onClose') closingSourceDataEmmitter: EventEmitter<any> = new EventEmitter();

    amountOfItemsOnPage: number;
    constructor(injector: Injector) {
        super(injector, AppConsts.localization.CFOLocalizationSourceName);
    }

    ngOnInit() {
        this.amountOfItemsOnPage = (window.innerHeight - 275) / 27;
    }

    formatDate(date) {
        moment.tz.setDefault(undefined);
        date = moment(date, null, abp.localization.currentLanguage.name);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
        return date.format('MMM D, Y');
    }

    emitClosingSourceData() {
        this.closingSourceDataEmmitter.emit();
    }
}
