import { Component, OnInit, Injector, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { FinancialInformationServiceProxy, BankAccountsServiceProxy } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Router } from '@angular/router';
import { SynchProgressComponent } from '@app/cfo/shared/common/synch-progress/synch-progress.component';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ FinancialInformationServiceProxy, BankAccountsServiceProxy ]
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

    headlineConfig: any;

    private rootComponent: any;

    constructor(
        injector: Injector,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();
        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_FinancialAccounts')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: this._cfoService.initialized,
                    action: this.onRefreshClick.bind(this),
                    lable: this.l('Refresh'),
                    icon: 'refresh',
                    class: 'btn-default back-button'
                }, {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Continue'),
                    class: 'btn-layout next-button'
                }
            ]
        };
    }

    onRefreshClick() {
        this.syncComponent.requestSyncAjax(true);
    }

    onNextClick() {
        setTimeout(() => {
            this.syncComponent.requestSyncAjax(true);
            this._cfoService.instanceChangeProcess(() => {
                this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/start']);
            });
        }, 300);
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        CFOComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        CFOComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
    }
}
