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
    DxCheckBoxModule,
    DxTooltipModule,
    DxChartModule
} from 'devextreme-angular';
import { MatDialogModule } from '@angular/material';
import {ChooseResetRulesComponent} from './categorization-status/choose-reset-rules/choose-reset-rules.component';

@NgModule({
    imports: [
        CommonModule,
        RoundProgressModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxTooltipModule,
        DxChartModule,
        RouterModule,
        MatDialogModule
    ],
    declarations: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
        DashboardNoDataComponent,
        ChooseResetRulesComponent
    ],
    entryComponents: [
        ChooseResetRulesComponent
    ],
    exports: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
        DashboardNoDataComponent,
        ChooseResetRulesComponent
    ]
})
export class DashboardWidgetsModule {
}
