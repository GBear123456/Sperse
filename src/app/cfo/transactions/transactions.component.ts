/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import { Subject, forkJoin, of } from 'rxjs';
import { first, skip, switchMap, mapTo, takeUntil } from 'rxjs/operators';
import difference from 'lodash/difference';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { TransactionDetailInfoComponent } from '@app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import {
    TransactionsServiceProxy,
    InstanceType,
    ClassificationServiceProxy,
    UpdateTransactionsCategoryInput,
    AutoClassifyDto,
    ResetClassificationDto,
    BankAccountsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCBoxesComponent } from '@shared/filters/cboxes/filter-cboxes.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CategorizationComponent } from 'app/cfo/transactions/categorization/categorization.component';
import { ChooseResetRulesComponent } from './choose-reset-rules/choose-reset-rules.component';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from 'shared/filters/bank-account-filter/bank-account-filter.model';
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { CurrenciesStoreSelectors, CfoStore } from '@app/cfo/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';

@Component({
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.less'],
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ TransactionsServiceProxy, ClassificationServiceProxy, BankAccountsServiceProxy, LifecycleSubjectsService ]
})
export class TransactionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(CategorizationComponent) categorizationComponent: CategorizationComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    resetRules = new ResetClassificationDto();
    private autoClassifyData = new AutoClassifyDto();
    private transactionDetailDialogRef: MatDialogRef<TransactionDetailInfoComponent>;

    private transId$: Subject<number> = new Subject<number>();

    dataGridStateTimeout: any;
    filtersInitialData: any;
    noRefreshedAfterSync: boolean;
    items: any;
    transactionId: any;
    defaultCreditTooltipVisible = false;
    defaultDebitTooltipVisible = false;
    defaultTotalTooltipVisible = false;
    toggleTabContent = true;

    private readonly dataSourceURI = 'Transaction';
    private readonly totalDataSourceURI = 'TransactionTotal';
    private filters: FilterModel[];
    private rootComponent: any;
    private cashFlowCategoryFilter = [];
    private dateFilter: FilterModel = new FilterModel({
        component: FilterCalendarComponent,
        operator: { from: 'ge', to: 'le' },
        caption: 'Date',
        field: 'Date',
        items: { from: new FilterItemModel(), to: new FilterItemModel() },
        options: { method: 'getFilterByDate' },
        hidden: true
    });
    private bankAccountFilter: FilterModel;
    private businessEntityFilter: FilterModel;
    public transactionsFilterQuery: any[];

    public manageAllowed = false;
    public dragInProgress = false;
    private draggedTransactionRow;
    public selectedCashflowCategoryKey: any;

    public bankAccountCount;
    visibleAccountCount = 0;
    public bankAccounts: number[];
    public bankAccountsLookup = [];
    public creditTransactionCount = 0;
    public creditTransactionTotal = 0;
    public creditClassifiedTransactionCount = 0;

    public debitTransactionCount = 0;
    public debitTransactionTotal = 0;
    public debitClassifiedTransactionCount = 0;

    public transactionCount = 0;
    public transactionTotal = 0;

    public adjustmentTotal = 0;
    public adjustmentStartingBalanceTotal = 0;
    headlineConfig: any;
    categories: any;
    types: any;

    private _changeTimeout;
    private _categoriesShowedBefore = true;
    private _categoriesShowed = true;
    public set categoriesShowed(value: boolean) {
        this._categoriesShowedBefore = this._categoriesShowed;
        if (this._categoriesShowed = value) {
            this.filtersService.fixed = false;
            this.filtersService.disable();
        }
    }

    public get categoriesShowed(): boolean {
        return this._categoriesShowed;
    }
    private syncAccounts: any;

    private updateAfterActivation: boolean;

    constructor(injector: Injector,
        private _appService: AppService,
        private _TransactionsServiceProxy: TransactionsServiceProxy,
        private _classificationServiceProxy: ClassificationServiceProxy,
        public bankAccountsService: BankAccountsService,
        private _changeDetectionRef: ChangeDetectorRef,
        private _cacheService: CacheService,
        private _lifecycleService: LifecycleSubjectsService,
        private store$: Store<CfoStore.State>,
        public cfoPreferencesService: CfoPreferencesService,
        public filtersService: FiltersService,
        public dialog: MatDialog
    ) {
        super(injector);
        _appService.toolbarIsHidden = true;
        if (filtersService.fixed)
            this._categoriesShowed = false;

        this.searchColumns = ['Description', 'CashflowSubCategoryName', 'CashflowCategoryName', 'Descriptor'];
        this.searchValue = '';
        this.manageAllowed = this._cfoService.classifyTransactionsAllowed;
    }

    ngOnInit(): void {
        this.initHeadlineConfig();

        const selectedCurrencyId$ = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId));
        /** If component is not activated - wait until it will activate and then reload */
        selectedCurrencyId$.pipe(
            skip(1),
            switchMap((selectedCurrencyId) => this.componentIsActivated ? of(selectedCurrencyId) : this._lifecycleService.activate$.pipe(first(), mapTo(selectedCurrencyId)))
        ).subscribe((selectedCurrencyId) => {
            this.filtersService.change(this.setCurrenciesFilter(selectedCurrencyId));
        });

        this.cfoPreferencesService.dateRange$.pipe(
            takeUntil(this.destroy$),
            switchMap((dateRange) => this.componentIsActivated ? of(dateRange) : this._lifecycleService.activate$.pipe(first(), mapTo(dateRange)))
        ).subscribe((dateRange: CalendarValuesModel) => {
            this.filtersService.change(this.updateDateFilter(dateRange));
        });

        this.dataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    if (request.params.$filter && request.url.indexOf('$filter')) {
                        let parts = request.url.split('?');
                        request.url = parts.shift() + '?' + parts.pop().split('&').reduce((acc, item) => {
                            let arrgs = item.split('=');
                            if (arrgs[0] == '$filter') {
                                request.params.$filter = '(' + request.params.$filter + ') and (' + arrgs[1] + ')';
                                return acc;
                            } else
                                return acc + (acc ? '&' : '') + arrgs.join('=');
                        }, '');
                    }
                }
            }
        });

        this.totalDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl(this.totalDataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            onChanged: () => {
                this.dataGrid.instance.clearSelection();
                this.getTotalValues();
                this._changeDetectionRef.detectChanges();
            }
        });

        this.bankAccountsService.load();
        forkJoin(
            this._TransactionsServiceProxy.getTransactionTypesAndCategories(),
            this._TransactionsServiceProxy.getFiltersInitialData(InstanceType[this.instanceType], this.instanceId),
            this.bankAccountsService.syncAccounts$.pipe(first()),
            this.bankAccountsService.selectedBusinessEntitiesIds$.pipe(first())
        ).subscribe(([typeAndCategories, filtersInitialData, syncAccounts, selectedBusinessEntitiesIds]) => {
            this.syncAccounts = syncAccounts;
            this.types = typeAndCategories.types.map((item) => item.name);
            this.categories = typeAndCategories.categories.map((item) => item.name);
            this.bankAccountsLookup = syncAccounts.reduce((acc, item) => {
                return acc.concat(item.bankAccounts);
            }, []);
            this.filtersInitialData = filtersInitialData;
            this.filters = [
                this.dateFilter,
                this.bankAccountFilter = new FilterModel({
                    component: BankAccountFilterComponent,
                    caption: 'Account',
                    items: {
                        element: new BankAccountFilterModel(
                            {
                                dataSource: syncAccounts,
                                nameField: 'name',
                                keyExpr: 'id',
                                onRemoved: (ids) => this.bankAccountsService.changeSelectedBankAccountsIds(ids)
                            })
                    }
                }),
                this.businessEntityFilter = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    field: 'BusinessEntityId',
                    caption: 'BusinessEntity',
                    items: {
                        element: new FilterCheckBoxesModel({
                            dataSource: filtersInitialData.businessEntities,
                            nameField: 'name',
                            keyExpr: 'id',
                            value: selectedBusinessEntitiesIds
                        })
                    }
                })].concat(this._cfoService.hasStaticInstance ? [] : [
/*
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Description',
                    items: { Description: new FilterItemModel() }
                }),

                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'Amount',
                    field: 'Amount',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    field: 'CategoryId',
                    caption: 'TransactionCategory',
                    items: {
                        element: new FilterCheckBoxesModel({
                            dataSource: typeAndCategories.categories,
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                    }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    field: 'TypeId',
                    caption: 'TransactionType',
                    items: {
                        element: new FilterCheckBoxesModel({
                            dataSource: typeAndCategories.types,
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                    }
                }),
*/
                new FilterModel({
                    component: FilterCBoxesComponent,
                    caption: 'classified',
                    field: 'CashflowCategoryId',
                    items: { yes: new FilterItemModel(), no: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    field: 'CurrencyId',
                    caption: 'Currency',
                    hidden: true,
                    items: {
                        element: new FilterCheckBoxesModel({
                            dataSource: filtersInitialData.currencies,
                            nameField: 'name',
                            keyExpr: 'id',
                            value: [ this.cfoPreferencesService.selectedCurrencyId ]
                        })
                    }
                })
                /*,
                new FilterModel({
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'CheckNumber',
                    //items: { BusinessEntity: '' }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'Reference',
                    //items: { BusinessEntity: '' }
                }) */
            ]);
            this.filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams, false);
            this.initFiltering();
            this.bankAccountsService.syncAccounts$.subscribe((syncAccounts) => {
                this.syncAccounts = syncAccounts;
            });
            /** After selected accounts change */
            this.bankAccountsService.selectedBankAccountsIds$.pipe(first()).subscribe(() => {
                this.applyTotalBankAccountFilter(true);
            });
            this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
                /** filter all widgets by new data if change is on this component */
                if (this.componentIsActivated) {
                    this.applyTotalBankAccountFilter();
                } else {
                    /** if change is on another component - mark this for future update */
                    this.updateAfterActivation = true;
                    this._changeDetectionRef.detectChanges();
                }
            });
        });

        this.bankAccountsService.accountsAmountWithApply$.subscribe(amount => {
            this.bankAccountCount = amount;
            this.initToolbarConfig();
            this._changeDetectionRef.detectChanges();
        });
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Transactions')],
            // onRefresh: this._cfoService.hasStaticInstance ? undefined : this.refreshDataGrid.bind(this),
            toggleToolbar: this.toggleToolbar.bind(this),
            iconSrc: './assets/common/icons/credit-card-icon.svg',
            class: this.noRefreshedAfterSync ? 'need-refresh' : 'no-need-refresh'
        };
        this._changeDetectionRef.detectChanges();
    }

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this._appService.updateToolbar([
                {
                    location: 'before', items: [
                        {
                            name: 'filters',
                            action: () => {
                                this.filtersService.fixed =
                                    !this.filtersService.fixed;
                                if (this.filtersService.fixed)
                                    this.categoriesShowed = false;
                                else
                                    this.categoriesShowed =
                                        this._categoriesShowedBefore;
                                this.filtersService.enable();
                            },
                            options: {
                                checkPressed: () => {
                                    return this.filtersService.fixed;
                                },
                                mouseover: () => {
                                    this.filtersService.enable();
                                },
                                mouseout: () => {
                                    if (!this.filtersService.fixed)
                                        this.filtersService.disable();
                                }
                            },
                            attr: {
                                'filter-selected': this.filtersService.hasFilterSelected
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    items: [
                        {
                            name: 'search',
                            widget: 'dxTextBox',
                            options: {
                                value: this.searchValue,
                                width: '279',
                                mode: 'search',
                                placeholder: this.l('Search') + ' '
                                + this.l('Transactions').toLowerCase(),
                                onValueChanged: (e) => {
                                    this.searchValueChange(e);
                                }
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    items: [
                        {
                            name: 'searchAll',
                            action: this.searchAllClick.bind(this),
                            options: {
                                text: this.l('Search All')
                            },
                            attr: {
                                'filter-selected': (this.searchValue && this.searchValue.length > 0) && (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKey),
                                'custaccesskey': 'search-container'
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'bankAccountSelect',
                            widget: 'dxButton',
                            action: this.openBankAccountsSelectDialog.bind(this),
                            options: {
                                id: 'bankAccountSelect',
                                text: this.l('Accounts'),
                                icon: './assets/common/icons/accounts.svg'
                            },
                            attr: {
                                'custaccesskey': 'bankAccountSelect',
                                'accountCount': this.bankAccountCount
                            }
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'rowFilter',
                            action: this.enableFilteringRow.bind(this),
                            options: {
                                checkPressed: () => {
                                    return this.dataGrid && this.dataGrid.instance &&
                                        this.dataGrid.instance.option('filterRow.visible');
                                }
                            }
                        },
                        {
                            name: 'showCompactRowsHeight',
                            visible: !this._cfoService.hasStaticInstance,
                            action: this.showCompactRowsHeight.bind(this)
                        },
                        {
                            name: 'download',
                            widget: 'dxDropDownMenu',
                            options: {
                                hint: this.l('Download'),
                                items: [{
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                }, {
                                    action: this.exportToXLS.bind(this),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                }, {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                }, {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                }, {type: 'downloadOptions'}]
                            }
                        },
                        {
                            name: 'columnChooser',
                            visible: !this._cfoService.hasStaticInstance,
                            action: this.showColumnChooser.bind(this)
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'fullscreen',
                            visible: !this._cfoService.hasStaticInstance,
                            action: () => {
                                this.toggleFullscreen(document.documentElement);
                                setTimeout(() => this.dataGrid.instance.repaint(), 100);
                            }
                        }
                    ]
                }
            ]);
        }
    }

    enableFilteringRow(event) {
        let visible = !this.dataGrid.instance.option('filterRow.visible');
        this.dataGrid.instance.option('filterRow.visible', visible);
        event.element.setAttribute('button-pressed', visible);
    }

    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift(
            {
                location: 'after',
                template: 'startBalanceTotal'
            }, {
                location: 'after',
                template: 'creditTotal'
            }, {
                location: 'after',
                template: 'debitTotal'
            }, {
                location: 'after',
                template: 'transactionTotal'
            });
    }

    getTotalValues() {
        let totals = this.totalDataSource && this.totalDataSource.items();
        let selectedRows = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowsData() : [];

        if (selectedRows.length) {
            let creditTotal = this.creditTransactionTotal = 0;
            let creditCount = this.creditTransactionCount = 0;
            let creditClassifiedCount = this.creditClassifiedTransactionCount = 0;

            let debitTotal = this.debitTransactionTotal = 0;
            let debitCount = this.debitTransactionCount = 0;
            let debitClassifiedCount = this.debitClassifiedTransactionCount = 0;

            this.adjustmentStartingBalanceTotal = 0;
            this.adjustmentTotal = 0;

            let bankAccounts = [];

            _.each(selectedRows, function (row) {
                bankAccounts.push(row.BankAccountId);

                if (row.Amount >= 0) {
                    creditTotal += row.Amount;
                    creditCount++;
                    if (row.CashflowCategoryId)
                        creditClassifiedCount++;
                } else {
                    debitTotal += row.Amount;
                    debitCount++;
                    if (row.CashflowCategoryId)
                        debitClassifiedCount++;
                }
            });
            setTimeout(() => {
                this.bankAccounts = _.uniq(bankAccounts);
                this._changeDetectionRef.detectChanges();
            });

            this.creditTransactionTotal = creditTotal;
            this.creditTransactionCount = creditCount;
            this.creditClassifiedTransactionCount = creditClassifiedCount;

            this.debitTransactionTotal = debitTotal;
            this.debitTransactionCount = debitCount;
            this.debitClassifiedTransactionCount = debitClassifiedCount;

            this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal;
            this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
        } else if (totals && totals.length) {
                this.creditTransactionTotal = totals[0].creditTotal;
                this.creditTransactionCount = totals[0].creditCount;
                this.creditClassifiedTransactionCount = totals[0].classifiedCreditTransactionCount;

                this.debitTransactionTotal = totals[0].debitTotal;
                this.debitTransactionCount = totals[0].debitCount;
                this.debitClassifiedTransactionCount = totals[0].classifiedDebitTransactionCount;
                setTimeout(() => {
                    if (totals[0].bankAccounts) {
                        this.bankAccounts = totals[0].bankAccounts;
                    } else {
                        this.bankAccounts = [];
                    }
                    this._changeDetectionRef.detectChanges();
                });

                this.adjustmentStartingBalanceTotal = totals[0].adjustmentStartingBalanceTotal;
                this.adjustmentTotal = totals[0].adjustmentTotal;

                this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal + this.adjustmentTotal + this.adjustmentStartingBalanceTotal;
                this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
            } else {
                this.creditTransactionTotal = 0;
                this.creditTransactionCount = 0;

                this.debitTransactionTotal = 0;
                this.debitTransactionCount = 0;

                setTimeout(() => { this.bankAccounts = []; });

                this.transactionTotal = 0;
                this.transactionCount = 0;

                this.adjustmentStartingBalanceTotal = 0;
                this.adjustmentTotal = 0;
            }

        this._changeDetectionRef.detectChanges();
    }

    getFloatPart(value) {
        let x = Math.abs(value);
        let int_part = Math.trunc(x);
        let float_part = (x - int_part) * 100;
        return float_part;
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    showRefreshButton() {
        this.noRefreshedAfterSync = true;
        this.initHeadlineConfig();
    }

    refreshDataGrid() {
        this.noRefreshedAfterSync = false;
        this.initHeadlineConfig();
        this.bankAccountsService.load(true, false).subscribe(
            () => this.applyTotalBankAccountFilter()
        );
        this.categorizationComponent.refreshCategories(false, false);
        this.processFilterInternal();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
        this.initToolbarConfig();
    }

    searchAllClick() {
        this.cashFlowCategoryFilter = [];
        this.categorizationComponent.clearSelection(false);

        this.filtersService.clearAllFilters();
        this.selectedCashflowCategoryKey = null;
        this.initToolbarConfig();
    }

    toggleCreditDefault() {
        this.defaultCreditTooltipVisible = !this.defaultCreditTooltipVisible;
        this._changeDetectionRef.detectChanges();
    }

    toggleDebitDefault() {
        this.defaultDebitTooltipVisible = !this.defaultDebitTooltipVisible;
        this._changeDetectionRef.detectChanges();
    }

    toggleTotalDefault() {
        this.defaultTotalTooltipVisible = !this.defaultTotalTooltipVisible;
        this._changeDetectionRef.detectChanges();
    }

    applyTotalFilters(classified: boolean, credit: boolean, debit: boolean) {
        let classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
        let amountFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'Amount'; });

        if (classified) {
            classifiedFilter.items['yes'].setValue(true, classifiedFilter);
            classifiedFilter.items['no'].setValue(false, classifiedFilter);
        } else {
            classifiedFilter.items['yes'].setValue(false, classifiedFilter);
            classifiedFilter.items['no'].setValue(true, classifiedFilter);
        }

        if (credit) {
            amountFilter.items['from'].setValue('0', amountFilter);
            amountFilter.items['to'].setValue('', amountFilter);
            this.defaultCreditTooltipVisible = false;
        } else if (debit) {
            amountFilter.items['to'].setValue('0', amountFilter);
            amountFilter.items['from'].setValue('', amountFilter);
            this.defaultDebitTooltipVisible = false;
        } else {
            amountFilter.items['to'].setValue('', amountFilter);
            amountFilter.items['from'].setValue('', amountFilter);
            this.defaultTotalTooltipVisible = false;
        }

        this.filtersService.change(classifiedFilter);
    }

    clearClassifiedFilter() {
        let classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
        classifiedFilter.items['yes'].setValue(false, classifiedFilter);
        classifiedFilter.items['no'].setValue(false, classifiedFilter);
        this.filtersService.change(classifiedFilter);
    }

    initFiltering() {
        this.filtersService.apply(filter => {
            let filterName = filter.caption.toLowerCase();
            if (filterName == 'account') {
                /** apply filter on top */
                this.bankAccountsService.applyFilter();
                /** apply filter in sidebar */
                filter.items.element.value = this.bankAccountsService.state.selectedBankAccountIds;
            }

            if (filterName == 'classified') {
                if (this.selectedCashflowCategoryKey && filter.items['no'].value === true && filter.items['yes'].value !== true) {
                    this.cashFlowCategoryFilter = [];
                    this.categorizationComponent.clearSelection(false);
                    this.selectedCashflowCategoryKey = null;
                }
            }

            if (filterName == 'businessentity')
                this.checkUpdateAccountsState(filter.items.element.value);

            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    setDataSource() {
        if (this.dataGrid && !this.dataGrid.dataSource) {
            this.dataGrid.dataSource = this.dataSource;
            this._changeDetectionRef.markForCheck();
        }
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    // setBankAccountCount(bankAccountIds, visibleAccountCount) {
    //     this.bankAccountCount = this.bankAccountsService.getBankAccountCount(bankAccountIds, visibleAccountCount);
    // }

    applyTotalBankAccountFilter(emitFilterChange = false) {
        this.setDataSource();
        this.bankAccountsService.setBankAccountsFilter(
            this.filters, this.syncAccounts, emitFilterChange);
    }

    setCurrenciesFilter(currencyId: string) {
        let currenciesFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'currency'; });
        return this.changeAndGetCurrenciesFilter(currenciesFilter, currencyId);
    }

    updateDateFilter(dateRange: CalendarValuesModel) {
        this.dateFilter.items = {
            from: new FilterItemModel(dateRange.from.value),
            to: new FilterItemModel(dateRange.to.value)
        };
        return this.dateFilter;
    }

    changeAndGetCurrenciesFilter(currenciesFilter: FilterModel, countryId: string): FilterModel {
        currenciesFilter.items['element'].setValue([countryId], currenciesFilter);
        currenciesFilter.updateCaptions();
        return currenciesFilter;
    }

    processFilterInternal() {
        let filterQuery = this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.cashFlowCategoryFilter.concat(this.filters),
            (filter) => {
                if (filter.caption && filter.caption.toLowerCase() === 'account') {
                    /** apply filter on top */
                    this.bankAccountsService.applyFilter();
                    /** apply filter in sidebar */
                    filter.items.element.setValue(this.bankAccountsService.state.selectedBankAccountIds, filter);
                }
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );

        this.totalDataSource['_store']['_url'] = this.getODataUrl(this.totalDataSourceURI, filterQuery);
        this.totalDataSource.load();

        this.transactionsFilterQuery = _.reject(filterQuery, (x) => _.has(x, 'AccountingTypeId')
            || (_.has(x, 'CashflowCategoryId') && typeof x['CashflowCategoryId'] == 'number')
            || _.has(x, 'CashflowSubCategoryId'));
        this._changeDetectionRef.detectChanges();
    }

    getODataUrl(uri: string, filter?: Object) {
        let url = super.getODataUrl(uri, filter);
        url += (url.indexOf('?') == -1 ? '?' : '&') + 'currencyId=' + this.cfoPreferencesService.selectedCurrencyId;
        return url;
    }

    filterByClassified(filter: FilterModel) {
        let isYes = filter.items.yes.value;
        let isNo = filter.items.no.value;

        if (isYes ^ isNo) {
            let obj = {};
            obj[filter.field] = {};
            if (isYes) {
                obj[filter.field]['ne'] = null;
            } else {
                obj[filter.field] = null;
            }
            return obj;
        }
    }

    filterByAccount(filter) {
        let data = {};
        if (filter.items.element) {
            let bankAccountIds = [];
            filter.items.element.dataSource.forEach((syncAccount, i) => {
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    if (bankAccount['selected']) {
                        bankAccountIds.push(bankAccount.id);
                    }
                });
            });

            if (bankAccountIds.length) {
                //Should be like this, but IN is not currently implemented by odata-query lib >:-(. https://github.com/techniq/odata-query/issues/22
                //data = {
                //    BankAccountId: {
                //        in: bankAccountIds
                //    }
                //};

                data = `BankAccountId in (${bankAccountIds.join(',')})`;
            }
        }

        return data;
    }

    filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            item && item.value && (data[filter.field][filter.operator[key]] = +item.value);
        });
        return data;
    }

    filterByTransactionCategory(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByCurrency(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByTransactionType(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByBusinessEntity(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByFilterElement(filter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = _.map(filter.items.element.value, x => {
                let el = {};
                el[filter.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByCashflowCategory(data) {
        if (data && data.key) {
            let field = {};
            if (!parseInt(data.key))
                field['CashFlowTypeId'] = new FilterItemModel(data.key);
            else if (isNaN(data.key))
                field['AccountingTypeId'] = new FilterItemModel(parseInt(data.key));
            else if (isNaN(data.parent))
                field['CashflowCategoryId'] = new FilterItemModel(parseInt(data.key));
            else
                field['CashflowSubCategoryId'] = new FilterItemModel(parseInt(data.key));

            this.cashFlowCategoryFilter = [
                new FilterModel({
                    items: field
                })
            ];
            this.clearClassifiedFilter();
            this.processFilterInternal();
        } else if (this.selectedCashflowCategoryKey) {
            this.cashFlowCategoryFilter = [];
            this.processFilterInternal();
        }

        this.selectedCashflowCategoryKey = data && data.key;
        this.initToolbarConfig();
    }

    onSelectionChanged($event, initial = false) {
        this.getTotalValues();

        if (!this.manageAllowed)
            return ;

        let transactionKeys = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowKeys() : [];
        if (!initial && (Boolean(this.selectedCashflowCategoryKey) || Boolean(transactionKeys.length)))
            this.categoriesShowed = true;

        let img = new Image();
        img.src = './assets/common/icons/drag-icon.svg';

        let element = <any>$($event.element);
        let affectedRows = element.find('tr.dx-data-row').removeAttr('draggable').off('dragstart').off('dragend');
        if (transactionKeys.length)
            affectedRows = affectedRows.filter('.dx-selection');
        affectedRows.attr('draggable', true).on('dragstart', (e) => {
            if (!transactionKeys.length)
                this.draggedTransactionRow = this.dataGrid.instance.getKeyByRowIndex(e.currentTarget.rowIndex);
            this.dragInProgress = true;
            e.originalEvent.dataTransfer.setData('Text', transactionKeys.join(','));
            e.originalEvent.dataTransfer.setDragImage(img, -10, -10);
            e.originalEvent.dataTransfer.effectAllowed = 'all';
            e.originalEvent.dataTransfer.dropEffect = 'move';
            document.addEventListener('dxpointermove', this.stopPropagation, true);
            this._changeDetectionRef.detectChanges();
        }).on('dragend', (e) => {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();

            this.draggedTransactionRow = null;
            this.dragInProgress = false;
            document.removeEventListener('dxpointermove', this.stopPropagation);
            this._changeDetectionRef.detectChanges();
        }).on('click', (e) => {
            this.draggedTransactionRow = null;
            this.dragInProgress = false;
            this._changeDetectionRef.detectChanges();
        });
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    onCellClick($event) {
        if ($event.rowType === 'data') {
            if (this.manageAllowed &&
                (($event.column.dataField == 'CashflowCategoryName' && $event.data.CashflowCategoryId) ||
                ($event.column.dataField == 'CashflowSubCategoryName' && $event.data.CashflowSubCategoryId))) {
                this.dialog.open(RuleDialogComponent, {
                    panelClass: 'slider',
                    data: {
                        categoryId: $event.column.dataField == 'CashflowCategoryName' ? $event.data.CashflowCategoryId : $event.data.CashflowSubCategoryId,
                        categoryCashflowTypeId: $event.CashFlowTypeId,
                        transactions: [$event.data],
                        transactionIds: [$event.data.Id],
                        refershParent: this.refreshDataGrid.bind(this)
                    }
                }).afterClosed().subscribe();
            }
        }
        if ($event.rowType === 'data' && $event.column.dataField == 'Description') {
            this.transactionId = $event.data.Id;
            this.showTransactionDetailsInfo();
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            if ($event.column.dataField == 'CashflowCategoryName' && !$event.data.CashflowCategoryName) {
                let parentRow = <HTMLTableRowElement>$event.cellElement.parentElement;
                if (parentRow) {
                    let rowIndex = parentRow.rowIndex;
                    let rows = $event.cellElement.closest('.dx-datagrid-rowsview').querySelectorAll(`tr:nth-of-type(${rowIndex + 1})`);
                    /** add uncategorized class to both checkbox and row (hack) */
                    for (let i = 0; i < rows.length; i++) {
                        rows[i].classList.add(`uncategorized`);
                    }
                }
            } else if ($event.column.dataField == 'CashflowSubCategoryName' && $event.data.CashflowSubCategoryName) {
                $event.cellElement.classList.add('clickable-item');
            }
        }
    }

    storeGridState(instance) {
        clearTimeout(this.dataGridStateTimeout);
        this.dataGridStateTimeout = setTimeout(() => {
            instance = instance || this.dataGrid && this.dataGrid.instance;
            if (instance)
                this._cacheService.set(this.getCacheKey('dataGridState'), instance.state());
        }, 500);
    }

    applyGridState(instance) {
        instance = instance || this.dataGrid && this.dataGrid.instance;
        if (instance) {
            let state = this._cacheService.get(
                this.getCacheKey('dataGridState'));
            if (state) {
                instance.state(state);
                state.columns.forEach((column) =>
                    instance.columnOption(column.dataField, 'visible', column.visible)
                );
            }
        }
    }

    onInitialized(event) {
        this.applyGridState(event.component);
    }

    onContentReady(event) {
        this.storeGridState(event.component);
        this.onSelectionChanged(event, true);
    }

    categorizeTransactions($event) {
        let transactions: any[] = this.dataGrid
            .instance.getSelectedRowKeys();
        if (!transactions.length && this.draggedTransactionRow)
            transactions = [this.draggedTransactionRow];
        let transactionIds = transactions.map(t => t.Id);
        let isSingleDraggedTransaction = !!this.draggedTransactionRow;

        if ($event.categoryId) {
            let updateTransactionCategoryMethod = (suppressCashflowTypeMismatch: boolean = false) => {
                this._classificationServiceProxy.updateTransactionsCategory(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    new UpdateTransactionsCategoryInput({
                        transactionIds: transactionIds,
                        categoryId: $event.categoryId,
                        standardDescriptor: null,
                        descriptorAttributeTypeId: null,
                        suppressCashflowMismatch: suppressCashflowTypeMismatch
                    })
                ).subscribe(() => {
                    if (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKey) {
                        this.dataGrid.instance.deselectAll();
                        this.refreshDataGrid();
                    } else {
                        let gridItems = this.dataGrid.instance.getDataSource().items().filter((v) => _.some(transactionIds, x => x == v.Id));
                        let selectedRowIndexes: number[] = [];
                        let totalTransactionsSource = this.totalDataSource.items()[0];
                        let categoryTreeTransactionCountSource = this.categorizationComponent.transactionsCountDataSource.items()[0];
                        gridItems.forEach(
                            (i) => {
                                if (i.CashflowCategoryId) {
                                    let previousCategory = i.CashflowSubCategoryId || i.CashflowCategoryId;
                                    if (categoryTreeTransactionCountSource[previousCategory])
                                        categoryTreeTransactionCountSource[previousCategory]--;
                                }
                                if (categoryTreeTransactionCountSource[$event.categoryId])
                                    categoryTreeTransactionCountSource[$event.categoryId]++;
                                else
                                    categoryTreeTransactionCountSource[$event.categoryId] = 1;

                                if (!i.CashflowCategoryId) {
                                    if (i.Amount > 0)
                                        totalTransactionsSource.classifiedCreditTransactionCount++;
                                    else
                                        totalTransactionsSource.classifiedDebitTransactionCount++;
                                }

                                i.CashflowSubCategoryId = $event.parentId ? $event.categoryId : null;
                                i.CashflowSubCategoryName = $event.parentId ? $event.categoryName : null;
                                i.CashflowCategoryId = $event.parentId ? $event.parentId : $event.categoryId;
                                i.CashflowCategoryName = $event.parentId ? $event.parentName : $event.categoryName;
                                i.CashFlowTypeId = $event.categoryCashType;
                                i.CashFlowTypeName = $event.categoryCashType == 'I' ? 'Inflows' : 'Outflows';

                                selectedRowIndexes.push(this.dataGrid.instance.getRowIndexByKey(i));
                            }
                        );

                        if (!isSingleDraggedTransaction)
                            this.dataGrid.instance.selectRows(gridItems, false);
                        this.dataGrid.instance.repaintRows(selectedRowIndexes);

                        this.getTotalValues();
                        this.categorizationComponent.setTransactionsCount();
                    }

                    if ($event.showRuleDialog) {
                        this.dialog.open(RuleDialogComponent, {
                            panelClass: 'slider',
                            data: {
                                categoryId: $event.categoryId,
                                categoryCashflowTypeId: $event.categoryCashType,
                                transactions: transactions,
                                transactionIds: transactionIds,
                                refershParent: this.refreshDataGrid.bind(this)
                            }
                        }).afterClosed().subscribe(() => {});
                    }
                });
            };

            if (_.some(transactions, x => x.CashFlowTypeId != $event.categoryCashType)) {
                abp.message.confirm(this.l('RuleDialog_ChangeCashTypeMessage'), this.l('RuleDialog_ChangeCashTypeTitle'),
                    (result) => {
                        if (result) {
                            updateTransactionCategoryMethod(true);
                        }
                    });
            } else {
                updateTransactionCategoryMethod(false);
            }
        }
    }

    autoClassify(param): void {
        switch (param) {
            case 'credit':
                this.toggleCreditDefault();
                break;
            case 'debit':
                this.toggleDebitDefault();
                break;
            case 'total':
                this.toggleTotalDefault();
                break;
        }
        this.notify.info('Auto-classification has started');
        this._classificationServiceProxy.autoClassify(InstanceType[this.instanceType], this.instanceId, this.autoClassifyData)
            .subscribe((result) => {
                this.notify.info('Auto-classification has ended');
                return result;
            });
    }

    openDialog(param): void {
        switch (param) {
            case 'credit':
                this.toggleCreditDefault();
                break;
            case 'debit':
                this.toggleDebitDefault();
                break;
            case 'total':
                this.toggleTotalDefault();
                break;
        }
        let dialogRef = this.dialog.open(ChooseResetRulesComponent, {
            width: '450px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.resetRules = result;
                this.reset();
            }
        });
    }

    reset(): void {
        this.notify.info('Reset process has started');
        this._classificationServiceProxy.reset(InstanceType[this.instanceType], this.instanceId, this.resetRules)
            .subscribe((result) => {
                this.notify.info('Reset process has ended');
                return result;
            });
    }

    openBankAccountsSelectDialog() {
        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
            data: { }
        }).componentInstance.onApply.subscribe(() => {
            this.applyTotalBankAccountFilter(true);
        });
    }

    ngAfterViewInit(): void {
        this.showCompactRowsHeight();

        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    showTransactionDetailsInfo() {
        if (!this.transactionDetailDialogRef) {
            this.transactionDetailDialogRef = this.dialog.open(TransactionDetailInfoComponent, {
                panelClass: 'slider',
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {
                    refreshParent: this.invalidate.bind(this),
                    transactionId$: this.transId$
                }
            });

            this.transactionDetailDialogRef.afterOpen().subscribe(
                () => this.transId$.next(this.transactionId)
            );

            this.transactionDetailDialogRef.afterClosed().subscribe(
                () => {
                    this.transactionDetailDialogRef = undefined;
                }
            );
        } else {
            this.transId$.next(this.transactionId);
        }
    }

    onBusinessEntitiesChange(businessEntitiesIds) {
        this.checkUpdateAccountsState(businessEntitiesIds);

        clearTimeout(this._changeTimeout);
        this._changeTimeout = setTimeout(() => {
            this.applyTotalBankAccountFilter(true);
        }, 100);
    }

    checkUpdateAccountsState(businessEntitiesIds) {
        let selectedBankAccountIds = [];
        let newBusinessEntitiesIds = difference(businessEntitiesIds,
            this.bankAccountsService.state.selectedBusinessEntitiesIds);

        this.businessEntityFilter.items.element.value = businessEntitiesIds;
        this.syncAccounts.forEach(syncAccount => {
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (newBusinessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                    || this.bankAccountsService.state.selectedBusinessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                    && this.bankAccountsService.state.selectedBankAccountIds.indexOf(bankAccount.id) >= 0
                )
                    selectedBankAccountIds.push(bankAccount.id);
            });
        });

        this.bankAccountsService.changeState({
            selectedBusinessEntitiesIds: businessEntitiesIds,
            selectedBankAccountIds: selectedBankAccountIds
        });
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        super.ngOnDestroy();
    }

    activate() {
        super.activate();

        this.initFiltering();
        this.filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams, true);
        this.initToolbarConfig();
        this._lifecycleService.activate.next();

        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setCurrenciesFilter(this.cfoPreferencesService.selectedCurrencyId);
            this.applyTotalBankAccountFilter(true);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);
        this.dataGrid.instance.repaint();
    }

    deactivate() {
        super.deactivate();

        this.dialog.closeAll();
        this._appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.rootComponent.overflowHidden(false);
    }
}