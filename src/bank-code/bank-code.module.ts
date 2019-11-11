/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

/** Third party modules */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { ChartModule } from 'angular2-chartjs';
import 'chartjs-plugin-labels';
// import { ProgressBarModule } from 'angular2-progressbar/dist/progressbar.module';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { BankCodeComponent } from './bank-code.component';
import { BankCodeRoutingModule } from './bank-code-routing.module';
import { BankCodeLayoutModule } from './shared/layout/bank-code-layout.module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { BankCodeLayoutService } from './shared/layout/bank-code-layout.service';
import { UserManagementListComponent } from '@shared/common/layout/user-management-list/user-management-list.component';
import { DashboardComponent } from '@root/bank-code/dashboard/dashboard.component';
import { ResourcesComponent } from '@root/bank-code/resources/resources.component';

@NgModule({
    declarations: [
        DashboardComponent,
        BankCodeComponent,
        ResourcesComponent
    ],
    imports: [
        ngCommon.CommonModule,
        BrowserModule,
        // ProgressBarModule,
        CommonModule,
        BankCodeLayoutModule,
        BankCodeRoutingModule,
        DxScrollViewModule,
        ChartModule
    ]
})
export class BankCodeModule {
    constructor(
        private layoutService: BankCodeLayoutService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private sessionService: AppSessionService
    ) {
        if (this.sessionService.userId) {
            this.layoutService.headerContentUpdate(
                this.componentFactoryResolver.resolveComponentFactory(UserManagementListComponent)
            );
        }
    }
}
