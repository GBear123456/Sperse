import {Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DashboardWidgetsService } from '../dashboard-widgets.service'; 

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
    fields: any;
    dataAvailable = false;
    data = {};

    constructor(
        injector: Injector,
        _dashboardService: DashboardWidgetsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.fields = _dashboardService.totalsDataFields;
        _dashboardService.subscribeTotalsData(result => {            
            this.dataAvailable = result['totalOrderAmount'] || 
                result['totalLeadCount'] || result['totalClientCount']
            this.data = result;
        });
    }

    ngOnInit() {
    }
}