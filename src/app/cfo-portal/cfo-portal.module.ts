/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';

/** Application imports */
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';
import { DashboardWidgetsModule } from '@shared/cfo/dashboard-widgets/dashboard-widgets.module';
import { CfoPortalRoutingModule } from './cfo-portal-routing.module';
import { PortalDashboardComponent } from './dashboard/dashboard.component';
import { InstanceType } from 'shared/service-proxies/service-proxies';
import { CfoModule } from '@app/cfo/cfo.module';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppService } from '@app/app.service';
import { TopSpendingCategoriesComponent } from './top-spending-categories/top-spending-categories.component';

@NgModule({
    declarations: [
        PortalDashboardComponent,
        TopSpendingCategoriesComponent
    ],
    imports: [
        CfoPortalRoutingModule,
        CfoModule,
        CommonModule,
        NoDataModule,
        AppCommonModule,
        DashboardWidgetsModule,
        BankAccountsCommonModule,
        DxScrollViewModule,
        DxPieChartModule
    ],
    entryComponents: [
        PortalDashboardComponent
    ]
})

export class CfoPortalModule {
    constructor(
        private _layoutService: LayoutService,
        private _cfoService: CFOService,
        private _appService: AppService
    ) {
        _layoutService.showPlatformSelectMenu = false;

        _cfoService.hasStaticInstance = true;
        _cfoService.instanceType = InstanceType.User;
        _appService.toolbarToggle();
    }
}
