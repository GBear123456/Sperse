/** Core imports */
import { Component, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

/** Application imports */
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';

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
    dialogConfig = new MatDialogConfig();

    constructor(
        injector: Injector,
        private _router: Router,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
        public dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.rootComponent = this.getRootComponent();
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
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngOnDestroy() {
        AppComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
        this.rootComponent.removeScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.removeScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
        this.rootComponent.overflowHidden();
    }

    openDialog() {
        this.dialogConfig.height = '655px';
        this.dialogConfig.width = '880px';
        this.dialogConfig.id = 'crm-intro';
        this.dialogConfig.panelClass = ['crm-intro', 'setup'];
        this.dialogConfig.data = { alreadyStarted: false };

        const dialogRef = this.dialog.open(CrmIntroComponent, this.dialogConfig);
        dialogRef.afterClosed().subscribe(result => {
            // if (result && result.isGetStartedButtonClicked) this.onStart();
        });
    }
}
