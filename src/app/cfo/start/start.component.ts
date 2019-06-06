import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Injector, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(DashboardComponent) dashboardComponent: DashboardComponent;
    constructor(injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._cfoService.instanceChangeProcess().subscribe();
    }

    activate() {
        this._cfoService.instanceChangeProcess().subscribe();
        if (this.dashboardComponent) {
            this.dashboardComponent.activate();
        }
    }

    deactivate() {
        if (this.dashboardComponent) {
            this.dashboardComponent.deactivate();
        }
    }
}
