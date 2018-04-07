import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Injector, Component, AfterViewInit, OnDestroy } from '@angular/core';
import { SetupComponent } from './setup/setup.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase implements AfterViewInit, OnDestroy {
    constructor(injector: Injector,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy(): void {
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
    }
}