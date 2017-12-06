import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { BankAccountDailyStatDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'source-data',
    templateUrl: './source-data.component.html',
    styleUrls: ['./source-data.component.less'],
})
export class SourceDataComponent extends AppComponentBase {
    @Input() historicalSourceData: Array<BankAccountDailyStatDto>;
    @Input() forecastSourceData: Array<BankAccountDailyStatDto>;
    @Output('onClose') closingSourceDataEmmitter: EventEmitter<any> = new EventEmitter();

    constructor(injector: Injector) {
        super(injector, AppConsts.localization.CFOLocalizationSourceName);
    }

    formatDate(date) {
        date = moment(date, null, abp.localization.currentLanguage.name);
        return date.format('MMM D, Y');
    }

    emitClosingSourceData() {
        this.closingSourceDataEmmitter.emit();
    }
}
