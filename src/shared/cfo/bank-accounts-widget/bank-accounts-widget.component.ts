import { Component, OnInit, Injector, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { InstanceType, SyncAccountBankDto } from 'shared/service-proxies/service-proxies';
import { AppComponentBase } from 'shared/common/app-component-base';

import { DxDataGridComponent } from 'devextreme-angular';
import * as _ from 'underscore';

@Component({
    selector: 'bank-accounts-widget',
    templateUrl: './bank-accounts-widget.component.html',
    styleUrls: ['./bank-accounts-widget.component.less']
})
export class BankAccountsWidgetComponent extends AppComponentBase implements OnInit {
    private initBankAccountsTimeout: any;
    private initBankAccountHighlightedTimeout: any;
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @Input() showAdvancedColumns = true;
    @Input() highlightUsedRows = false;
    @Input() tableWidth = 740;
    @Input() nameColumnWidth = 240;
    @Input('dataSource')
    set dataSource(dataSource) {
        clearTimeout(this.initBankAccountsTimeout);
        this.initBankAccountsTimeout = setTimeout(() => {
            this.syncAccountsDataSource = dataSource;
            this.getExistBankAccountTypes();
            this.filterByBankAccountType();
            this.setSelectedIfNot();
            this.setHighlighted();
            if (this.mainDataGrid)
                this.mainDataGrid.instance.refresh();
        }, 300);
    }
    @Input('highlightedBankAccountIds')
    set highlightedBankAccountIds(highlightedBankAccountIds) {
        clearTimeout(this.initBankAccountHighlightedTimeout);
        this.initBankAccountHighlightedTimeout = setTimeout(() => {
            this.bankAccountIdsForHighlight = highlightedBankAccountIds;
            this.setHighlighted();
            if (this.mainDataGrid)
                this.mainDataGrid.instance.refresh();
        }, 300);
    }
    syncAccountsDataSource: SyncAccountBankDto[] = [];
    baseBankAccountTypes = ['Checking', 'Savings', 'Credit Card'];
    allAccountTypesFilter: string;
    bankAccountTypesForSelect = [];
    existBankAccountTypes = [];
    selectedBankAccountType: string = null;
    bankAccountIdsForHighlight = [];

    constructor(
        injector: Injector
    ) {
        super(injector);
        
        this.allAccountTypesFilter = this.l('All Accounts');
        this.selectedBankAccountType = this.allAccountTypesFilter;
    }

    ngOnInit(): void {
    }

    rowPrepared(e) {
        if (e.rowType === 'data') {
            if (e.data['highlighted']) {
                e.rowElement.classList.add('highlighted-row');
            }

            if (e.data['isUsed']) {
                e.rowElement.classList.add('used-row');
            }
        }
    }

    setHighlighted() {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let highlightedBankAccountExist = false;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                let isBankAccountHighlighted = _.contains(this.bankAccountIdsForHighlight, bankAccount.id);
                bankAccount['highlighted'] = isBankAccountHighlighted;
                if (isBankAccountHighlighted)
                    highlightedBankAccountExist = true;
            });
            syncAccount['highlighted'] = highlightedBankAccountExist;
        });
    }

    refreshGrid() {
        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }

    masterRowExpandChange(e) {
        if (e.columnIndex !== 0 && e.row) {
            if (e.row.isExpanded) {
                e.component.collapseRow(e.key);
            } else {
                e.component.expandRow(e.key);
            }
        }
    }

    masterSelectionChanged(e) {
        let row = e.component.getVisibleRows()[e.component.getRowIndexByKey(e.key)];
        let isSelected = e.data.selected;
        row.data.bankAccounts.forEach((bankAccount, i) => {
            bankAccount['selected'] = isSelected;
        });
    }

    bankAccountSelectionChanged(e) {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                if (bankAccount['selected']) 
                    selectedBankAccountCount++;
            });

            if (selectedBankAccountCount === 0) {
                syncAccount['selected'] = false;
            } else {
                if (selectedBankAccountCount === syncAccount.bankAccounts.length) {
                    syncAccount['selected'] = true;
                } else {
                    syncAccount['selected'] = null;
                }
            }
            this.mainDataGrid.instance.repaintRows([this.mainDataGrid.instance.getRowIndexByKey(syncAccount.syncAccountId)]);
        });
    }

    bankAccountsSelecteAll() {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            syncAccount.bankAccounts.forEach((bankAccount, i) => {
                bankAccount['selected'] = true;
            });
            syncAccount['selected'] = true;
        });

        if (this.mainDataGrid)
            this.mainDataGrid.instance.refresh();
    }
    
    setSelectedIfNot() {
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach((bankAccount, i) => {  
                if (!bankAccount['selected'])
                    bankAccount['selected'] = false;
                else
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
    }

    getExistBankAccountTypes() {
        this.existBankAccountTypes = [];
        this.syncAccountsDataSource.forEach((syncAccount, i) => {
            let types = _.uniq(_.map(syncAccount.bankAccounts, function (bankAccount) { return bankAccount.type; }));
            this.existBankAccountTypes = _.union(this.existBankAccountTypes, types);
        });
        this.bankAccountTypesForSelect = [];
        this.bankAccountTypesForSelect.push(this.allAccountTypesFilter);
        this.baseBankAccountTypes.forEach((type, i) => {
            if (_.contains(this.existBankAccountTypes, type)) {
                this.bankAccountTypesForSelect.push(type);
            }
        });

        let otherExist = _.difference(this.existBankAccountTypes, this.baseBankAccountTypes).length ? true : false;
        if (otherExist)
            this.bankAccountTypesForSelect.push(this.l('Other'));
    }

    filterByBankAccountType() {
        if (this.selectedBankAccountType === this.allAccountTypesFilter) {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    bankAccount['visible'] = true;
                });
                syncAccount['visible'] = true;
            });
        } else if (this.selectedBankAccountType === this.l('Other')) {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    let isBankAccountVisible = !_.contains(this.bankAccountTypesForSelect, bankAccount.type);
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;;
                });
                syncAccount['visible'] = visibleBankAccountsExist;
            });
        } else {
            this.syncAccountsDataSource.forEach((syncAccount, i) => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    let isBankAccountVisible = this.selectedBankAccountType === bankAccount.type;
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;;
                });
                syncAccount['visible'] = visibleBankAccountsExist;
            });
        }
    }

    bankAccountTypeChanged(e) {
        if (this.selectedBankAccountType !== e.itemData) {
            this.selectedBankAccountType = e.itemData;
            this.filterByBankAccountType();

            if (this.mainDataGrid)
                this.mainDataGrid.instance.refresh();
        }
    } 
}
