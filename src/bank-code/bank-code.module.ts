<<<<<<< HEAD
/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party modules */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { NgxPageScrollModule } from 'ngx-page-scroll';

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
import { WelcomeVideoComponent } from './dashboard/welcome-video/welcome-video.component';
import { AnnouncementsComponent } from './dashboard/announcements/announcements.component';
import { MemberSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule as BankCodeCommonModule} from '@root/bank-code/shared/common/common.module';
import { LayoutService } from '@app/shared/layout/layout.service';

@NgModule({
    declarations: [
        DashboardComponent,
        BankCodeComponent,
        ResourcesComponent,
        WelcomeVideoComponent,
        AnnouncementsComponent
    ],
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        BankCodeCommonModule,
        BankCodeLayoutModule,
        BankCodeRoutingModule,
        DxScrollViewModule,
        DxProgressBarModule,
        NgxPageScrollModule,
    ],
    providers: [ MemberSubscriptionServiceProxy, LayoutService ]
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
=======
/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party modules */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { NgxPageScrollModule } from 'ngx-page-scroll';

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
import { WelcomeVideoComponent } from './dashboard/welcome-video/welcome-video.component';
import { AnnouncementsComponent } from './dashboard/announcements/announcements.component';
import { MemberSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule as BankCodeCommonModule} from '@root/bank-code/shared/common/common.module';
import { LayoutService } from '@app/shared/layout/layout.service';

@NgModule({
    declarations: [
        DashboardComponent,
        BankCodeComponent,
        ResourcesComponent,
        WelcomeVideoComponent,
        AnnouncementsComponent
    ],
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        BankCodeCommonModule,
        BankCodeLayoutModule,
        BankCodeRoutingModule,
        DxScrollViewModule,
        DxProgressBarModule,
        NgxPageScrollModule,
    ],
    providers: [ MemberSubscriptionServiceProxy, LayoutService ]
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
>>>>>>> f999b481882149d107812286d0979872df712626
