/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party modules */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { ChartModule } from 'angular2-chartjs';
import 'chartjs-plugin-labels';
import { NgCircleProgressModule } from 'ng-circle-progress';

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
import { FooterComponent } from './shared/footer/footer.component';
import { TotalCodesCrackedComponent } from './dashboard/total-codes-cracked/total-codes-cracked.component';
import { GoalsCrackedComponent } from './dashboard/goals-cracked/goals-cracked.component';
import { CountersComponent } from './dashboard/counters/counters.component';
import {NgxPageScrollModule} from '@node_modules/ngx-page-scroll';

@NgModule({
    declarations: [
        DashboardComponent,
        BankCodeComponent,
        ResourcesComponent,
        WelcomeVideoComponent,
        AnnouncementsComponent,
        FooterComponent,
        TotalCodesCrackedComponent,
        GoalsCrackedComponent,
        CountersComponent
    ],
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        BankCodeLayoutModule,
        BankCodeRoutingModule,
        DxScrollViewModule,
        DxProgressBarModule,
        ChartModule,
        NgxPageScrollModule,

        NgCircleProgressModule.forRoot({
            // defaults config
            'radius': 32,
            'space': -5,
            'outerStrokeGradient': false,
            'outerStrokeWidth': 5,
            'innerStrokeWidth': 5,
            'animateTitle': true,
            'animationDuration': 500,
            'showUnits': false,
            'showBackground': false,
            'clockwise': false,
            'titleFontSize': '13',
            'startFromZero': false
        })
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
