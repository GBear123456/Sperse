/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
//import * as _ from 'underscore';

/** Application imports */
import { BankAccountsGeneralService } from '@app/cfo/bank-accounts-general/bank-accounts-general.service';
import { QuovoService } from '@app/cfo/shared/common/quovo/QuovoService';
import { SynchProgressService } from '@app/cfo/shared/common/synch-progress/synch-progress.service';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { InstanceType, SyncAccountBankDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    syncAccounts$: Observable<SyncAccountBankDto[]>;
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    quovoHandler: any;
    bankAccountsService: BankAccountsService;
    private readonly LOCAL_STORAGE = 0;

    constructor(
        injector: Injector,
        bankAccountsService: BankAccountsService,
        private _quovoService: QuovoService,
        private _synchProgress: SynchProgressService,
        private _bankAccountsGeneralService: BankAccountsGeneralService,
        private _cacheService: CacheService
    ) {
        super(injector);
        this.bankAccountsService = bankAccountsService;
        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        this.subscribeToObservables();
    }

    subscribeToObservables() {
        this.syncCompletedSubscription = this._synchProgress.syncCompleted$.subscribe(() => {
            this.bankAccountsService.load();
        });
        this.refreshSubscription = this._bankAccountsGeneralService.refresh$.subscribe( () => {
            this.bankAccountsService.load();
        });
    }

    unsubscribeSubscriptions() {
        this.syncCompletedSubscription.unsubscribe();
        this.refreshSubscription.unsubscribe();
    }

    ngOnInit() {
        this.bankAccountsService.load();
        /** Get new source if amount of bank accounts changes */
        this.syncAccounts$ = this.bankAccountsService.filteredSyncAccounts$.pipe(distinctUntilChanged((oldSyncAccounts, newSyncAccounts) => oldSyncAccounts.length === newSyncAccounts.length));
        this.quovoHandler = this._quovoService.getQuovoHandler(InstanceType[this.instanceType], this.instanceId);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    entitiesItemsChanged(selectedEntitiesIds: number[]) {
        this.bankAccountsService.changeSelectedBusinessEntities(selectedEntitiesIds);
    }

    selectedAccountsChange(syncAccounts) {
        const selectedBankAccounts = syncAccounts.reduce((selectedBankAccountsIds, syncAccount) => selectedBankAccountsIds.concat(syncAccount.data.bankAccounts.filter(bankAccount => bankAccount.selected).map(bankAccount => bankAccount.id)), []);
        this.bankAccountsService.changeSelectedBankAccountsIds(selectedBankAccounts);
    }

    onUpdateAccount(event) {
        if (!this.isInstanceAdmin)
            return;

        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open(null, event.id);
        } else {
            if (!this.loading) {
                this.startLoading(true);
            }
            setTimeout(() => this.onUpdateAccount({ id: event.id }), 100);
        }
    }

    addAccountClose(event) {
        if (event.addedIds.length) {
            this.bankAccountsService.load();
            this._synchProgress.refreshSyncComponent();
        }
    }

    bankAccountDataChanged() {
        this._synchProgress.refreshSyncComponent();
    }

    isActiveChanged(e) {
        this.bankAccountsService.changeFilter({
            isActive: e.value,
            selectedBankAccountIds: null
        });
    }

    activate() {}

    deactivate() {
        this.unsubscribeSubscriptions();
    }
}
