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
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import { BehaviorSubject, Observable, ReplaySubject, Subject, forkJoin, of } from 'rxjs';
import { first, skip, switchMap, mapTo, map, takeUntil, pluck, publishReplay, refCount } from 'rxjs/operators';
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
    BankAccountsServiceProxy,
    TransactionTypesAndCategoriesDto,
    TransactionTypeDto,
    StringFilterElementDto,
    FiltersInitialData
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
import { CurrenciesStoreSelectors, CurrenciesStoreActions, RootStore } from '@root/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { Category } from '@app/cfo/transactions/categorization/category.model';
import { BankAccountsState } from '@shared/cfo/bank-accounts-widgets/bank-accounts-state.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { AppFeatures } from '@shared/AppFeatures';

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
    private transactionId$: Subject<number> = new Subject<number>();

    dataGridStateTimeout: any;
    filtersInitialData: FiltersInitialData;
    filtersInitialData$: Observable<FiltersInitialData> = this.transactionsServiceProxy.getFiltersInitialData(InstanceType[this.instanceType], this.instanceId).pipe(
        publishReplay(),
        refCount()
    );
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
        items$: this.cfoPreferencesService.dateRange$.pipe(
                map((dateRange: CalendarValuesModel) => ({
                    from: new FilterItemModel(dateRange.from.value),
                    to: new FilterItemModel(dateRange.to.value)
                }))
        ),
        options: { method: 'getFilterByDate' }
    });
    private bankAccountFilter: FilterModel;
    private businessEntityFilter: FilterModel;
    public transactionsFilterQuery: any[];

    public manageAllowed = this._cfoService.classifyTransactionsAllowed(false);
    public dragInProgress = false;
    private draggedTransactionRow;
    public selectedCashflowCategoryKeys: number[];

    public bankAccountCount;
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
    transactionTypesAndCategories$: Observable<TransactionTypesAndCategoriesDto> = this.transactionsServiceProxy.getTransactionTypesAndCategories().pipe(
        publishReplay(),
        refCount()
    );
    categories$: Observable<StringFilterElementDto[]> = this.transactionTypesAndCategories$.pipe(
        map((transactionTypesAndCategories: TransactionTypesAndCategoriesDto) => transactionTypesAndCategories.categories)
    );
    categories: string[];
    types$: Observable<TransactionTypeDto[]> = this.transactionTypesAndCategories$.pipe(
        map((transactionTypesAndCategories: TransactionTypesAndCategoriesDto) => transactionTypesAndCategories.types)
    );
    excludedTypesKeys$: Observable<string[]> = this.route.queryParamMap.pipe(
        map((params: ParamMap) => {
            const excludedKeys = params.get('excludedTypeIds');
            return excludedKeys ? excludedKeys.split(',') : [];
        })
    );
    types: string[];
    typesFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'TypeId',
        caption: 'TransactionType',
        hidden: true,
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.types$,
                selectedKeys$: this.excludedTypesKeys$,
                nameField: 'name',
                keyExpr: 'id'
            })
        }
    });
    classifiedFilter: FilterModel = new FilterModel({
        component: FilterCBoxesComponent,
        caption: 'classified',
        field: 'CashflowCategoryId',
        items$: this.route.queryParamMap.pipe(
            map((params: ParamMap) => {
                const classified = params.get('classified');
                return {
                    yes: new FilterItemModel(classified === 'yes'),
                    no: new FilterItemModel(classified === 'no')
                };
            })
        )
    });
    currencyFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'CurrencyId',
        caption: 'Currency',
        hidden: true,
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.filtersInitialData$.pipe(pluck('currencies')),
                nameField: 'name',
                keyExpr: 'id',
                value: [ this.cfoPreferencesService.selectedCurrencyId ]
            })
        },
        options: { method: 'filterByFilterElement' }
    });
    private selectedCategoriesIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
    selectedCategoriesIds$: Observable<number[]> = this.selectedCategoriesIds.asObservable();
    private selectedCashflowTypeIds: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
    private selectedCashflowTypeIds$: Observable<string[]> = this.selectedCashflowTypeIds.asObservable();
    selectedDepartments: ReplaySubject<string[]> = new ReplaySubject<string[]>(1);
    selectedDepartments$: Observable<string[]> = this.selectedDepartments.asObservable();
    categoriesFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'CategoryId',
        caption: 'Category',
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.categories$,
                nameField: 'name',
                keyExpr: 'id'
            })
        },
        options: { method: 'filterByFilterElement' }
    });
    cashflowCategoriesFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'CashflowCategoryId',
        caption: 'TransactionCategory',
        hidden: true,
        items: {
            element: new FilterCheckBoxesModel({
                selectedKeys$: this.selectedCategoriesIds$,
                nameField: 'name',
                keyExpr: 'id'
            })
        },
        options: { method: 'filterByFilterElement' }
    });
    departmentsFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'Department',
        caption: 'Department',
        hidden: true,
        items: {
            element: new FilterCheckBoxesModel({
                selectedKeys$: this.selectedDepartments$
            })
        }
    });
    cashflowTypesFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        field: 'CashflowTypeId',
        caption: 'CashflowTypeId',
        hidden: true,
        items: {
            element: new FilterCheckBoxesModel({
                selectedKeys$: this.selectedCashflowTypeIds$
            })
        }
    });

    private _categoriesShowedBefore = !AppConsts.isMobile;
    private _categoriesShowed = this._categoriesShowedBefore;
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
    categoriesRowsData: Category[] = [];
    private showDataGridToolbar = !AppConsts.isMobile;
    departmentFeatureEnabled: boolean = this.feature.isEnabled(AppFeatures.CFODepartmentsManagement);

    constructor(injector: Injector,
        private appService: AppService,
        private transactionsServiceProxy: TransactionsServiceProxy,
        private classificationServiceProxy: ClassificationServiceProxy,
        private changeDetectionRef: ChangeDetectorRef,
        private cacheService: CacheService,
        private lifecycleService: LifecycleSubjectsService,
        private store$: Store<RootStore.State>,
        private route: ActivatedRoute,
        public cfoPreferencesService: CfoPreferencesService,
        public filtersService: FiltersService,
        public dialog: MatDialog,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
        if (filtersService.fixed)
            this._categoriesShowed = false;

        this.searchColumns = ['Description', 'CashflowSubCategoryName', 'CashflowCategoryName', 'Descriptor'];
        this.searchValue = '';
    }

    ngOnInit(): void {
        this.initHeadlineConfig();

        const selectedCurrencyId$ = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId));
        /** If component is not activated - wait until it will activate and then reload */
        selectedCurrencyId$.pipe(
            skip(1),
            switchMap((selectedCurrencyId) => this.componentIsActivated ? of(selectedCurrencyId) : this.lifecycleService.activate$.pipe(first(), mapTo(selectedCurrencyId)))
        ).subscribe((selectedCurrencyId) => {
            this.filtersService.change(this.setCurrenciesFilter(selectedCurrencyId));
        });

        this.cfoPreferencesService.dateRange$.pipe(
            takeUntil(this.destroy$),
            switchMap((dateRange) => this.componentIsActivated
                ? of(dateRange)
                : this.lifecycleService.activate$.pipe(first(), mapTo(dateRange))
            )
        ).subscribe(() => {
            this.filtersService.change(this.dateFilter);
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
                            let args = item.split('=');
                            if (args[0] == '$filter') {
                                request.params.$filter = '(' + request.params.$filter + ') and (' + args[1] + ')';
                                return acc;
                            } else
                                return acc + (acc ? '&' : '') + args.join('=');
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
                this.processTotalValues();
                this.changeDetectionRef.detectChanges();
            }
        });

        /** If we get some filters in url - set them as selected */
        this.route.queryParamMap.pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe((params: ParamMap) => {
            this.handleParams(params);
        });

        this.bankAccountsService.load();
        forkJoin(
            this.transactionTypesAndCategories$,
            this.filtersInitialData$,
            this.bankAccountsService.syncAccounts$.pipe(first())
        ).subscribe(([typeAndCategories, filtersInitialData, syncAccounts]) => {
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
                                dataSource$: this.bankAccountsService.syncAccounts$.pipe(takeUntil(this.destroy$)),
                                selectedKeys$: this.bankAccountsService.selectedBankAccountsIds$.pipe(takeUntil(this.destroy$)),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
                }),
                this.cashflowCategoriesFilter,
                this.businessEntityFilter = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    field: 'BusinessEntityId',
                    caption: 'BusinessEntity',
                    items: {
                        element: new FilterCheckBoxesModel({
                            dataSource$: this.bankAccountsService.sortedBusinessEntities$.pipe(takeUntil(this.destroy$)),
                            selectedKeys$: this.bankAccountsService.selectedBusinessEntitiesIds$.pipe(takeUntil(this.destroy$)),
                            nameField: 'name',
                            parentExpr: 'parent',
                            keyExpr: 'id',
                        })
                    },
                    options: { method: 'filterByFilterElement' }
                })].concat(this._cfoService.hasStaticInstance ? [] : [
/*
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Description',
                    items: { Description: new FilterItemModel() }
                }),
*/
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'Amount',
                    field: 'Amount',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                }),
                this.categoriesFilter,
                this.typesFilter,
                this.classifiedFilter,
                this.currencyFilter,
                this.departmentsFilter,
                this.cashflowTypesFilter,
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
                    this.changeDetectionRef.detectChanges();
                }
            });
        });

        this.bankAccountsService.accountsAmountWithApply$.subscribe(amount => {
            this.bankAccountCount = amount;
            this.initToolbarConfig();
            this.changeDetectionRef.detectChanges();
        });
    }

    ngAfterViewInit(): void {
        DataGridService.showCompactRowsHeight(this.dataGrid);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Transactions')],
            // onRefresh: this._cfoService.hasStaticInstance ? undefined : this.refreshDataGrid.bind(this),
            toggleToolbar: this.toggleToolbar.bind(this),
            iconSrc: 'assets/common/icons/credit-card-icon.svg',
            class: this.noRefreshedAfterSync ? 'need-refresh' : 'no-need-refresh',
            buttons: [
                {
                    enabled: true,
                    action: () => this.categoriesShowed = !this.categoriesShowed,
                    label: '',
                    class: 'toggle dx-button'
                }
            ]
        };
        this.changeDetectionRef.detectChanges();
    }

    private getIdsFromString(ids: string): number[] {
        return ids.split(',').map((id: string) => +id);
    }

    /**
     * Collect params from url and apply the properties, and then return whether filter has applied
     * @param {ParamMap} params
     * @return {boolean}
     */
    private handleParams(params: ParamMap): boolean {
        const currencyId: string = params.get('currencyId');
        if (currencyId) {
            /** Update selected currency id with the currency id from cashflow preferences */
            this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(currencyId));
        }
        const startDate = params.get('startDate');
        const endDate = params.get('endDate');
        if (startDate || endDate) {
            this.cfoPreferencesService.dateRange.next({
                from: { value: startDate ? new Date(startDate) : undefined },
                to: { value: endDate ? new Date(endDate) : undefined }
            });
        }

        const categoryIdsString: string = params.get('categoryIds');
        if (categoryIdsString) {
            const categoryIds: number[] = this.getIdsFromString(categoryIdsString);
            this.categoriesRowsData = <any>categoryIds.map(id => ({ key: id }));
            this.selectedCategoriesIds.next(categoryIds);
        }
        const transactionIdToOpen: string = params.get('transactionId');
        if (transactionIdToOpen) {
            this.transactionId = transactionIdToOpen;
            this.showTransactionDetailsInfo();
        }
        const departments: string = params.get('selectedDepartments');
        if (departments) {
            const departmentsList: string[] = departments.split(',').map((department: string) => {
                return department === 'n/a' ? null : department;
            });
            this.selectedDepartments.next(departmentsList);
        }
        const cashflowTypeIds: string = params.get('cashflowTypeIds');
        if (cashflowTypeIds) {
            const cashflowTypeIdsList: string[] = cashflowTypeIds.split(',');
            this.selectedCashflowTypeIds.next(cashflowTypeIdsList);
        }
        const businessEntitiesIds: string = params.get('selectedBusinessEntitiesIds');
        const bankAccountsIds: string = params.get('selectedBankAccountIds');
        const externalFilter = !!(businessEntitiesIds || bankAccountsIds ||
            currencyId || startDate || endDate || categoryIdsString ||
            departments || transactionIdToOpen || cashflowTypeIds);
        if (externalFilter) {
            const state: BankAccountsState = {
                selectedBankAccountTypes: [],
                statuses: [],
                selectedBusinessEntitiesIds: businessEntitiesIds ? this.getIdsFromString(businessEntitiesIds) : [],
                selectedBankAccountIds: bankAccountsIds ? this.getIdsFromString(bankAccountsIds) : [],
                usedBankAccountIds: [],
                visibleBankAccountIds: []
            };
            this.bankAccountsService.changeState(state, true);
        }
        return externalFilter;
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        this.filtersService.fixed = false;
        this.filtersService.disable();
        /** Toggle balances widgets if it's mobile */
        if (AppConsts.isMobile) {
            this.showDataGridToolbar = !this.showDataGridToolbar;
        }
        setTimeout(() => this.dataGrid.instance.repaint());
        this.initToolbarConfig();
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.appService.updateToolbar([
                {
                    location: 'before', items: [
                        {
                            name: 'filters',
                            visible: !this._cfoService.hasStaticInstance,
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
                                width: AppConsts.isMobile ? '215' : '279',
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
                            visible: !AppConsts.isMobile && this.searchValue && this.searchValue.length > 0 && (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKeys),
                            options: {
                                text: this.l('Search All')
                            },
                            attr: {
                                'filter-selected': this.searchValue && this.searchValue.length > 0 && (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKeys),
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
                            action: DataGridService.enableFilteringRow.bind(this, this.dataGrid),
                            options: {
                                checkPressed: DataGridService.getGridOption(this.dataGrid, 'filterRow.visible')
                            }
                        },
                        {
                            name: 'showCompactRowsHeight',
                            visible: !this._cfoService.hasStaticInstance,
                            action: DataGridService.showCompactRowsHeight.bind(this, this.dataGrid)
                        },
                        {
                            name: 'download',
                            widget: 'dxDropDownMenu',
                            options: {
                                hint: this.l('Download'),
                                items: [
                                    {
                                        action: Function(),
                                        text: this.l('Save as PDF'),
                                        icon: 'pdf',
                                    },
                                    {
                                        action: this.exportToXLS.bind(this),
                                        text: this.l('Export to Excel'),
                                        icon: 'xls',
                                    },
                                    {
                                        action: this.exportToCSV.bind(this),
                                        text: this.l('Export to CSV'),
                                        icon: 'sheet'
                                    },
                                    {
                                        action: this.exportToGoogleSheet.bind(this),
                                        text: this.l('Export to Google Sheets'),
                                        icon: 'sheet'
                                    },
                                    {
                                        type: 'downloadOptions'
                                    }
                                ]
                            }
                        },
                        {
                            name: 'columnChooser',
                            visible: !this._cfoService.hasStaticInstance,
                            action: DataGridService.showColumnChooser.bind(this, this.dataGrid)
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
                                this.fullScreenService.toggleFullscreen(document.documentElement);
                                setTimeout(() => this.dataGrid.instance.repaint(), 100);
                            }
                        }
                    ]
                }
            ]);
        }
    }

    onToolbarPreparing(e) {
        if (this.showDataGridToolbar) {
            e.toolbarOptions.items.unshift(
                {
                    location: 'after',
                    template: 'startBalanceTotal'
                },
                {
                    location: 'after',
                    template: 'creditTotal'
                },
                {
                    location: 'after',
                    template: 'debitTotal'
                },
                {
                    location: 'after',
                    template: 'transactionTotal'
                }
            );
        }
        e.toolbarOptions.visible = this.showDataGridToolbar;
    }

    processTotalValuesInternal(totals, startingBalanceTotal = 0) {
        let selectedRows = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowsData() : [];
        if (selectedRows.length) {
            let creditTotal = this.creditTransactionTotal = 0;
            let creditCount = this.creditTransactionCount = 0;
            let creditClassifiedCount = this.creditClassifiedTransactionCount = 0;

            let debitTotal = this.debitTransactionTotal = 0;
            let debitCount = this.debitTransactionCount = 0;
            let debitClassifiedCount = this.debitClassifiedTransactionCount = 0;

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
                this.changeDetectionRef.detectChanges();
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
                this.changeDetectionRef.detectChanges();
            });

            this.adjustmentStartingBalanceTotal = totals[0].adjustmentStartingBalanceTotal + startingBalanceTotal;
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

            this.adjustmentStartingBalanceTotal = startingBalanceTotal;
            this.adjustmentTotal = 0;
        }

        this.changeDetectionRef.markForCheck();
    }

    processTotalValues(rowSelection = false) {
        let totals = this.totalDataSource && this.totalDataSource.items();
        if (!rowSelection && this.dateFilter.items.from.value) {
            let dateFrom = this.dateFilter.items.from.value ? new Date(this.dateFilter.items.from.value) : undefined;
            let dateTo = this.dateFilter.items.to.value ? new Date(this.dateFilter.items.to.value) : undefined;
            this.transactionsServiceProxy.getStartingBalance(
                this.instanceType as InstanceType,
                this.instanceId,
                DateHelper.removeTimezoneOffset(dateFrom, false, 'from'),
                dateTo ? DateHelper.removeTimezoneOffset(dateTo, false, 'to') : undefined,
                this.cfoPreferencesService.selectedCurrencyId,
                this.bankAccountFilter.items.element.value,
                this.businessEntityFilter.items.element.value
            ).subscribe(res => this.processTotalValuesInternal(totals, res));
        } else
            this.processTotalValuesInternal(totals);
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
        this.clearCategoriesFilters();
        this.categorizationComponent.clearSelection();

        this.filtersService.clearAllFilters();
        this.selectedCashflowCategoryKeys = null;
        this.initToolbarConfig();
    }

    toggleCreditDefault() {
        this.defaultCreditTooltipVisible = !this.defaultCreditTooltipVisible;
        this.changeDetectionRef.detectChanges();
    }

    toggleDebitDefault() {
        this.defaultDebitTooltipVisible = !this.defaultDebitTooltipVisible;
        this.changeDetectionRef.detectChanges();
    }

    toggleTotalDefault() {
        this.defaultTotalTooltipVisible = !this.defaultTotalTooltipVisible;
        this.changeDetectionRef.detectChanges();
    }

    applyTotalFilters(classified: boolean, credit: boolean, debit: boolean) {
        let classifiedFilter: FilterModel = _.find(this.filters, (f: FilterModel) => f.caption === 'classified' );
        let amountFilter: FilterModel = _.find(this.filters, (f: FilterModel) => f.caption === 'Amount' );

        if (amountFilter) {
            amountFilter.items['from'].value = credit ? '0' : '';
            amountFilter.items['to'].value = debit ? '0' : '';
            this.defaultCreditTooltipVisible = false;
        }

        if (classifiedFilter) {
            classifiedFilter.items['yes'].value = classified;
            classifiedFilter.items['no'].value = !classified;
            this.filtersService.change(classifiedFilter);
        }
    }

    clearClassifiedFilter() {
        this.classifiedFilter.items['yes'].value = false;
        this.classifiedFilter.items['no'].value = false;
        this.filtersService.change(this.classifiedFilter);
    }

    initFiltering() {
        this.filtersService.apply(filter => {
            if (filter) {
                let filterName = filter.caption.toLowerCase();
                if (filterName == 'businessentity' || filterName == 'account') {
                    this.bankAccountsService.changeSelectedBusinessEntities(
                        this.businessEntityFilter.items.element.value);
                    this.bankAccountsService.applyFilter();
                }

                if (filterName == 'classified') {
                    if (this.selectedCashflowCategoryKeys && filter.items['no'].value === true && filter.items['yes'].value !== true) {
                        this.clearCategoriesFilters();
                        this.categorizationComponent.clearSelection();
                        this.selectedCashflowCategoryKeys = null;
                    }
                }
            } else {
                this.selectAllAccounts();
                this.dataGrid.instance.clearFilter();
            }

            this.initToolbarConfig();
            this.processFilterInternal();
        });
        this.filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams);
    }

    setDataSource() {
        if (this.dataGrid && !this.dataGrid.dataSource) {
            this.dataGrid.dataSource = this.dataSource;
            this.changeDetectionRef.markForCheck();
        }
    }

    applyTotalBankAccountFilter(emitFilterChange = false) {
        this.setDataSource();
        this.bankAccountsService.setBankAccountsFilter(
            this.filters, this.syncAccounts, emitFilterChange);
    }

    setCurrenciesFilter(currencyId: string) {
        return this.changeAndGetCurrenciesFilter(this.currencyFilter, currencyId);
    }

    changeAndGetCurrenciesFilter(currenciesFilter: FilterModel, countryId: string): FilterModel {
        currenciesFilter.items['element'].value = [countryId];
        currenciesFilter.updateCaptions();
        return currenciesFilter;
    }

    processFilterInternal() {
        let filterQuery = this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.cashFlowCategoryFilter.concat(this.filters),
            (filter) => {
                if (filter.caption && filter.caption.toLowerCase() === 'account')
                    this.bankAccountsService.applyFilter();

                let filterMethod = FiltersService['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );

        this.totalDataSource['_store']['_url'] = this.getODataUrl(this.totalDataSourceURI, filterQuery);
        this.totalDataSource.load();

        this.transactionsFilterQuery = _.reject(filterQuery, (x) => _.has(x, 'AccountingTypeId')
            || (_.has(x, 'CashflowCategoryId') && typeof x['CashflowCategoryId'] == 'number')
            || (_.has(x, 'or') &&  _.has(x.or[0], 'CashflowCategoryId'))
            || _.has(x, 'CashflowSubCategoryId')
        );
        this.changeDetectionRef.detectChanges();
    }

    getODataUrl(uri: string, filter?: Object) {
        let url = super.getODataUrl(uri, filter);
        url += (url.indexOf('?') == -1 ? '?' : '&') + 'currencyId=' + this.cfoPreferencesService.selectedCurrencyId;
        return url;
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

    filterByCashflowCategories(categories: Category[]) {
        this.clearCategoriesFilters();
        if (categories && categories.length) {
            if (categories.length === 1 && !this.isCategory(categories[0])) {
                if (this.isCashflowType(categories[0])) {
                    this.selectedCashflowTypeIds.next([categories[0].key.toString()]);
                } else {
                    let field = {};
                    if (this.isAccountingTypeId(categories[0]))
                        field['AccountingTypeId'] = new FilterItemModel(+categories[0].key);
                    else
                        field['CashflowSubCategoryId'] = new FilterItemModel(+categories[0].key);

                    this.cashFlowCategoryFilter = [
                        new FilterModel({
                            items: field
                        })
                    ];
                }
            } else {
                this.selectedCategoriesIds.next(
                    categories.map((category: Category) => category.key)
                );
            }
            this.clearClassifiedFilter();
            this.processFilterInternal();
        } else if (this.selectedCashflowCategoryKeys) {
            this.processFilterInternal();
        }

        this.selectedCashflowCategoryKeys = categories && categories.map((category: Category) => {
            return category.key;
        });
        this.initToolbarConfig();
    }

    private isCashflowType(category: Category): boolean {
        return !+category.key;
    }

    private isAccountingTypeId(category: Category): boolean {
        return isNaN(category.key);
    }

    private isCategory(category: Category): boolean {
        return category.parent !== 'root' && isNaN(+category.parent);
    }

    private clearCategoriesFilters() {
        this.cashFlowCategoryFilter = [];
        this.selectedCategoriesIds.next([]);
    }

    onSelectionChanged($event, initial = false) {
        if ($event.selectedRowKeys)
            this.processTotalValues($event.selectedRowKeys.length);

        if (!this.manageAllowed)
            return;

        let transactionKeys = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowKeys() : [];
        if (!initial && (Boolean(this.selectedCashflowCategoryKeys) || Boolean(transactionKeys.length)))
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
            this.changeDetectionRef.detectChanges();
        }).on('dragend', (e) => {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();

            this.draggedTransactionRow = null;
            this.dragInProgress = false;
            document.removeEventListener('dxpointermove', this.stopPropagation);
            this.changeDetectionRef.detectChanges();
        }).on('click', () => {
            this.draggedTransactionRow = null;
            this.dragInProgress = false;
            this.changeDetectionRef.detectChanges();
        });
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    onCellClick($event) {
        if ($event.rowType === 'data') {
            if (this._cfoService.classifyTransactionsAllowed() &&
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
                this.cacheService.set(this.getCacheKey('dataGridState'), instance.state());
        }, 500);
    }

    applyGridState(instance) {
        instance = instance || this.dataGrid && this.dataGrid.instance;
        if (instance) {
            let state = this.cacheService.get(
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
        let transactions: any[] = this.dataGrid.instance.getSelectedRowKeys();
        if (!transactions.length && this.draggedTransactionRow)
            transactions = [this.draggedTransactionRow];
        let transactionIds = transactions.map(t => t.Id);
        let isSingleDraggedTransaction = !!this.draggedTransactionRow;

        if ($event.categoryId) {
            let updateTransactionCategoryMethod = (suppressCashflowTypeMismatch: boolean = false) => {
                this.classificationServiceProxy.updateTransactionsCategory(
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
                    if (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKeys) {
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

                        this.processTotalValues();
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
        this.classificationServiceProxy.autoClassify(InstanceType[this.instanceType], this.instanceId, this.autoClassifyData)
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
        this.classificationServiceProxy.reset(InstanceType[this.instanceType], this.instanceId, this.resetRules)
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

    showTransactionDetailsInfo() {
        if (!this.transactionDetailDialogRef) {
            this.transactionDetailDialogRef = this.dialog.open(TransactionDetailInfoComponent, {
                panelClass: 'slider',
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {
                    refreshParent: this.invalidate.bind(this),
                    transactionId$: this.transactionId$
                }
            });

            this.transactionDetailDialogRef.afterOpen().subscribe(
                () => this.transactionId$.next(this.transactionId)
            );

            this.transactionDetailDialogRef.afterClosed().subscribe(
                () => {
                    this.transactionDetailDialogRef = undefined;
                }
            );
        } else {
            this.transactionId$.next(this.transactionId);
        }
    }

    selectAllAccounts() {
        let selectedBankAccountIds = [];
        this.syncAccounts.forEach(syncAccount => {
            if (syncAccount.bankAccounts)
                syncAccount.bankAccounts.forEach(bankAccount => {
                    selectedBankAccountIds.push(bankAccount.id);
                });
        });
        this.businessEntityFilter.items.element.value =
            this.filtersInitialData.businessEntities.map(item => item.id);
        this.bankAccountFilter.items.element.value = selectedBankAccountIds;
        this.bankAccountsService.changeState({
            selectedBusinessEntitiesIds: this.businessEntityFilter.items.element.value,
            selectedBankAccountIds: selectedBankAccountIds
        });
        this.bankAccountsService.applyFilter();
    }

    get gridHeight() {
        return window.innerHeight - (AppConsts.isMobile ? 160 : 150) - (this.appService.toolbarIsHidden.value ? 0 : 62) + 'px';
    }

    ngOnDestroy() {
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        super.ngOnDestroy();
    }

    activate() {
        super.activate();
        this.initFiltering();
        this.initToolbarConfig();
        this.lifecycleService.activate.next();
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If we get some params in link - update transactions list */
        if (this.handleParams(this.route.snapshot.queryParamMap)) {
            this.processFilterInternal();
            /** If selected accounts changed in another component - update widgets */
        } else if (this.updateAfterActivation) {
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
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.rootComponent.overflowHidden(false);
    }
}
