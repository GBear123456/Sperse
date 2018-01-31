import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AccountsComponent} from './accounts/accounts.component';
import {CategorizationStatusComponent} from './categorization-status/categorization-status.component';
import {AccountsSynchStatusComponent} from './accounts-synch-status/accounts-synch-status.component';
import {TotalsByPeriodComponent} from './totals-by-period/totals-by-period.component';
import {TrendByPeriodComponent} from './trend-by-period/trend-by-period.component';
import {RoundProgressModule} from 'angular-svg-round-progressbar';

import {DashboardNoDataComponent} from './no-data/dashboard-no-data.component';
import {RouterModule} from '@angular/router';

import {
    DxSelectBoxModule,
    DxTooltipModule,
    DxChartModule
} from 'devextreme-angular';

@NgModule({
    imports: [
        CommonModule,
        RoundProgressModule,
        DxSelectBoxModule,
        DxTooltipModule,
        DxChartModule,
        RouterModule
    ],
    declarations: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
        DashboardNoDataComponent
    ],
    exports: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
        DashboardNoDataComponent
    ]
})
export class DashboardWidgetsModule {
}
