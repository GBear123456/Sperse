import { Injectable, OnInit } from '@angular/core';
import { SyncAccountBankDto, BankAccountDto } from '@shared/service-proxies/service-proxies';
import * as _ from 'underscore';
import { BankAccountsDataModel } from '../bank-accounts-widgets/bank-accounts-data.model';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { FilterModel } from '@shared/filters/models/filter.model';

@Injectable()
export class BankAccountsService implements OnInit {
    constructor() {}
    ngOnInit() {}

    filterDataSource(syncAccounts, businessEntitiesIds, selectedAccountsIds, storedVisibleBankAccounts, isActive = null) {
        let result: SyncAccountBankDto[] = [];
        storedVisibleBankAccounts = !storedVisibleBankAccounts || !selectedAccountsIds || selectedAccountsIds.length === 0 ? [] : storedVisibleBankAccounts;
        syncAccounts.forEach(syncAccount => {
            if (!syncAccount.bankAccounts || !syncAccount.bankAccounts.length) {
                let syncAccountClone = _.clone(syncAccount);
                syncAccountClone['selected'] = false;
                result.push(syncAccountClone);
            } else {
                let selectedBankAccountCount = 0;
                let bankAccounts: BankAccountDto[] = [];
                syncAccount.bankAccounts.forEach(bankAccount => {
                    if ((!businessEntitiesIds.length || (bankAccount.businessEntityId && _.contains(businessEntitiesIds, bankAccount.businessEntityId)))
                        && (isActive === null || bankAccount.isActive === isActive)
                    ) {
                        let bankAccountClone = _.clone(bankAccount);
                        let isBankAccountSelected = (selectedAccountsIds ? _.contains(selectedAccountsIds, bankAccountClone.id) : true)
                            || (storedVisibleBankAccounts.length ? !_.contains(storedVisibleBankAccounts, bankAccountClone.id) : false);
                        bankAccountClone['selected'] = isBankAccountSelected;
                        if (isBankAccountSelected)
                            selectedBankAccountCount++;

                        bankAccounts.push(bankAccountClone);
                    }
                });
                if (bankAccounts.length) {
                    let syncAccountClone = _.clone(syncAccount);
                    syncAccountClone.bankAccounts = bankAccounts;

                    if (selectedBankAccountCount === 0) {
                        syncAccountClone['selected'] = false;
                    } else {
                        if (selectedBankAccountCount === syncAccountClone.bankAccounts.length) {
                            syncAccountClone['selected'] = true;
                        } else {
                            syncAccountClone['selected'] = undefined;
                        }
                    }

                    result.push(syncAccountClone);
                }
            }
        });
        return result;
    }

    changeAndGetBankAccountFilter(accountFilter: FilterModel, data: BankAccountsDataModel, initialDataSource: SyncAccountBankDto[]) {
        let accountFilterModel = <any>accountFilter.items.element;
        if (ArrayHelper.dataChanged(initialDataSource, accountFilterModel.dataSource)) {
            accountFilterModel.dataSource = initialDataSource;
        }
        if (data.bankAccountIds) {
            accountFilter.items['element'].setValue(data.bankAccountIds, accountFilter);
        } else {
            accountFilter.items['element'].setValue([], accountFilter);
        }
        return accountFilter;
    }

    getBankAccountCount(bankAccountIds: number[], visibleAccountCount: number) {
        let bankAccountCount;
        if (!bankAccountIds || !bankAccountIds.length)
            bankAccountCount = '';
        else if (!visibleAccountCount || bankAccountIds.length === visibleAccountCount)
            bankAccountCount = bankAccountIds.length;
        else
            bankAccountCount = bankAccountIds.length + ' of ' + visibleAccountCount;
        return bankAccountCount;
    }
}
