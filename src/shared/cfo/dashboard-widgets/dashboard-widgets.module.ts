/** Core imports  */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { InlineSVGModule } from 'ng-inline-svg';
import { InlineSVGConfig } from 'ng-inline-svg/lib/inline-svg.config';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { AccountsComponent } from './accounts/accounts.component';
import { CategorizationStatusComponent } from './categorization-status/categorization-status.component';
import { AccountsSynchStatusComponent } from './accounts-synch-status/accounts-synch-status.component';
import { TotalsByPeriodComponent } from './totals-by-period/totals-by-period.component';
import { TrendByPeriodComponent } from './trend-by-period/trend-by-period.component';
import { DashboardService } from './dashboard.service';
import { ChooseResetRulesComponent } from './categorization-status/choose-reset-rules/choose-reset-rules.component';
import { TopSpendingCategoriesComponent } from './top-spending-categories/top-spending-categories.component';
import { PeriodService } from '@app/shared/common/period/period.service';
import { Period } from '@app/shared/common/period/period.enum';
import { CFOService } from '@shared/cfo/cfo.service';

export function defaultPeriodFactory(cfoService: CFOService) {
    return cfoService && cfoService.hasStaticInstance ? Period.LastQuarter : Period.ThisYear;
}

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        RoundProgressModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxTooltipModule,
        DxChartModule,
        DxSliderModule,
        MatDialogModule,
        DxPieChartModule,
        InlineSVGModule.forRoot(new InlineSVGConfig()),
        ngCommon.CommonModule
    ],
    declarations: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent,
        TotalsByPeriodComponent,
        TrendByPeriodComponent,
        ChooseResetRulesComponent,
        TopSpendingCategoriesComponent
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
        ChooseResetRulesComponent,
        TopSpendingCategoriesComponent
    ],
    providers: [
        { provide: 'considerSettingsTimezone', useValue: false },
        {
            provide: 'defaultPeriod',
            useFactory: defaultPeriodFactory,
            deps: [ CFOService ]
        },
        PeriodService,
        DashboardService
    ]
})
export class DashboardWidgetsModule {
}
