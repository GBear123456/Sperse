import {Component, OnInit, Injector, ViewChild, OnDestroy, AfterViewInit} from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Router } from '@angular/router';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts-general.component.html',
    styleUrls: ['./bank-accounts-general.component.less'],
    providers: [ SynchProgressService, BankAccountsGeneralService ]
})
export class BankAccountsGeneralComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

    headlineConfig: any;
    private rootComponent: any;

    constructor(
        injector: Injector,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
        private _router: Router,
        private _synchProgress: SynchProgressService,
        private _bankAccountsGeneralService: BankAccountsGeneralService
    ) {
        super(injector);
        this._synchProgress.needRefreshSync$.subscribe(() => {
            this.syncComponent.requestSyncAjax();
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_FinancialAccounts')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            onRefresh: this.onRefreshClick.bind(this),
            buttons: [
                {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Continue'),
                    class: 'btn-layout next-button'
                }
            ]
        };
    }

    onRefreshClick() {
        this._bankAccountsGeneralService.refreshBankAccounts();
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

    progressCompleted() {
        this._synchProgress.syncProgressCompleted();
    }
}
