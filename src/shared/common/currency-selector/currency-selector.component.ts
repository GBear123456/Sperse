/** Core imports */
import {
    Component, Input, EventEmitter, Output, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CurrencyCRMService } from 'store/currencies-crm-store/currency.service';

@Component({
    selector: 'currency-selector',
    templateUrl: './currency-selector.component.html',
    styleUrls: ['./currency-selector.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: []
})
export class CurrencySelectorComponent {
    @Input() currency: string;
    @Input() disabled: boolean;
    @Output() currencyChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onCurrencyChanged: EventEmitter<any> = new EventEmitter<any>();

    suspendCurrencyChanged: boolean = false;

    constructor(
        public ls: AppLocalizationService,
        public currencyService: CurrencyCRMService,
        private changeDetectorRef: ChangeDetectorRef
    ) { }

    onValueChanged(event) {
        if (this.suspendCurrencyChanged) {
            this.suspendCurrencyChanged = false;
            return;
        }

        if (event.value) {
            this.currencyChange.emit(event.value);
            this.onCurrencyChanged.emit(event);
        }
        else {
            setTimeout(() => {
                this.suspendCurrencyChanged = true;
                this.currency = event.previousValue;
                this.changeDetectorRef.detectChanges();
            });
        }
    }
}