/** Core imports */
import { Component, OnInit, Injector, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
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
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts-general.component.html',
    styleUrls: ['./bank-accounts-general.component.less'],
    providers: [ BankAccountsGeneralService, SyncAccountServiceProxy, LifecycleSubjectsService ]
})
export class BankAccountsGeneralComponent extends CFOComponentBase implements OnInit, AfterViewInit {
    @ViewChild(SynchProgressComponent, { static: false }) syncComponent: SynchProgressComponent;

    private rootComponent: any;
    createAccountAvailable = false;

    constructor(
        injector: Injector,
        private synchProgress: SynchProgressService,
        private syncAccountServiceProxy: SyncAccountServiceProxy,
        private bankAccountsGeneralService: BankAccountsGeneralService,
        private dialog: MatDialog,
        private store$: Store<RootStore.State>,
        private lifeCycleService: LifecycleSubjectsService,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.synchProgress.needRefreshSync$.subscribe(() => {
            this.synchProgress.startSynchronization();
        });
        this.syncAccountServiceProxy.createIsAllowed(this._cfoService.instanceType as InstanceType, this.instanceId)
            .subscribe((result: boolean) => {
                this.createAccountAvailable = result;
            });
    }

    ngOnInit() {
        this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId)).pipe(
            skip(1),
            switchMap((data) => {
                return this.componentIsActivated
                    ? of(data)
                    : this.lifeCycleService.activate$.pipe(first(), mapTo(data));
            }),
        ).subscribe(() => {
            this.refresh();
        });
    }

    ngAfterViewInit() {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    reload() {
        this.refresh();
    }

    refresh() {
        this.bankAccountsGeneralService.refreshBankAccounts();
    }

    repaint() {
        this.bankAccountsGeneralService.repaintAccountGrid();
    }

    activate() {
        this.lifeCycleService.activate.next();
        this.syncComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this.syncComponent.deactivate();
        this.rootComponent.overflowHidden();
    }
}
