import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-credit-summary',
    templateUrl: './credit-summary.component.html',
    styleUrls: ['./credit-summary.component.less']
})
export class CreditSummaryComponent extends AppComponentBase implements OnInit {
    @Input() creditReport;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
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
