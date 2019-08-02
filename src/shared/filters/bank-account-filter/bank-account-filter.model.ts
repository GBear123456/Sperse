import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'underscore';

export class BankAccountFilterModel extends FilterItemModel {
    keyExpr: any;
    nameField: string;
    disableOuterScroll = true;

    public constructor(init?: Partial<BankAccountFilterModel>) {
        super(init, true);
    }

    get value(): any {
        let result = [];
        this.dataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected']) {
                    result.push(bankAccount.id);
                }
            });
        });
        this._value = result;
        return result;
    }
    set value(value: any) {
        this._value = value = value || [];
        this.dataSource.forEach((syncAccount) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount) => {
                if (bankAccount['selected'] = _.contains(value, bankAccount.id))
                    selectedBankAccountCount++;
            });

            syncAccount['selected'] = selectedBankAccountCount ? 
                selectedBankAccountCount === syncAccount.bankAccounts.length || undefined : 
                false;
        });
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.dataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected']) {
                    result.push(<DisplayElement>{
                        item: this,
                        displayValue: (bankAccount.accountName || '') + ':' + bankAccount.accountNumber,
                        args: bankAccount.id,
                        sortField: bankAccount.id
                    });
                }
            });
        });
        return result;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args) {
            this.dataSource.forEach((syncAccount, i) => {
                let selectedBankAccountCount = 0;
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    if (bankAccount.id === args) {
                        bankAccount['selected'] = false;
                    }
                    if (bankAccount['selected'])
                        selectedBankAccountCount++;
                });
                if (selectedBankAccountCount === 0) {
                    syncAccount['selected'] = false;
                } else {
                    if (selectedBankAccountCount === syncAccount.bankAccounts.length) {
                        syncAccount['selected'] = true;
                    } else {
                        syncAccount['selected'] = undefined;
                    }
                }
            });
        } else {
            this.value = [];
        }
    }
}
