import {Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import {
    BankAccountsServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'new-items-totals',
    templateUrl: './new-items-totals.component.html',
    styleUrls: ['./new-items-totals.component.less'],
    providers: []
})
export class NewItemsTotalsComponent extends AppComponentBase implements OnInit {
    totalData: any = {
        startingCount: 999
    };

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
    }

    loadStatsData() {
    }

    getPercentage(maxValue, currValue) {
        return maxValue ? Math.round(Math.abs(currValue) / maxValue * 100) : 0;
    }
}
