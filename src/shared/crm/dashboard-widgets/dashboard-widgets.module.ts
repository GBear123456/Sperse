/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxVectorMapModule } from 'devextreme-angular/ui/vector-map';
import { DxButtonModule } from 'devextreme-angular/ui/button';

/** Application imports */
import { CountsAndTotalsComponent } from './counts-and-totals/counts-and-totals.component';
import { NewItemsTotalsComponent } from './new-items-totals/new-items-totals.component';
import { TotalsByPeriodComponent } from './totals-by-period/totals-by-period.component';
import { TotalsBySourceComponent } from './totals-by-source/totals-by-source.component';
import { RecentClientsComponent } from './recent-clients/recent-clients.component';
import { ClientsByRegionComponent } from './clients-by-region/clients-by-region.component';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        RoundProgressModule,
        DxButtonModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxTooltipModule,
        DxChartModule,
        DxSliderModule,
        DxPieChartModule,
        DxDataGridModule,
        MatDialogModule,
        DxVectorMapModule,
        LoadingSpinnerModule,
        ngCommon.CommonModule
    ],
    declarations: [
        ClientsByRegionComponent,
        CountsAndTotalsComponent,
        NewItemsTotalsComponent,
        TotalsByPeriodComponent,
        TotalsBySourceComponent,
        RecentClientsComponent
    ],
    entryComponents: [],
    exports: [
        ClientsByRegionComponent,
        CountsAndTotalsComponent,
        NewItemsTotalsComponent,
        TotalsByPeriodComponent,
        TotalsBySourceComponent,
        RecentClientsComponent
    ],
    providers: [
        DashboardWidgetsService,
        DashboardServiceProxy
    ]
})
export class CRMDashboardWidgetsModule {
}
