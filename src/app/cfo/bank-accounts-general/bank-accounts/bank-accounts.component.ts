import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { BankAccountsServiceProxy, BusinessEntityServiceProxy, DashboardServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy, BankAccountsService, DashboardServiceProxy ]
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit {
    initialBankAccounts$;
    bankAccounts$;
    businessEntities$;
    accountsDataTotalNetWorth$;
    syncAccountsAmount$;
    accountsAmount$;
    selectedSyncAccounts = [];
    selectedBusinessEntities = [];
    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _dashboardProxy: DashboardServiceProxy,
        private _bankAccountsService: BankAccountsService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.bankAccounts$ = this._bankAccountsServiceProxy
                                .getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD')
                                .map(syncAccounts => {
                                    this.setItemsSelected(syncAccounts);
                                    this.selectedSyncAccounts = this.getSelectedSyncAccounts(syncAccounts);
                                    return syncAccounts;
                                });
        this.initialBankAccounts$ = this.bankAccounts$;
        this.accountsAmount$ = this.bankAccounts$
            .mergeMap(data => data)
            .reduce((amount, bank) => bank.bankAccounts.length + amount, 0);
        this.syncAccountsAmount$ = this.bankAccounts$.pluck('length');
        this.businessEntities$ = this._businessEntityService.getBusinessEntities(InstanceType[this.instanceType], this.instanceId);
        this.accountsDataTotalNetWorth$ = this._dashboardProxy.getAccountTotals(InstanceType[this.instanceType], this.instanceId, []).pluck('totalNetWorth');
    }

    entitiesItemsChanged(selectedEntities) {
        this.selectedBusinessEntities = selectedEntities;
        this.reloadGrid();
    }

    reloadGrid(cancelIfAllEntities = false) {
        if (cancelIfAllEntities && this.selectedBusinessEntities.length === 0) {
            return false;
        }
        this.bankAccounts$ = this.initialBankAccounts$
            .map(syncAccounts => {
                let selectedAccountsIds = this.selectedSyncAccounts.reduce((accounts, syncAccount) => accounts.concat(syncAccount.selectedBankAccounts.map(account => account.id)), []);
                let filteredData = this._bankAccountsService.filterDataSource(syncAccounts, this.selectedBusinessEntities, selectedAccountsIds);
                this.selectedAccountsChange(filteredData);
                return filteredData;
            });
    }

    selectedAccountsChange(syncAccounts) {
        if (syncAccounts && syncAccounts.length) {
            this.selectedSyncAccounts = this.getSelectedSyncAccounts(syncAccounts);
            let newTotalNetWorth = this.getTotalNetWorth(this.selectedSyncAccounts);
            this.accountsDataTotalNetWorth$ = Observable.of(newTotalNetWorth);
            this.syncAccountsAmount$ = Observable.of(`${this.selectedSyncAccounts.length} of ${syncAccounts.length}`);
            this.accountsAmount$ = Observable.of(`${this.selectedSyncAccounts.reduce((amount, syncAccount) => amount + syncAccount.selectedBankAccounts.length, 0)} of ${syncAccounts.reduce((amount, syncAccount) => {
                let bankAccounts = syncAccount.data && syncAccount.data.bankAccounts ? syncAccount.data.bankAccounts : syncAccount.bankAccounts;
                return amount + bankAccounts.length;
            }, 0)}`);
        }
    }

    getSelectedSyncAccounts(syncAccounts) {
        let selectedSyncAccounts = syncAccounts.filter(row => row.selected || (row.data && (row.data.selected || row.data.selected === null)));
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

    setItemsSelected(accounts) {
        accounts.forEach(account => {
            account['selected'] = true;
            account.bankAccounts.forEach(bankAccount => bankAccount['selected'] = true);
        });
    }
}
