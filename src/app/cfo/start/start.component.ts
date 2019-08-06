import { Directive, ComponentFactoryResolver, Injector, AfterViewInit,
    Component, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';

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
    private _hostClass: any;

    constructor(injector: Injector,
        private _componentFactoryResolver: ComponentFactoryResolver
    ) {
        super(injector);
        this._activatedRoute.data.subscribe((data) => {
            if (data.host)
                this._hostClass = data.host;
        });
    }

    instanceChangeProcess() {
        this._cfoService.instanceChangeProcess().subscribe(() => {
            if (this._cfoService.initialized && this._hostClass)
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