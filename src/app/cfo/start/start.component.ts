import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Injector, Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DashboardComponent) dashboardComponent: DashboardComponent;
    constructor(injector: Injector,
        private zendeskService: ZendeskService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._cfoService.instanceChangeProcess();
    }

    ngAfterViewInit(): void {
        this.zendeskService.showWidget();
    }

    ngOnDestroy(): void {
        this.zendeskService.hideWidget();
    }

    activate() {
        this._cfoService.instanceChangeProcess();
        this.zendeskService.showWidget();
        if (this.dashboardComponent) {
            this.dashboardComponent.activate();
        }
    }

    deactivate() {
        this.zendeskService.hideWidget();
    }
}
