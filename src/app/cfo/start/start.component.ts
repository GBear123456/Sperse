/** Core imports */
import { Directive, ComponentFactoryResolver, Injector, AfterViewInit,
    Component, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';

/** Third party imports */
import { filter, first, takeUntil } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PortalDashboardComponent } from './dashboard/portal-dashboard.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@Directive({
    selector: '[ad-dashboard-host]'
})
export class AdDashboardHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(AdDashboardHostDirective) adHostDirective: AdDashboardHostDirective;
    private _hostComponent: any;
    private _hostClass: any = this._cfoService.hasStaticInstance || this.instanceId
        ? PortalDashboardComponent
        : DashboardComponent;

    constructor(
        injector: Injector,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) {
        super(injector);
    }

    instanceChangeProcess() {
        this._cfoService.initialized$
            .pipe(
                takeUntil(this.deactivate$),
                filter(Boolean),
                first()
            )
            .subscribe(() => {
                this._hostComponent = this.adHostDirective.viewContainerRef.createComponent(
                    this._componentFactoryResolver.resolveComponentFactory(this._hostClass)
                );
            });
    }

    ngAfterViewInit(): void {
        this.instanceChangeProcess();
    }

    activate() {
        this.instanceChangeProcess();
        if (this._hostComponent)
            this._hostComponent.instance.activate();
    }

    deactivate() {
        if (this._hostComponent)
            this._hostComponent.instance.deactivate();
    }
}
