/** Core imports */
import { Component, AfterViewInit, ViewChild, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Store } from '@ngrx/store';

/** Application imports */
import { RootStore, StatesStoreActions } from '@root/store';
import { AppService } from '@app/app.service';
import { PeriodComponent } from '@app/shared/common/period/period.component';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { RecentClientsComponent } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients.component';
import { CrmIntroComponent } from '../shared/crm-intro/crm-intro.component';
import { PaymentWizardComponent } from '@app/shared/common/payment-wizard/payment-wizard.component';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [ DashboardWidgetsService ]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(RecentClientsComponent) recentClientsComponent: RecentClientsComponent;
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    private selectedPeriod: any;
    private openDialogTimeout: any;
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
        private _appService: AppService,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private zendeskService: ZendeskService,
        public dialog: MatDialog,
        private store$: Store<RootStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.rootComponent = this.getRootComponent();
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
    }

    refresh() {
        this.periodChanged(this.selectedPeriod);
        this.recentClientsComponent.refresh();
    }

    checkDataEmpty(data) {
        this.dataEmpty = !data.length;
        if (this.dataEmpty) { 
            clearTimeout(this.openDialogTimeout);
            this.openDialogTimeout = setTimeout(() => {
                if (!this._appService.subscriptionIsExpiringSoon() 
                    && !this._appService.subscriptionInGracePeriod()
                ) this.openDialog();
            }, 500);
        }
        this.finishLoading(true);
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
        this.startLoading(true);
        this._appService.updateToolbar(null);

        this.zendeskService.showWidget();
        this.rootComponent.overflowHidden(true);
        this.rootComponent.addScriptLink('https://fast.wistia.com/embed/medias/kqjpmot28u.jsonp');
        this.rootComponent.addScriptLink('https://fast.wistia.com/assets/external/E-v1.js');
    }

    ngOnDestroy() {
        this.zendeskService.hideWidget();
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

    openPaymentWizardDialog() {
        const dialogRef = this.dialog.open(PaymentWizardComponent, {
            height: '655px',
            width: '980px',
            id: 'payment-wizard',
            panelClass: ['payment-wizard', 'setup'],
        });
        dialogRef.afterClosed().subscribe(result => {});
    }

}
