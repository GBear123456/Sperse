import {NgModule} from '@angular/core';
import * as ngCommon from '@angular/common';
import {CommonModule} from '../common/common.module';
import {AccountsComponent} from './accounts/accounts.component';
import {CategorizationStatusComponent} from './categorization-status/categorization-status.component';
import {AccountsSynchStatusComponent} from './accounts-synch-status/accounts-synch-status.component';
import {TotalsByPeriodComponent} from './totals-by-period/totals-by-period.component';
import {TrendByPeriodComponent} from './trend-by-period/trend-by-period.component';
import {RoundProgressModule} from 'angular-svg-round-progressbar';

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
        MatDialogModule,
        ngCommon.CommonModule
    ],
    declarations: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
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
        ChooseResetRulesComponent
    ]
})
export class DashboardWidgetsModule {
}
