import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-credit-summary',
    templateUrl: './credit-summary.component.html',
    styleUrls: ['./credit-summary.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditSummaryComponent {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }

    getCreditSummary(item, node) {
        if (node == 'balances' && item[node] || node == 'payments' && item[node]) {
            return item[node].toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            });
        }
        return item[node];
    }
}
