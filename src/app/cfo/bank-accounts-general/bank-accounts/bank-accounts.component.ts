/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { Subscription } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { BankAccountsGeneralService } from '@app/cfo/bank-accounts-general/bank-accounts-general.service';
import { QuovoService } from '@app/cfo/shared/common/quovo/QuovoService';
import { SynchProgressService } from '@app/cfo/shared/common/synch-progress/synch-progress.service';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { InstanceType } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    quovoHandler: any;
    bankAccountsService: BankAccountsService;
    private readonly LOCAL_STORAGE = 0;
    syncAccounts;

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
            this.refresh();
        });
        this.refreshSubscription = this._bankAccountsGeneralService.refresh$.subscribe( () => {
            this.refresh();
        });
    }

    unsubscribeSubscriptions() {
        this.syncCompletedSubscription.unsubscribe();
        this.refreshSubscription.unsubscribe();
    }

    ngOnInit() {
        this.activate();
        this.syncAccounts = this.bankAccountsService.filteredSyncAccounts$.pipe(first());
        this.quovoHandler = this._quovoService.getQuovoHandler(InstanceType[this.instanceType], this.instanceId);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    refresh() {
        const elementForSpinner = document.querySelector('.frame-wrap');
        abp.ui.setBusy(elementForSpinner);
        this.bankAccountsService.loadSyncAccounts().pipe(finalize(() => { abp.ui.clearBusy(elementForSpinner); }))
            .subscribe(() => {});
    }

    entitiesItemsChanged(selectedEntitiesIds: number[]) {
        this.bankAccountsService.changeFilter({
            selectedBusinessEntitiesIds: selectedEntitiesIds,
            selectedBankAccountIds: null
        });
        this.bankAccountsService.applyFilter();
    }

    selectedAccountsChange(syncAccounts) {
        this.bankAccountsService.applyFilter();
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

    activate() {
        /** Load sync accounts */
        this.bankAccountsService.loadSyncAccounts(false)/*.subscribe(() => {
            this.bankAccountsService.applyFilter();
        });*/
    }

    deactivate() {
        //this.bankAccountsService.applyFilter();
        this.unsubscribeSubscriptions();
    }
}
