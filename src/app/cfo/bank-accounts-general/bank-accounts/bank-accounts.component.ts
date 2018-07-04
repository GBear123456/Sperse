import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { BankAccountsServiceProxy, BusinessEntityServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { QuovoService } from '@app/cfo/shared/common/quovo/QuovoService';
import { Subscription, of, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SynchProgressService } from '@app/cfo/shared/common/synch-progress/synch-progress.service';
import { BankAccountsGeneralService } from '@app/cfo/bank-accounts-general/bank-accounts-general.service';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { CacheService } from '../../../../../node_modules/ng2-cache-service';
import * as _ from 'underscore';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy, BankAccountsService ]
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    initialSyncAccounts;
    filteredBankAccounts;
    bankAccounts$;
    businessEntities$;
    accountsDataTotalNetWorth$;
    syncAccountsAmount$;
    accountsAmount$;
    selectedSyncAccounts = [];
    selectedBusinessEntities = [];
    bankAccountIds = null;
    storedVisibleBankAccountIds = [];
    isActive = true;
    bankAccountsCacheKey = `Dashboard_BankAccounts_${abp.session.tenantId}_${abp.session.userId}`;
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    quovoHandler: any;
    private readonly LOCAL_STORAGE = 0;

    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _bankAccountsService: BankAccountsService,
        private _quovoService: QuovoService,
        private _synchProgress: SynchProgressService,
        private _bankAccountsGeneralService: BankAccountsGeneralService,
        private _cacheService: CacheService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(this.LOCAL_STORAGE);
        this.subscribeToObservables();
    }

    subscribeToObservables() {
        this.syncCompletedSubscription = this._synchProgress.syncCompleted$.subscribe(() => {
            this.loadBankAccounts();
        });
        this.refreshSubscription = this._bankAccountsGeneralService.refresh$.subscribe( () => {
            this.loadBankAccounts();
        });
    }

    unsubscribeSubscriptions() {
        this.syncCompletedSubscription.unsubscribe();
        this.refreshSubscription.unsubscribe();
    }

    ngOnInit() {
        this.businessEntities$ = this._businessEntityService.getBusinessEntities(InstanceType[this.instanceType], this.instanceId);
        this.quovoHandler = this._quovoService.getQuovoHandler(InstanceType[this.instanceType], this.instanceId);
        this.checkCachedData();
        this.loadBankAccounts();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    checkCachedData() {
        let dataChanged = false;
        if (this._cacheService.exists(this.bankAccountsCacheKey)) {
            let cacheData = this._cacheService.get(this.bankAccountsCacheKey);
            this.isActive = cacheData['isActive'] ? true : false;
            if (cacheData['visibleBankAccountIds'] &&
                cacheData['visibleBankAccountIds'].length &&
                ArrayHelper.dataChanged(this.bankAccountIds, cacheData['selectedBankAccounts'])
            ) {
                this.selectedBusinessEntities = cacheData['selectedBusinessEntityIds'];
                this.bankAccountIds = cacheData['selectedBankAccounts'] || null;
                this.storedVisibleBankAccountIds = cacheData['visibleBankAccountIds'] || null;
                dataChanged = true;
            }
        }
        return dataChanged;
    }

    loadBankAccounts() {
        this.bankAccounts$ = this._bankAccountsServiceProxy
            .getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD')
            .pipe(
                map(syncAccounts => {
                    this.initialSyncAccounts = syncAccounts;
                    let filteredData = this._bankAccountsService.filterDataSource(syncAccounts, this.selectedBusinessEntities, this.bankAccountIds, this.storedVisibleBankAccountIds, this.isActive);
                    this.filteredBankAccounts = filteredData;
                    this.selectedAccountsChange(filteredData);
                    return filteredData;
                })
            );

    }

    entitiesItemsChanged(selectedEntities) {
        if ((this.selectedBusinessEntities.length !== selectedEntities.length)
            || (_.intersection(this.selectedBusinessEntities, selectedEntities).length !== selectedEntities.length)) {
            this.selectedBusinessEntities = selectedEntities;
            this.bankAccountIds = null;
            this.reloadGrid();
        }
    }

    reloadGrid(cancelIfAllEntities = false) {
        if (cancelIfAllEntities && this.selectedBusinessEntities.length === 0) {
            return false;
        }
        this.filterDataSource();
    }

    selectedAccountsChange(syncAccounts) {
        this.selectedSyncAccounts = this.getSelectedSyncAccounts(syncAccounts);
        let newTotalNetWorth = this.getTotalNetWorth(this.selectedSyncAccounts);
        this.accountsDataTotalNetWorth$ = of(newTotalNetWorth);
        this.syncAccountsAmount$ = this.selectedSyncAccounts.length === syncAccounts.length
            ? of(`${this.selectedSyncAccounts.length}`)
            : of(`${this.selectedSyncAccounts.length} of ${syncAccounts.length}`);
        let selectedBankAccountCount = this.selectedSyncAccounts.reduce((amount, syncAccount) => amount + syncAccount.selectedBankAccounts.length, 0);
        let bankAccountCount = syncAccounts.reduce((amount, syncAccount) => {
            let bankAccounts = syncAccount.data && syncAccount.data.bankAccounts ? syncAccount.data.bankAccounts : syncAccount.bankAccounts;
            return amount + bankAccounts.length;
        }, 0);

        this.accountsAmount$ = selectedBankAccountCount === bankAccountCount
            ? of(`${selectedBankAccountCount}`)
            : of(`${selectedBankAccountCount} of ${bankAccountCount}`);
        this.updateCache();
    }

    getSelectedSyncAccounts(syncAccounts) {
        let selectedSyncAccounts = syncAccounts.filter(row => (!row.data && row.selected != false) || (row.data && (row.data.selected || row.data.selected === null)));
        selectedSyncAccounts.forEach(syncAccount => {
            let bankAccounts = syncAccount.data && syncAccount.data.bankAccounts ? syncAccount.data.bankAccounts : syncAccount.bankAccounts;
            syncAccount.selectedBankAccounts = bankAccounts.filter(account => account.selected);
        });
        return selectedSyncAccounts;
    }

    getTotalNetWorth(syncAccounts) {
        return syncAccounts.reduce((sum, syncAccount) => {
            return syncAccount.selectedBankAccounts.reduce((sum, bankAccount) => bankAccount.balance + sum, 0) + sum;
        }, 0);
    }

    onUpdateAccount(event) {
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
            this.loadBankAccounts();
            this._synchProgress.refreshSyncComponent();
        }
    }

    bankAccountDataChanged() {
        this._synchProgress.refreshSyncComponent();
    }

    filterDataSource() {
        let newData = this._bankAccountsService.filterDataSource(this.initialSyncAccounts, this.selectedBusinessEntities, this.bankAccountIds, this.storedVisibleBankAccountIds, this.isActive);
        this.selectedAccountsChange(newData);
        this.filteredBankAccounts = newData;
        this.bankAccounts$ = from([newData]);
    }

    isActiveChanged() {
        this.bankAccountIds = null;
        this.reloadGrid();
    }

    updateCache() {
        let selectedBankAccountIds = [];
        let bankAccountIds = [];
        this.filteredBankAccounts.forEach(syncAccount => {
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (bankAccount.selected) {
                    selectedBankAccountIds.push(bankAccount.id);
                }
                bankAccountIds.push(bankAccount.id);
            });
        });
        this.bankAccountIds = selectedBankAccountIds;
        this.storedVisibleBankAccountIds = bankAccountIds;
        this._cacheService.set(this.bankAccountsCacheKey, {
            'syncAccounts': this.initialSyncAccounts,
            'selectedBankAccounts': selectedBankAccountIds,
            'isActive': this.isActive,
            'selectedBusinessEntityIds': this.selectedBusinessEntities,
            'visibleBankAccountIds': bankAccountIds
        });
    }

    activate() {}

    deactivate() {
        this.unsubscribeSubscriptions();
    }
}
