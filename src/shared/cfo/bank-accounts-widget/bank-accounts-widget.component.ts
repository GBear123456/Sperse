import { Component, OnInit, Injector, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { SyncAccountBankDto } from 'shared/service-proxies/service-proxies';
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
    @Input() tableWidth = 755;
    @Input() nameColumnWidth = 170;
    @Input() height;
    @Input() showColumnHeaders = false;
    @Input('dataSource')
    set dataSource(dataSource) {
        clearTimeout(this.initBankAccountsTimeout);
        this.initBankAccountsTimeout = setTimeout(() => {
            this.syncAccountsDataSource = dataSource;
            if (this.syncAccountsDataSource) {
                this.getExistBankAccountTypes();
                this.filterByBankAccountType();
                this.setSelectedIfNot();
                this.setHighlighted();
            }
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
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();

    syncAccountsDataSource: SyncAccountBankDto[] = [];
    baseBankAccountTypes = ['Checking', 'Savings', 'Credit Card'];
    allAccountTypesFilter: string;
    bankAccountTypesForSelect = [];
    existBankAccountTypes = [];
    selectedBankAccountType: string = null;
    bankAccountIdsForHighlight = [];
    expandChangedRow = null;

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.allAccountTypesFilter = this.l('AllAccounts');
        this.selectedBankAccountType = this.allAccountTypesFilter;
    }

    ngOnInit(): void {}

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

    addEmptyRow(rowElement) {
        /** Add row with padding */
        let emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td></td>';
        emptyRow.className = 'emptyRow';
        rowElement.parentElement.insertBefore(emptyRow, rowElement.nextElementSibling);
    }

    setHighlighted() {
        this.syncAccountsDataSource.forEach(syncAccount => {
            let highlightedBankAccountExist = false;
            syncAccount.bankAccounts.forEach(bankAccount => {
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
        if (e.rowType === 'data') {
            this.expandChangedRow = e.rowElement;
            if (e.isExpanded) {
                e.component.collapseRow(e.key);
            } else {
                e.component.expandRow(e.key);
            }
        }
    }

    masterSelectionChanged(e) {
        let row = e.component.getVisibleRows()[e.component.getRowIndexByKey(e.key)];
        let isSelected = e.data.selected;
        row.data.bankAccounts.forEach(bankAccount => {
            bankAccount['selected'] = isSelected;
        });
        this.selectedAccountsChanged();
    }

    bankAccountSelectionChanged(e) {
        this.syncAccountsDataSource.forEach(syncAccount => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (bankAccount['selected'])
                    selectedBankAccountCount++;
            });

            if (selectedBankAccountCount === 0) {
                syncAccount['selected'] = false;
            } else {
                syncAccount['selected'] = selectedBankAccountCount === syncAccount.bankAccounts.length ? true : null;
            }
            this.mainDataGrid.instance.repaintRows([this.mainDataGrid.instance.getRowIndexByKey(syncAccount.syncAccountId)]);
        });
        this.selectedAccountsChanged();
    }

    selectedAccountsChanged() {
        let selectedSyncAccounts = this.mainDataGrid.instance.getVisibleRows().filter(row => row.rowType === 'data');
        this.selectionChanged.emit(selectedSyncAccounts);
    }

    setSelectedIfNot() {
        this.syncAccountsDataSource.forEach(syncAccount => {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach(bankAccount => {
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
        this.syncAccountsDataSource.forEach(syncAccount => {
            let types = _.uniq(_.map(syncAccount.bankAccounts, bankAccount => bankAccount.type));
            this.existBankAccountTypes = _.union(this.existBankAccountTypes, types);
        });
        this.bankAccountTypesForSelect = [];
        this.bankAccountTypesForSelect.push(this.allAccountTypesFilter);
        this.baseBankAccountTypes.forEach(type => {
            this.bankAccountTypesForSelect.push(type);
        });

        let otherExist = _.some(this.existBankAccountTypes, x => !_.contains(this.baseBankAccountTypes, x));
        if (otherExist)
            this.bankAccountTypesForSelect.push(this.l('Other'));
    }

    filterByBankAccountType() {
        if (this.selectedBankAccountType === this.allAccountTypesFilter) {
            this.syncAccountsDataSource.forEach(syncAccount => {
                syncAccount.bankAccounts.forEach(bankAccount => {
                    bankAccount['visible'] = true;
                });
                syncAccount['visible'] = true;
            });
        } else if (this.selectedBankAccountType === this.l('Other')) {
            this.syncAccountsDataSource.forEach(syncAccount => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = !_.contains(this.bankAccountTypesForSelect, bankAccount.type);
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;
                });
                syncAccount['visible'] = visibleBankAccountsExist;
            });
        } else {
            this.syncAccountsDataSource.forEach(syncAccount => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = this.selectedBankAccountType === bankAccount.type;
                    bankAccount['visible'] = isBankAccountVisible;
                    if (isBankAccountVisible)
                        visibleBankAccountsExist = true;
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

    calculateTooltipHeight() {
        return window.innerHeight / 2;
    }

    /**
     * Added empty rows to add space between rows (hack to avoid spacing between row and details)
     */
    addEmptyRows() {
        $('.emptyRow').remove();
        let rowsWithoutDetails = document.querySelectorAll('.dx-datagrid-content tr:not(.emptyRow):not(.dx-master-detail-row)');
        for (let i = 0; i < rowsWithoutDetails.length; i++) {
            let row = rowsWithoutDetails[i];
            if (row.nextElementSibling === rowsWithoutDetails[i + 1] ||
                (row.nextElementSibling && row.nextElementSibling.classList.contains('dx-state-invisible'))) {
                /** @todo rewrite to avoid memory leask */
                this.addEmptyRow(row);
            }
        }
    }

    contentReady() {
        this.addEmptyRows();
    }
}
