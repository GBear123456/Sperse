/** Core imports */
import {
    Directive, ComponentFactoryResolver, Injector, AfterViewInit,
    Component, OnDestroy, ViewChild, ViewContainerRef, OnInit
} from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';
import { filter, first, takeUntil } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PortalDashboardComponent } from './dashboard/portal-dashboard.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { AppService } from '@app/app.service';
import { CfoIntroComponent } from '@app/cfo/shared/cfo-intro/cfo-intro.component';

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
export class StartComponent extends CFOComponentBase implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild(AdDashboardHostDirective) adHostDirective: AdDashboardHostDirective;
    private hostComponent: any;
    private hostClass: any = this._cfoService.hasStaticInstance || this.instanceId
        ? PortalDashboardComponent
        : DashboardComponent;
    private introAcceptedCacheKey: string = this.cacheHelper.getCacheKey('CFOIntro', 'IntroAccepted');

    constructor(
        injector: Injector,
        private appService: AppService,
        private cacheService: CacheService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit() {
        if (this.appService.hasModuleSubscription() && this.instanceType == InstanceType.Main) {
            const introAcceptedCache = this.cacheService.get(this.introAcceptedCacheKey);
            /** Show crm wizard if there is no cache for it */
            if (!introAcceptedCache || introAcceptedCache === 'false') {
                this._cfoService.initialized$.pipe(
                    first(),
                    takeUntil(this.deactivate$)
                ).subscribe(() => {
                    this.cacheService.set(this.introAcceptedCacheKey, 'false');
                    this.openDialog();
                });
            }
        }
    }

    instanceChangeProcess() {
        this._cfoService.instanceChangeProcess().subscribe();
        this._cfoService.initialized$
            .pipe(
                takeUntil(this.deactivate$),
                filter(Boolean),
                first()
            )
            .subscribe(() => {
                if (!this.hostComponent) {
                    this.hostComponent = this.adHostDirective.viewContainerRef.createComponent(
                        this.componentFactoryResolver.resolveComponentFactory(this.hostClass)
                    );
                }
            });
    }

    ngAfterViewInit(): void {
        this.instanceChangeProcess();
    }

    openDialog() {
        const dialogConfig: MatDialogConfig = {
            height: '655px',
            width: '880px',
            id: 'cfo-intro',
            panelClass: ['cfo-intro', 'setup'],
            data: { alreadyStarted: this._cfoService.initialized }
        };
        const dialogRef = this.dialog.open(CfoIntroComponent, dialogConfig);
        dialogRef.afterClosed().subscribe(() => {
            /** Mark accepted cache with true when user closed intro and don't want to see it anymore) */
            this.cacheService.set(this.introAcceptedCacheKey, 'true');
        });
    }

    activate() {
        this.instanceChangeProcess();
        if (this.hostComponent)
            this.hostComponent.instance.activate();
    }

    deactivate() {
        if (this.hostComponent)
            this.hostComponent.instance.deactivate();
    }
}
