/** Core imports */
import { Component, OnInit, Injector, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { first, mapTo, skip, switchMap } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { SyncAccountServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CfoStore, CurrenciesStoreSelectors } from '@app/cfo/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts-general.component.html',
    styleUrls: ['./bank-accounts-general.component.less'],
    providers: [ BankAccountsGeneralService, SyncAccountServiceProxy, LifecycleSubjectsService ]
})
export class BankAccountsGeneralComponent extends CFOComponentBase implements OnInit, AfterViewInit {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

    headlineConfig: any;
    private rootComponent: any;
    createAccountAvailable = false;
    leftMenuHidden = true;

    constructor(
        injector: Injector,
        private _synchProgress: SynchProgressService,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _bankAccountsGeneralService: BankAccountsGeneralService,
        private _dialog: MatDialog,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService,
        private store$: Store<CfoStore.State>,
        private _lifeCycleService: LifecycleSubjectsService
    ) {
        super(injector);
        this._synchProgress.needRefreshSync$.subscribe(() => {
            this._synchProgress.startSynchronization();
        });
        this._syncAccountServiceProxy.createIsAllowed(this._cfoService.instanceType as InstanceType, this.instanceId)
            .subscribe((result) => {
                this.createAccountAvailable = result;
                this.initHeadlineConfig();
            });
    }

    ngOnInit() {
        this.initHeadlineConfig();
        const selectedCurrencyId$ = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId));

        selectedCurrencyId$.pipe(
            skip(1),
            switchMap((data) => this.componentIsActivated ? of(data) : this._lifeCycleService.activate$.pipe(first(), mapTo(data))),
        ).subscribe(() => {
            this.refresh();
        });
    }

    ngAfterViewInit() {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    private initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('Accounts')],
            iconSrc: './assets/common/icons/magic-stick-icon.svg',
            onRefresh: this._cfoService.hasStaticInstance ? undefined : this.refresh.bind(this),
            buttons: [
                {
                    enabled: true,
                    action: () => this.leftMenuHidden = !this.leftMenuHidden,
                    lable: '',
                    class: 'toggle dx-button'
                }
            ]
        };
    }

    refresh() {
        this._bankAccountsGeneralService.refreshBankAccounts();
    }

    activate() {
        this._lifeCycleService.activate.next();
        this.syncComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this.syncComponent.deactivate();
        this.rootComponent.overflowHidden();
    }
}
