/** Core imports */
import { Component, Injector, Input, Output, ViewChild, OnInit, EventEmitter, ElementRef } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import Form from 'devextreme/ui/form';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import {
    BankAccountsServiceProxy,
    BusinessEntityServiceProxy,
    SyncAccountServiceProxy,
    SyncServiceProxy,
    SyncAccountBankDto,
    UpdateBankAccountDto,
    RenameSyncAccountInput
} from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { ISortItem } from '@app/shared/common/sort-button/sort-item.interface';
import { IExpandItem } from '@app/shared/common/expand-button/expand-item.interface';

@Component({
    selector: 'bank-accounts-widget',
    templateUrl: './bank-accounts-widget.component.html',
    styleUrls: ['./bank-accounts-widget.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy, SyncAccountServiceProxy, SyncServiceProxy ]
})
export class BankAccountsWidgetComponent extends CFOComponentBase implements OnInit {
    private initBankAccountHighlightedTimeout: any;
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @ViewChild('header', { read: ElementRef }) header: ElementRef;
    @Input() showSyncDate = false;
    @Input() saveChangesInCache = true;
    @Input() showAdvancedColumns = true;
    @Input() highlightUsedRows = false;
    @Input() nameColumnWidth = 350;
    @Input() height;
    @Input() showColumnHeaders = false;
    @Input() allowUpdateAccount = false;
    @Input() showSyncAccountWithoutBankAccounts = true;
    @Input() showCreditInfo = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showStatusText = true;
    @Input() showAddAccountButton = true;
    @Input() searchInputWidth = 279;
    dataSource: any;
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

    allowEditing = false;
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
    syncAccount: SyncAccountBankDto;
    popupVisible = false;
    bankAccountInfo: RenameSyncAccountInput = new RenameSyncAccountInput();
    scrollHeight: number;
    sortItems: ISortItem[] = [
        {
            text: this.l('Sort by connection'),
            key: 'name',
            direction: 'asc'
        },
        {
            text: this.l('Sort by total balance'),
            key: 'balance'
        },
        {
            text: this.l('Sort by status'),
            key: 'syncAccountStatus'
        }
    ];
    mainGridFieldsSorting = [
        'name',
        'bankAccounts.length',
        'syncAccountStatus'
    ];
    expandItems: IExpandItem[] = [
        {
            text: this.l('Expand all'),
            key: 'expandAll'
        },
        {
            text: this.l('Collapse all'),
            key: 'collapseAll'
        }
    ];
    refresh$: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    syncAccounts$: Observable<SyncAccountBankDto[]> = this.bankAccountsService.distinctUntilChangedFilteredSyncAccounts$.pipe(
        map((syncAccounts) => {
            if (!this.showSyncAccountWithoutBankAccounts) {
                syncAccounts.filter(syncAccount => !syncAccount.bankAccounts.length);
            }
            return syncAccounts;
        })
    );

    constructor(
        injector: Injector,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _syncServiceProxy: SyncServiceProxy,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.cfoService = injector.get(CFOService, null);
        this.allowEditing = this.isInstanceAdmin || this.isMemberAccessManage;
    }

    ngOnInit(): void {

        this.syncAccounts$.subscribe((syncAccounts) => {
            this.dataSource = syncAccounts;
        });

        if (!this.isInstanceAdmin && !this.isMemberAccessManage) {
            this.contextMenuItems = [
                { text: this.l('Sync_Now') }
            ];
        }
    }

    refresh() {
        this.loadingService.startLoading(this.getElementRef().nativeElement);
        this.bankAccountsService.load(false)
            .pipe(finalize(() => this.loadingService.finishLoading(this.getElementRef().nativeElement)))
            .subscribe();
    }

    changeSorting(sorting: ISortItem) {
        const mainGrid = this.mainDataGrid.instance;
        mainGrid.clearSorting();
        mainGrid.getVisibleColumns().forEach(column => {
            const columnSortingIndex = this.mainGridFieldsSorting.indexOf(column.dataField);
            if (column.dataField === sorting.key) {
                mainGrid.columnOption(column.dataField, 'sortIndex', 0);
                mainGrid.columnOption(column.dataField, 'sortOrder', sorting.direction);
            } else if (columnSortingIndex  >= 0) {
                mainGrid.columnOption(column.dataField, 'sortIndex', columnSortingIndex + 1);
            } else {
                mainGrid.columnOption(column.dataField, 'sortIndex', undefined);
                mainGrid.columnOption(column.dataField, 'sortOrder', undefined);
            }
        });
    }

    expand(expandKey: string) {
        const visibleRows = this.mainDataGrid.instance.getVisibleRows();
        const method = expandKey === 'expandAll'
              ? this.mainDataGrid.instance.expandRow
              : this.mainDataGrid.instance.collapseRow;
        visibleRows.forEach((row) => {
            if (row.data.bankAccounts.length) {
                method(row.key);
            }
        });
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
        this.dataSource && this.dataSource.forEach(syncAccount => {
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

    masterRowExpandChange(e) {
        if (e.rowType === 'data') {
            if (e.isExpanded) {
                this.mainDataGrid.instance.collapseRow(e.key);
            } else {
                if (e.data.bankAccounts.length) {
                    this.mainDataGrid.instance.expandRow(e.key);
                }
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
        let selected: boolean;
        const rowId = this.mainDataGrid.instance.getRowIndexByKey(e.data.syncAccountId);
        const syncAccount = this.mainDataGrid.instance.getVisibleRows()[rowId].data;
        if (syncAccount.bankAccounts.length) {
            let selectedBankAccountCount = 0;
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (bankAccount['selected'])
                    selectedBankAccountCount++;
            });

            if (selectedBankAccountCount === 0) {
                selected = false;
            } else {
                selected = selectedBankAccountCount === syncAccount.bankAccounts.length ? true : null;
            }
        }
        syncAccount.selected = selected;
        this.selectedAccountsChanged();
    }

    selectedAccountsChanged() {
        let selectedSyncAccounts = this.mainDataGrid.instance.getVisibleRows().filter(row => row.rowType === 'data');
        const selectedBankAccountsIds = selectedSyncAccounts.reduce((allBankAccounts, row) => allBankAccounts.concat(row.data.bankAccounts.filter(account => account.selected).map(account => account.id)), []);
        this.bankAccountsService.changeSelectedBankAccountsIds(selectedBankAccountsIds, this.saveChangesInCache);
        this.selectionChanged.emit(selectedSyncAccounts);
    }

    bankAccountTypesChanged(e) {
        this.bankAccountsService.changeBankAccountTypes(e);
    }

    statusesChanged(e) {
        this.bankAccountsService.changeStatusesFilter(e, this.saveChangesInCache);
    }

    entitiesItemsChanged(selectedEntitiesIds: number[]) {
        this.bankAccountsService.changeState({
            selectedBusinessEntitiesIds: selectedEntitiesIds
        }, this.saveChangesInCache);
    }

    contentReady() {
        this.calculateHeight();
    }

    dataRowClick(e) {
        this.masterRowExpandChange(e);
    }

    dataCellClick(cell) {
        /** If to click for checkbox */
        if (cell.column && cell.column.dataField === 'selected') {
            cell.data.selected = !cell.data.selected;
            this.masterSelectionChanged(cell);
            cell.event.stopImmediatePropagation();
        }
    }

    selectAll(e) {
        if (e.event) {
            this.mainDataGrid.instance.getVisibleRows().forEach(row => {
                row.isSelected = e.value;
                row.data.bankAccounts.forEach(account => {
                    account.selected = e.value;
                });
            });
            this.selectedAccountsChanged();
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
                () => {
                    deferred.resolve(false);
                    /** If business entity id changed - emit that binding of accounts to entities change to parents components */
                    /** @todo add advanced check to avoid unnecessary reload */
                    if (e.newData.businessEntityId) {
                        this.accountsEntitiesBindingChanged.emit();
                    }
                    if (e.newData) {
                        this.reloadDataSource.emit();
                    }
                },
                () => deferred.resolve(true)
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

    updateAccountInfo(data: SyncAccountBankDto) {
        this.onUpdateAccount.emit(data);
    }

    calculateHeight() {
        /** Get bottom position of previous element */
        let filtersBottomPosition = this.header.nativeElement.getBoundingClientRect().bottom;
        this.scrollHeight = window.innerHeight - filtersBottomPosition;
    }

    removeAccount(syncAccountId) {
        this.dataSource = this.dataSource.filter(item => item.syncAccountId != syncAccountId);
        this._syncAccountServiceProxy
            .delete(this.instanceType, this.instanceId, syncAccountId)
            .subscribe(() => {
                this.onDataChange.emit();
            });
    }

    requestSyncForAccounts() {
        this._syncServiceProxy
            .requestSyncForAccounts(this.instanceType, this.instanceId, this.syncAccountIds)
            .subscribe(res => {
                if (res) {
                    this.reloadDataSource.emit();
                    this.onDataChange.emit();
                } else {
                    this.notify.info(this.l('SyncProblemMessage_TryLater'));
                }
            });
    }

    renameBankAccount() {
        this._syncAccountServiceProxy
            .rename(this.instanceType, this.instanceId, this.bankAccountInfo)
            .subscribe(() => {
                this.reloadDataSource.emit();
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
        this.syncAccount = cellObj.data;
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
                this.updateAccountInfo(this.syncAccount);
                break;
            case this.l('Delete'):
                this.removeAccount(this.syncAccountId);
                break;
        }
    }

    calculateSyncAccountSortValue(itemData) {
        return itemData.bankAccounts.length ? 1 : 0;
    }

    calculateSyncAccountDisplayValue(itemData): string {
        let displayValue = '0';
        if (itemData.bankAccounts.length) {
            const selectedBankAccountsAmount: number = itemData.bankAccounts.reduce((sum, bankAccount) => sum += bankAccount.selected ? 1 : 0, 0);
            displayValue = selectedBankAccountsAmount + ' of ' + itemData.bankAccounts.length;
        }
        return displayValue;
    }

    getRatioColor(ratio: number) {
        if (ratio > 50) return '#df533b';
        else if (ratio > 30) return '#ed9d1a';
        else if (ratio > 15) return '#f7d930';
        else return '#34be75';
    }

    searchChanged(searchValue: string) {
        this.bankAccountsService.changeSearchString(searchValue);
    }
}
