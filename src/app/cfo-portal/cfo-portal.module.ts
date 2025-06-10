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
import { InstanceType } from 'shared/service-proxies/service-proxies';
import { CfoModule } from '@app/cfo/cfo.module';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppService } from '@app/app.service';

@NgModule({
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
    ]
})

export class CfoPortalModule {
    constructor(
        private layoutService: LayoutService,
        private cfoService: CFOService,
        private appService: AppService
    ) {
        cfoService.hasStaticInstance = true;
        cfoService.instanceType = InstanceType.User;
        appService.toolbarToggle();
    }
}
