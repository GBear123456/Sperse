/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { BankAccountDailyStatDto } from '@shared/service-proxies/service-proxies';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'source-data',
    templateUrl: './source-data.component.html',
    styleUrls: ['./source-data.component.less'],
})
export class SourceDataComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Input() historicalSourceData: Array<BankAccountDailyStatDto>;
    @Input() forecastSourceData: Array<BankAccountDailyStatDto>;
    @Output('onClose') closingSourceDataEmmitter: EventEmitter<any> = new EventEmitter();

    amountOfItemsOnPage: number;
    constructor(
        injector: Injector,
        private _cfoPreferencesService: CfoPreferencesService,
    ) {
        super(injector);
    }

    ngOnInit() {
        this.amountOfItemsOnPage = (window.innerHeight - 275) / 27;
    }

    formatDate(date) {
        moment.tz.setDefault(undefined);
        date = moment(date, null, abp.localization.currentLanguage.name);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
        return date.format('MMM, Y');
    }

    updateCurrencySymbol = (data) => {
        return data.valueText.replace('$', this._cfoPreferencesService.selectedCurrencySymbol);
    }

    emitClosingSourceData() {
        this.closingSourceDataEmmitter.emit();
    }
}
