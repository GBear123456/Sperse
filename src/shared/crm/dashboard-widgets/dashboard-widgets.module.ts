import {NgModule} from '@angular/core';
import * as ngCommon from '@angular/common';
import {CommonModule} from '@shared/common/common.module';
import {RoundProgressModule} from 'angular-svg-round-progressbar';
import { RouterModule } from '@angular/router';

import { CountsAndTotalsComponent } from './counts-and-totals/counts-and-totals.component';
import { NewItemsTotalsComponent } from './new-items-totals/new-items-totals.component';
import { TotalsByPeriodComponent } from './totals-by-period/totals-by-period.component';
import { TotalsBySourceComponent } from './totals-by-source/totals-by-source.component';
import { RecentClientsComponent } from './recent-clients/recent-clients.component';
import { ClientsByReginComponent } from './clients-by-region/clients-by-region.component';
import { DashboardWidgetsService } from './dashboard-widgets.service'; 

import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';

import {
    DxSelectBoxModule,
    DxCheckBoxModule,
    DxTooltipModule,
    DxChartModule,
    DxSliderModule,
    DxPieChartModule,
    DxDataGridModule,
    DxVectorMapModule
} from 'devextreme-angular';
import { MatDialogModule } from '@angular/material';

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
        DxPieChartModule,
        DxDataGridModule,
        MatDialogModule,
        DxVectorMapModule, 
        ngCommon.CommonModule
    ],
    declarations: [
        ClientsByReginComponent,
        CountsAndTotalsComponent,
        NewItemsTotalsComponent,
        TotalsByPeriodComponent,
        TotalsBySourceComponent,
        RecentClientsComponent
    ],
    entryComponents: [
    ],
    exports: [
        ClientsByReginComponent,
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