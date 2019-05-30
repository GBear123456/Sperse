/** Core imports  */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSliderModule } from 'devextreme-angular/ui/slider';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { AccountsComponent } from './accounts/accounts.component';
import { CategorizationStatusComponent } from './categorization-status/categorization-status.component';
import { AccountsSynchStatusComponent } from './accounts-synch-status/accounts-synch-status.component';
import { TotalsByPeriodComponent } from './totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from './trend-by-period/trend-by-period.component';
import { DashboardService } from './dashboard.service';
import { ChooseResetRulesComponent } from './categorization-status/choose-reset-rules/choose-reset-rules.component';
import { PeriodService } from '@app/shared/common/period/period.service';

@NgModule({
    imports: [
        CommonModule,
        RoundProgressModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxTooltipModule,
        DxChartModule,
        DxSliderModule,
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
    ],
    providers: [ PeriodService, DashboardService ]
})
export class DashboardWidgetsModule {
}
