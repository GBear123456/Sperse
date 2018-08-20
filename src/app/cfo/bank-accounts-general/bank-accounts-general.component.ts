import {Component, OnInit, Injector, ViewChild, OnDestroy, AfterViewInit} from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';

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
        private zendeskService: ZendeskService,
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
        this.zendeskService.showWidget();
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this.zendeskService.hideWidget();
    }

    progressCompleted() {
        this._synchProgress.syncProgressCompleted();
    }
}
