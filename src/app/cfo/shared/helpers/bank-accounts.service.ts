import { Injectable, OnInit } from '@angular/core';
import { SyncAccountBankDto, BankAccountDto } from '@shared/service-proxies/service-proxies';
import * as _ from 'underscore';

@Injectable()
export class BankAccountsService implements OnInit {
    constructor() {}
    ngOnInit() {}

    filterDataSource(syncAccounts, businessEntitiesIds, selectedAccountsIds, storedVisibleBankAccounts, isActive = null) {
        let result: SyncAccountBankDto[] = [];
        storedVisibleBankAccounts = !storedVisibleBankAccounts || !selectedAccountsIds || selectedAccountsIds.length === 0 ? [] : storedVisibleBankAccounts;
        syncAccounts.forEach(syncAccount => {
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
        });
        return result;
    }
}
