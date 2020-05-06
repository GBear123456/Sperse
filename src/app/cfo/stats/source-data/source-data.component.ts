/** Core imports */
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { BankAccountDailyStatDto } from '@shared/service-proxies/service-proxies';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'source-data',
    templateUrl: './source-data.component.html',
    styleUrls: ['./source-data.component.less'],
})
export class SourceDataComponent implements OnInit {
    @Input() historicalSourceData: Array<BankAccountDailyStatDto>;
    @Input() forecastSourceData: Array<BankAccountDailyStatDto>;
    @Output('onClose') closingSourceDataEmitter: EventEmitter<any> = new EventEmitter();
    capitalize = capitalize;
    amountOfItemsOnPage: number;
    constructor(
        private cfoPreferencesService: CfoPreferencesService,
        public ls: AppLocalizationService
    ) {}

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
        return data.valueText.replace('$', this.cfoPreferencesService.selectedCurrencySymbol);
    }

    emitClosingSourceData() {
        this.closingSourceDataEmitter.emit();
    }
}
