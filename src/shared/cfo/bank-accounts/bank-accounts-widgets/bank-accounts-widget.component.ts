/** Core imports */
import {
    Component,
    Injector,
    Input,
    Output,
    ViewChild,
    OnInit,
    OnChanges,
    OnDestroy,
    EventEmitter,
    ElementRef,
    SimpleChanges,
    HostBinding
} from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import Form from 'devextreme/ui/form';
import { BehaviorSubject, Observable, combineLatest, forkJoin } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import {
    BankAccountsServiceProxy,
    BusinessEntityServiceProxy,
    SyncAccountServiceProxy,
    SyncServiceProxy,
    SyncAccountBankDto,
    UpdateBankAccountDto,
    RenameSyncAccountInput,
    BankAccountDto,
    SyncProgressOutput,
    InstanceType
} from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { ISortItem } from '@app/shared/common/sort-button/sort-item.interface';
import { IExpandItem } from '@app/shared/common/expand-button/expand-item.interface';
import { AppConsts } from '@shared/AppConsts';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

@Component({
    selector: 'bank-accounts-widget',
    templateUrl: './bank-accounts-widget.component.html',
    styleUrls: ['./bank-accounts-widget.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy, SyncAccountServiceProxy, SyncServiceProxy ]
})
export class BankAccountsWidgetComponent extends CFOComponentBase implements OnInit, OnChanges, OnDestroy {
    @ViewChild(DxDataGridComponent) mainDataGrid: DxDataGridComponent;
    @ViewChild('actionRequiredTooltip') actionRequiredTooltip: DxTooltipComponent;
    @ViewChild('header', { read: ElementRef }) header: ElementRef;
    @Input() showSyncDate = false;
    @Input() saveChangesInCache = true;
    @Input() showAdvancedColumns = true;
    @Input() highlightUsedRows = false;
    @Input() nameColumnWidth = 350;
    @Input() balanceColumnWidth;
    @Input() height;
    @Input() showColumnHeaders = false;
    @Input() allowUpdateAccount = false;
    @Input() showSyncAccountWithoutBankAccounts = true;
    @Input() showCreditInfo = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showStatus = true;
    @Input() showStatusText = AppConsts.isMobile ? false : true;
    @Input() showAddAccountButton = true;
    @Input() searchInputWidth = 279;
    dataSource: any;
    @Input() allowBankAccountsEditing = false;
    @Input() showHeader = true;
    @Input() showCheckboxes = true;
    @Input() changeOnlyAfterApply = false;
    @Input() showOnlySelected = false;
    @Input() showAccountNumber = true;
    @Input() showAccountType = true;
    @Input() showAccountsCount = true;
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() accountsEntitiesBindingChanged: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateAccount: EventEmitter<any> = new EventEmitter();
    @Output() reloadDataSource: EventEmitter<any> = new EventEmitter();
    @Output() onDataChange: EventEmitter<any> = new EventEmitter();
    @HostBinding('class.wide') @Input() wide = false;
    allowEditing = false;
    editingStarted = false;
    accessAllDepartments = true;
    /** Editing form instance */
    dxFormInstance: Form;
    instanceType;
    instanceId;
    syncData: SyncProgressOutput;
    hoveredItemStatus: any[];
    actionsRequiredTooltipTarget;
    actionsRequiredTooltipVisible = false;
    actionsRequiredTooltipText: string;

    /** Default empty business entity */
    businessEntities = [{ id: null, name: '' }];
    accountsTypes;
    private cfoService: CFOService;
    isContextMenuVisible = false;
    contextMenuItems = [
        { text: this.l('Edit_Name'), name: 'edit' },
        { text: this.l('Sync_Now'), name: 'sync' },
        { text: this.l('Resync_All'), name: 'resync' },
        { text: this.l('Reconnect'), name: 'update' },
        { text: this.l('Delete'), name: 'delete' }
    ];
    syncAccountId: number;
    syncAccountIds = [];
    syncRef = '';
    syncAccount: SyncAccountBankDto;
    popupVisible = false;
    bankAccountInfo: RenameSyncAccountInput = new RenameSyncAccountInput();
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
    syncAccounts$: Observable<SyncAccountBankDto[]> = this.getSyncAccounts(this.changeOnlyAfterApply);
    clearButtonIsVisible$: Observable<boolean> = combineLatest(
        this.bankAccountsService.selectedBusinessEntitiesIds$,
        this.bankAccountsService.selectedBankAccountTypes$,
        this.bankAccountsService.selectedStatuses$
    ).pipe(map(([selectedBusinessEntities, selectedBankAccountTypes, selectedStatuses]) => {
        return !!(selectedBusinessEntities.length || (selectedBankAccountTypes && selectedBankAccountTypes.length) || selectedStatuses.length);
    }));

    constructor(
        injector: Injector,
        private bankAccountsServiceProxy: BankAccountsServiceProxy,
        private businessEntityService: BusinessEntityServiceProxy,
        private syncAccountServiceProxy: SyncAccountServiceProxy,
        private syncServiceProxy: SyncServiceProxy,
        public bankAccountsService: BankAccountsService,
        public cfoPreferencesService: CfoPreferencesService
    ) {
        super(injector);
        this.cfoService = injector.get(CFOService, null);
        this.accessAllDepartments = !this.cfoService || this.cfoService.accessAllDepartments;
        this.allowEditing = this.isInstanceAdmin || this.isMemberAccessManage;
    }

    ngOnInit(): void {
        this.syncAccounts$
            .pipe(takeUntil(this.destroy$))
            .subscribe((syncAccounts: SyncAccountBankDto[]) => {
                this.dataSource = syncAccounts;
                if (this.dataSource && !this.dataSource.length) {
                    this.cfoService.instanceChangeProcess(true).subscribe();
                }
            });

        if (!this.isInstanceAdmin && !this.isMemberAccessManage) {
            this.contextMenuItems = [];
        }
        this.syncServiceProxy.getSyncProgress(
            InstanceType[this.cfoService.instanceType],
            this.cfoService.instanceId
        ).subscribe(syncData => {
            this.syncData = syncData;
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.changeOnlyAfterApply && changes.changeOnlyAfterApply.firstChange) {
            this.syncAccounts$ = this.getSyncAccounts(changes['changeOnlyAfterApply'].currentValue);
        }
    }

    showInfo(cellObj) {
        this.syncAccount = cellObj.data;
        this.updateAccountInfo(this.syncAccount);
    }

    mouseEnter(cellObj) {
        this.hoveredItemStatus = this.syncData.accountProgresses.filter(item => {
            return cellObj.data.syncAccountId === item.accountId;
        });

        this.actionsRequiredTooltipVisible = true;
        this.actionsRequiredTooltipTarget = '#account' + this.hoveredItemStatus[0].accountId;
        this.actionsRequiredTooltipText = this.hoveredItemStatus[0].syncStatusMessage;
        setTimeout(() => this.actionRequiredTooltip.instance.repaint());
    }

    refresh() {
        this.isDataLoaded = false;
        this.bankAccountsService.load(false)
            .subscribe(() => {
                this.isDataLoaded = true;
            });
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
        /** getVisibleRows() is mutable array and can change in each iteration */
        const visibleRows = this.mainDataGrid.instance.getVisibleRows().map(row => ({
            key: row.key,
            rowType: row.rowType,
            bankAccountCount: row.data.bankAccounts.length
        }));
        const method = expandKey === 'expandAll'
              ? this.mainDataGrid.instance.expandRow
              : this.mainDataGrid.instance.collapseRow;
        visibleRows.forEach((row) => {
            if (row.rowType === 'data' && row.bankAccountCount) {
                method(row.key);
            }
        });
    }

    private getSyncAccounts(changeOnlyAfterApply: boolean): Observable<SyncAccountBankDto[]> {
        return (changeOnlyAfterApply
                ? this.bankAccountsService.filteredSyncAccountsWithApply$
                : this.bankAccountsService.distinctUntilChangedFilteredSyncAccounts$
        ).pipe(
            map((syncAccounts: SyncAccountBankDto[]) => {
                if (!this.showSyncAccountWithoutBankAccounts) {
                    syncAccounts = syncAccounts.filter(syncAccount => syncAccount.bankAccounts && syncAccount.bankAccounts.length);
                }
                if (this.showOnlySelected) {
                    syncAccounts = syncAccounts.filter((syncAccount: SyncAccountBankDto) => {
                        const selectedBankAccounts = syncAccount.bankAccounts.filter(bankAccount => {
                            return bankAccount['selected'];
                        });
                        if (selectedBankAccounts) {
                            syncAccount.bankAccounts = selectedBankAccounts;
                        }
                        return selectedBankAccounts.length;
                    });
                }
                return syncAccounts;
            }),
            distinctUntilChanged((oldAccounts: SyncAccountBankDto[], newAccounts: SyncAccountBankDto[]) => {
                return !ArrayHelper.dataChanged(
                    oldAccounts.map(this.pluckSelectedProperty),
                    newAccounts.map(this.pluckSelectedProperty)
                );
            })
        );
    }

    pluckSelectedProperty(account: SyncAccountBankDto) {
        return {
            ...account,
            selected: null
        };
    }

    rowPrepared(e) {
        if (e.rowType === 'data') {
            if (this.highlightUsedRows && e.data.bankAccounts
                && e.data.bankAccounts.some(item => item.isUsed)
            ) {
                e.rowElement.classList.add('highlighted-row');
            } else if (e.data['isUsed']) {
                e.rowElement.classList.add('used-row');
            }
        }
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
        this.bankAccountsService.changeBankAccountTypes(e, this.saveChangesInCache);
    }

    statusesChanged(e) {
        this.bankAccountsService.changeStatusesFilter(e, this.saveChangesInCache);
    }

    entitiesItemsChanged(selectedEntitiesIds: number[]) {
        this.bankAccountsService.changeSelectedBusinessEntities(
            selectedEntitiesIds, this.saveChangesInCache);
    }

    contentReady() {
        this.calculateHeight();
        this.isDataLoaded = true;
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
                row.data.selected = e.value;
                row.data.bankAccounts.forEach(account => {
                    account.selected = e.value;
                });
            });
            this.selectedAccountsChanged();
        }
    }

    detailCellClick(cell) {
        if (this.cfoService
            && this.isInstanceAdmin
            && cell.rowType === 'data'
            && cell.column.dataField === 'accountName'
            && this.allowBankAccountsEditing
        ) {
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
            const businessEntities$ = this.businessEntityService.getBusinessEntities(this.instanceType, this.instanceId);
            /** @todo update when api will be ready */
            //let accountsTypesObservable = this._bankAccountsServiceProxy.getAccountsTypes(this.instanceType, this.instanceId);
            forkJoin(businessEntities$/*, accountsTypesObservable*/)
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
        this.mainDataGrid.instance.updateDimensions();
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
        this.bankAccountsServiceProxy
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
        return this.height
               ? this.height
               : window.innerHeight - this.header.nativeElement.getBoundingClientRect().bottom;
    }

    removeAccount(syncAccountId) {
        this.dataSource = this.dataSource.filter(item => item.syncAccountId != syncAccountId);
        this.syncAccountServiceProxy
            .delete(this.instanceType, this.instanceId, syncAccountId)
            .subscribe(() => {
                this.notify.info(this.l('SuccessfullyDeleted'));
                this.bankAccountsService.load(false).subscribe();
            });
    }

    requestSyncForAccounts(fullResync = false) {
        this.syncServiceProxy
            .requestSyncForAccounts(this.instanceType, this.instanceId, fullResync, this.syncAccountIds)
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
        this.syncAccountServiceProxy
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
        this.contextMenuItems[this.contextMenuItems.findIndex(e => e.name === 'resync')]['hide'] = cellObj.data.syncTypeId === 'Q';
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
            case this.l('Resync_All'):
                this.requestSyncForAccounts(true);
                break;
            case this.l('Reconnect'):
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

    clearFilters() {
        this.bankAccountsService.changeState(
            {
                selectedBankAccountTypes: [],
                selectedBusinessEntitiesIds: [],
                statuses: []
            },
            this.saveChangesInCache
        );
    }

    calculateBalanceDisplayValue = (e) => {
        if (!this.accessAllDepartments)
            return '';

        let syncAccountBalance = 0;
        e.bankAccounts.forEach((bankAccount: BankAccountDto) => {
            if (bankAccount['selected']) {
                syncAccountBalance += bankAccount.balance;
            }
        });
        return syncAccountBalance;
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
