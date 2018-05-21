import { Router } from '@angular/router';
import { Component, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppConsts } from '@shared/AppConsts';
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [DashboardWidgetsService]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(RecentClientsComponent) recentClientsComponent: RecentClientsComponent;
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    private selectedPeriod: any;
    public dataEmpty: boolean;
    public headlineConfig = {
      names: [this.l('Dashboard')],
      onRefresh: this.refresh.bind(this),
      text: this.l('statistics and reports'),
      icon: 'globe',
      buttons: []
    };

    constructor(
        injector: Injector,
        private _router: Router,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    refresh() {
        this.periodChanged(this.selectedPeriod);
        this.recentClientsComponent.refresh();
    }

    checkDataEmpty(data) {
        this.dataEmpty = !data.length;
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], { queryParams: { action: 'addNew' } });
    }

    periodChanged($event) {
        this._dashboardWidgetsService.periodChanged(
            this.selectedPeriod = $event
        );
    }

    ngAfterViewInit(): void {
        AppComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        AppComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
        this.rootComponent.overflowHidden();
    }
}
