import { Component, Injector, Input, Output, ViewChild, OnInit, EventEmitter, ElementRef } from '@angular/core';
import { BankAccountsServiceProxy, BusinessEntityServiceProxy, SyncAccountServiceProxy, SyncServiceProxy, SyncAccountBankDto, UpdateBankAccountDto, RenameSyncAccountInput } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxDataGridComponent } from 'devextreme-angular';
import * as _ from 'underscore';
import Form from 'devextreme/ui/form';
import { CFOService } from '@shared/cfo/cfo.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'bank-accounts-widget',
    templateUrl: './bank-accounts-widget.component.html',
    styleUrls: ['./bank-accounts-widget.component.less'],
    providers: [BankAccountsServiceProxy, BusinessEntityServiceProxy, SyncAccountServiceProxy, SyncServiceProxy]
})
export class BankAccountsWidgetComponent extends CFOComponentBase implements OnInit {
    private initBankAccountsTimeout: any;
    private initBankAccountHighlightedTimeout: any;
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @ViewChild('filterActions', { read: ElementRef }) filterActions: ElementRef;
    @Input() showAdvancedColumns = true;
    @Input() highlightUsedRows = false;
    @Input() nameColumnWidth = 170;
    @Input() height;
    @Input() showColumnHeaders = false;
    @Input() allowUpdateAccount = false;
    @Input() showSyncAccountWithoutBankAccounts = true;
    @Input() showCreditInfo = false;
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
    @Input() allowBankAccountsEditing = false;
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() accountsEntitiesBindingChanged: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateAccount: EventEmitter<any> = new EventEmitter();
    @Output() reloadDataSource: EventEmitter<any> = new EventEmitter();
    @Output() onDataChange: EventEmitter<any> = new EventEmitter();

    syncAccountsDataSource: SyncAccountBankDto[] = [];
    baseBankAccountTypes = ['Checking', 'Savings', 'Credit Card', 'Brokerage Account'];
    allAccountTypesFilter: string;
    bankAccountTypesForSelect = [];
    existBankAccountTypes = [];
    selectedBankAccountType: string = null;
    bankAccountIdsForHighlight = [];
    editingStarted = false;

    /** Editing form instance */
    dxFormInstance: Form;

    instanceType;
    instanceId;

    /** Default empty business entity */
    businessEntities = [{ id: null, name: '' }];

    accountsTypes;
    cfoService: CFOService;

    isContextMenuVisible = false;
    contextMenuItems = [
        { text: this.l('Edit_Name') },
        { text: this.l('Sync_Now') },
        { text: this.l('Update_Info') },
        { text: this.l('Delete') }
    ];
    syncAccountId: number;
    syncAccountIds = [];
    syncRef = '';
    popupVisible = false;
    bankAccountInfo: RenameSyncAccountInput = new RenameSyncAccountInput();

    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _syncServiceProxy: SyncServiceProxy,

    ) {
        super(injector);
        this.allAccountTypesFilter = this.l('AllAccounts');
        this.selectedBankAccountType = this.allAccountTypesFilter;
        this.cfoService = injector.get(CFOService, null);
    }

    ngOnInit(): void {
        if (!this.isInstanceAdmin) {
            this.contextMenuItems = [
                { text: this.l('Sync_Now') }
            ];
        }
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
        if (e.isExpanded) {
            this.mainDataGrid.instance.collapseRow(e.key);
        } else {
            if (e.data.bankAccounts.length) {
                this.mainDataGrid.instance.expandRow(e.key);
            }
        }
    }

    masterSelectionChanged(e) {
        let isSelected = e.data.selected;
        e.data.bankAccounts.forEach(bankAccount => {
            bankAccount['selected'] = isSelected;
        });
        this.selectedAccountsChanged();
    }

    bankAccountSelectionChanged(e) {
        this.syncAccountsDataSource.forEach(syncAccount => {
            if (syncAccount.bankAccounts.length) {
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
            let types = _.uniq(_.map(syncAccount.bankAccounts, bankAccount => bankAccount.typeName));
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
                syncAccount['visible'] = this.showSyncAccountWithoutBankAccounts || syncAccount.bankAccounts.length > 0;
            });
        } else if (this.selectedBankAccountType === this.l('Other')) {
            this.syncAccountsDataSource.forEach(syncAccount => {
                let visibleBankAccountsExist = false;
                syncAccount.bankAccounts.forEach(bankAccount => {
                    let isBankAccountVisible = !_.contains(this.bankAccountTypesForSelect, bankAccount.typeName);
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
                    let isBankAccountVisible = this.selectedBankAccountType === bankAccount.typeName;
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

    /**
     * Added empty rows to add space between rows (hack to avoid spacing between row and details)
     */
    addEmptyRows() {
        $('.emptyRow').remove();
        let visibleRows = this.mainDataGrid.instance.getVisibleRows();
        for (let i = 0; i < visibleRows.length; i++) {
            /** if next row is not detail row - add empty row */
            if (visibleRows[i + 1] && visibleRows[i + 1].rowType !== 'detail') {
                this.addEmptyRow(this.mainDataGrid.instance.getRowElement(i)[0]);
            }
        }
    }

    contentReady() {
        this.addEmptyRows();
    }

    dataRowClick(e) {
        this.masterRowExpandChange(e);
    }

    dataCellClick(cell) {
        /** If to click for checkbox */
        if (cell.column.dataField === 'selected') {
            cell.data.selected = !cell.data.selected;
            this.masterSelectionChanged(cell);
            cell.event.stopImmediatePropagation();
        }
    }

    detailCellClick(cell) {
        if (cell.column.dataField === 'accountName' && this.allowBankAccountsEditing && this.cfoService) {
            this.openEditPopup(cell);
            return false;
        }

        /** If to click for checkbox */
        if (cell.column.dataField === 'selected') {
            cell.data.selected = !cell.data.selected;
            this.bankAccountSelectionChanged(cell);
        }
    }

    openEditPopup(cell) {
        cell.component.editRow(cell.rowIndex);
    }

    editingStart(e) {
        this.editingStarted = true;
        if (this.allowBankAccountsEditing && this.cfoService && this.businessEntities.length === 1 && !this.accountsTypes) {
            this.instanceType = <any>this.cfoService.instanceType;
            this.instanceId = <any>this.cfoService.instanceId;
            let businessEntitiesObservable = this._businessEntityService.getBusinessEntities(this.instanceType, this.instanceId);
            /** @todo update when api will be ready */
            //let accountsTypesObservable = this._bankAccountsServiceProxy.getAccountsTypes(this.instanceType, this.instanceId);
            forkJoin(businessEntitiesObservable/*, accountsTypesObservable*/)
                .subscribe(result => {
                    this.businessEntities = this.businessEntities.concat(result[0]);
                    //this.accountsTypes = result[1];
                });
        }
    }

    detailContentReady() {
        if (this.dxFormInstance) {
            this.dxFormInstance.option('items').forEach(item => {
                if (!item.column.allowEditing) {
                    item.visible = true;
                }
            });
            this.dxFormInstance = null;
        }
        this.editingStarted = false;
    }

    /** Hack to avoid showing of the fields that shouldn't be shown in editing form */
    editorPrepared(e) {
        /** Changed visible options for all columns when first column is preparing */
        if (this.editingStarted && e.index === 0) {
            /** Get the form instance */
            let formController = e.editorElement.closest('[role="form"]');
            this.dxFormInstance = <any>Form.getInstance(formController);
            /** For each column set visible false if it's not allowing editing */
            this.dxFormInstance.option('items').forEach(item => {
                if (!item.column.allowEditing) {
                    item.visible = false;
                }
            });
            let scrollWidget = e.component.$element().find('.dx-scrollable').last().dxScrollable('instance');

            /** Set timeout to avoid "this._contentReadyAction is not a function" error */
            setTimeout(() => {
                this.dxFormInstance.option('items', this.dxFormInstance.option('items'));
                /** Refresh to avoid unnecessary scrolls */
                scrollWidget._refresh();
            }, 0);
        }
    }

    detailsRowUpdating(e) {
        let deferred = $.Deferred();
        e.cancel = deferred.promise();
        let bankAccount: UpdateBankAccountDto = UpdateBankAccountDto.fromJS({
            ...this.getMappedDataForUpdate(e.oldData),
            ...this.getMappedDataForUpdate(e.newData)
        });
        /** Send update request */
        this._bankAccountsServiceProxy
            .updateBankAccount(this.instanceType, this.instanceId, bankAccount)
            .subscribe(
                res => {
                    deferred.resolve(false);
                    /** If business entity id changed - emit that binding of accounts to entities change to parents components */
                    /** @todo add advanced check to avoid unnecessary reload */
                    if (e.newData.businessEntityId) {
                        this.accountsEntitiesBindingChanged.emit();
                    }
                },
                error => deferred.resolve(true)
            );
    }

    getMappedDataForUpdate(data) {
        /** Param names that not correspond to each other for get and update api methods */
        let mappings = { 'accountName': 'name' };
        for (let param in mappings) {
            if (data.hasOwnProperty(param)) {
                data[mappings[param]] = data[param];
            }
        }
        return data;
    }

    updateAccountInfo(id) {
        this.onUpdateAccount.emit({ id: id });
    }

    calculateHeight() {
        /** Get bottom position of previous element */
        let filtersBottomPosition = this.filterActions.nativeElement.getBoundingClientRect().bottom;
        return window.innerHeight - filtersBottomPosition - 20;
    }

    removeAccount(syncAccountId) {
        this._syncAccountServiceProxy
            .delete(this.instanceType, this.instanceId, syncAccountId)
            .subscribe(res => {
                this.syncAccountsDataSource = this.syncAccountsDataSource.filter(item => item.syncAccountId != syncAccountId);
                this.reloadDataSource.emit();
                this.onDataChange.emit();

            });
    }

    requestSyncForAccounts() {
        this._syncServiceProxy
            .requestSyncForAccounts(this.instanceType, this.instanceId, this.syncAccountIds)
            .subscribe(res => {
                this.reloadDataSource.emit();
                this.onDataChange.emit();
            });
    }

    renameBankAccount() {
        this._syncAccountServiceProxy
            .rename(this.instanceType, this.instanceId, this.bankAccountInfo)
            .subscribe(res => {
                this.refreshGrid();
                this.onDataChange.emit();
            });
    }

    changeBankAccountName() {
        this.popupVisible = true;
    }

    submitNewBankAccountName(bankName) {
        this.popupVisible = false;
        this.bankAccountInfo.newName = bankName;
        this.renameBankAccount();
    }

    openActionsMenu(cellObj) {
        this.syncRef = cellObj.text;
        this.syncAccountId = cellObj.data.syncAccountId;
        this.bankAccountInfo.id = this.syncAccountId;
        this.bankAccountInfo.newName = cellObj.data.name;
        this.syncAccountIds = [];
        this.syncAccountIds.push(this.syncAccountId);
        this.isContextMenuVisible = true;
        this.instanceType = <any>this.cfoService.instanceType;
        this.instanceId = <any>this.cfoService.instanceId;
    }

    actionsItemClick(e) {
        switch (e.itemData.text) {
            case this.l('Edit_Name'):
                this.changeBankAccountName();
                break;
            case this.l('Sync_Now'):
                this.requestSyncForAccounts();
                break;
            case this.l('Update_Info'):
                this.updateAccountInfo(this.syncRef);
                break;
            case this.l('Delete'):
                this.removeAccount(this.syncAccountId);
                break;
        }
    }

    getRatioColor(ratio: number) {
        if (ratio > 50) return '#df533b';
        else if (ratio > 30) return '#ed9d1a';
        else if (ratio > 15) return '#f7d930';
        else return '#34be75';
    }
}
