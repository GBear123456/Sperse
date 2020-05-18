/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { NgxPageScrollModule } from 'ngx-page-scroll';

/** Application imports */
import { BankCodeLayoutService } from './shared/layout/bank-code-layout.service';
import { BankCodeComponent } from './bank-code.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BankCodeRoutingModule } from './bank-code-routing.module';
import { ProductsDropdownComponent } from './header/products-dropdown/products-dropdown.component';
import { StartWidgetComponent } from './dashboard/start-widget/start-widget.component';
import { StatsComponent } from './dashboard/stats/stats.component';
import { BeginOverlayComponent } from './shared/begin-overlay/begin-overlay.component';
import { LeadsComponent } from './dashboard/leads/leads.component';
import { BankCodeLettersModule } from '../app/shared/common/bank-code-letters/bank-code-letters.module';
import { PhoneFormatModule } from '../shared/common/pipes/phone-format/phone-format.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProcessBoardComponent } from './dashboard/process-board/process-board.component';
import { CompleteComponent } from './dashboard/complete/complete.component';
import { BankCodeLayoutModule } from '../bank-code/shared/layout/bank-code-layout.module';
import { ResourcesComponent } from '../bank-code/resources/resources.component';
import { CommonModule as BankCodeCommonModule} from '@root/bank-code/shared/common/common.module';
import { AppSessionService } from '../shared/common/session/app-session.service';
import { UserManagementListComponent } from '../shared/common/layout/user-management-list/user-management-list.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        BankCodeRoutingModule,
        DxProgressBarModule,
        DxDataGridModule,
        DxScrollViewModule,
        BankCodeLettersModule,
        PhoneFormatModule,
        BankCodeLayoutModule,
        BankCodeCommonModule,
        NgxPageScrollModule
    ],
    exports: [],
    declarations: [
        HeaderComponent,
        DashboardComponent,
        ProductsDropdownComponent,
        ProcessBoardComponent,
        StartWidgetComponent,
        StatsComponent,
        CompleteComponent,
        SidebarComponent,
        LeadsComponent,
        BankCodeComponent,
        BeginOverlayComponent,
        ResourcesComponent
    ],
    providers: [],
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
