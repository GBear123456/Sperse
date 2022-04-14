/** Core imports */
import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    Injector,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
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
    CounterpartyDto,
    TransactionsServiceProxy,
    InstanceType,
    ClassificationServiceProxy,
    UpdateTransactionsCategoryInput,
    AutoClassifyDto,
    ResetClassificationDto,
    BankAccountsServiceProxy,
    TransactionTypesAndCategoriesDto,
    TransactionTypeDto,
    FilterElementDtoOfString,
    FiltersInitialData,
    SyncAccountBankDto
} from '@shared/service-proxies/service-proxies';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCBoxesComponent } from '@shared/filters/cboxes/filter-cboxes.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
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
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { BankAccountDto } from '@shared/service-proxies/service-proxies';
import { BusinessEntitiesChooserComponent } from '@shared/cfo/bank-accounts/business-entities-chooser/business-entities-chooser.component';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';
import { TransactionDto } from '@app/cfo/transactions/transaction-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { TransactionFields } from '@app/cfo/transactions/transaction-fields.enum';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';
import { RequestHelper } from '@shared/helpers/RequestHelper';

@Component({
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        TransactionsServiceProxy,
        ClassificationServiceProxy,
        BankAccountsServiceProxy,
        LifecycleSubjectsService,
        DatePipe,
        CurrencyPipe
    ]
})
export class TransactionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    public set categoriesShowed(value: boolean) {
        this.categoriesShowedBefore = this._categoriesShowed;
        if (this._categoriesShowed = value) {
            this.filtersService.fixed = false;
            this.filtersService.disable();
        }
    }

    public get isHeaderFilterVisible() {
        return DataGridService.getGridOption(this.dataGrid, 'filterRow.visible');
    }

    public get categoriesShowed(): boolean {
        return !this.isAdvicePeriod && this._categoriesShowed;
    }

    constructor(injector: Injector,
        private transactionsServiceProxy: TransactionsServiceProxy,
        private classificationServiceProxy: ClassificationServiceProxy,
        public changeDetectionRef: ChangeDetectorRef,
        private cacheService: CacheService,
        private lifecycleService: LifecycleSubjectsService,
        private store$: Store<RootStore.State>,
        private route: ActivatedRoute,
        private datePipe: DatePipe,
        private currencyPipe: CurrencyPipe,
        private calendarService: CalendarService,
        public appService: AppService,
        public cfoPreferencesService: CfoPreferencesService,
        public filtersService: FiltersService,
        public dialog: MatDialog,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
        if (filtersService.fixed || this.isAdvicePeriod)
            this._categoriesShowed = false;

        this.searchColumns = [
            this.transactionFields.Description,
            this.transactionFields.CashflowSubCategoryName,
            this.transactionFields.CashflowCategoryName,
            this.transactionFields.Descriptor
        ];
        this.searchValue = '';
    }

    get gridHeight() {
        return window.innerHeight -
            (this.isFullscreenMode ? 0 : (AppConsts.isMobile ? 160 : 150)) -
            (this.appService.toolbarIsHidden.value ? 0 : 62) + 'px';
    }
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild('categoriesPanel') categorizationComponent: CategorizationComponent;
    @ViewChild('accountFilterContainer') accountFilterContainer: ElementRef;
    @ViewChild('accountFilter') accountFilter: DxDropDownBoxComponent;
    @ViewChild('counterpartyFilterContainer') counterpartyFilterContainer: ElementRef;
    @ViewChild('counterpartyFilter') counterpartyFilter: DxDropDownBoxComponent;
    @ViewChild('becFilterContainer') businessEntitiesFilterContainer: ElementRef;
    @ViewChild(BusinessEntitiesChooserComponent) businessEntitiesChooser: BusinessEntitiesChooserComponent;
    @ViewChild('categoryFilterContainer') categoryChooserContainer: ElementRef;
    @ViewChild('categoryFilter') categoryChooser: DxDropDownBoxComponent;

    resetRules = new ResetClassificationDto();
    private autoClassifyData = new AutoClassifyDto();
    private transactionDetailDialogRef: MatDialogRef<TransactionDetailInfoComponent>;
    private transactionId$: Subject<number> = new Subject<number>();

    filtersInitialData: FiltersInitialData;
    counterpartiesFilter: FilterModel;
    counterparties$: Observable<CounterpartyDto[]> = this.transactionsServiceProxy.getCounterparties(this.instanceType, this.instanceId);
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
    rowsViewHeight: number;

    private readonly dataSourceURI = 'Transaction';
    private readonly countDataSourceURI = 'Transaction/$count';
    private readonly totalDataSourceURI = 'TransactionTotal';
    private readonly reportSourceURI = 'TransactionReport';
    private filters: FilterModel[];
    private cashFlowCategoryFilter = [];
    private filterQuery: Object;
    private dateFilter: FilterModel = new FilterModel({
        component: FilterCalendarComponent,
        operator: { from: 'ge', to: 'le' },
        caption: 'Date',
        field: 'Date',
        items$: this.calendarService.dateRange$.pipe(
            map((dateRange: CalendarValuesModel) => ({
                from: new FilterItemModel(dateRange.from.value),
                to: new FilterItemModel(dateRange.to.value)
            })
        )),
        options: { method: 'getFilterByDate' }
    });
    public bankAccountFilter: FilterModel;
    private businessEntityFilter: FilterModel;
    public transactionsFilterQuery: any[];

    public countDataSource: DataSource;
    public totalErrorMsg: string;
    public totalCount: number;

    public manageAllowed = this._cfoService.classifyTransactionsAllowed(false);
    public dragInProgress = false;
    private draggedTransactionId: number;

    public bankAccountCount;
    public bankAccounts: number[];
    public syncAccountsLookup: any[] = [];
    public bankAccountsLookup: BankAccountDto[] = [];
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
    headlineButtons: HeadlineButton[] = [
        {
            enabled: true,
            action: () => this.categoriesShowed = !this.categoriesShowed,
            label: '',
            class: 'toggle dx-button'
        }
    ];
    transactionTypesAndCategories$: Observable<TransactionTypesAndCategoriesDto> = this.transactionsServiceProxy.getTransactionTypesAndCategories().pipe(
        publishReplay(),
        refCount()
    );
    categories$: Observable<FilterElementDtoOfString[]> = this.transactionTypesAndCategories$.pipe(
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
                value: [ this.cfoPreferencesService.selectedCurrencyId ],
                isClearAllowed: false
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

    private repaintTimeout;
    private categoriesShowedBefore = !AppConsts.isMobile;
    private _categoriesShowed = this.categoriesShowedBefore;
    private syncAccounts: any;
    private updateAfterActivation: boolean;
    categoriesRowsData: Category[] = [];
    public showDataGridToolbar = !AppConsts.isMobile;
    departmentFeatureEnabled: boolean = this.feature.isEnabled(AppFeatures.CFODepartmentsManagement);
    showToggleCompactViewButton: boolean = !this._cfoService.hasStaticInstance;
    toolbarConfig: ToolbarGroupModel[];
    showFilterRow: boolean = this.instanceId && this.isAdvicePeriod;
    readonly transactionFields: KeysEnum<TransactionDto> = TransactionFields;
    private fieldsDependencies: FieldDependencies = {
        cashflowCategoryName: [ this.transactionFields.CashflowCategoryId ],
        cashflowSubCategoryName: [ this.transactionFields.CashflowSubCategoryId ]
    };
    amountCustomizer = (value) => {
        return this.currencyPipe.transform(
            value,
            this.cfoPreferencesService.selectedCurrencyId,
            this.cfoPreferencesService.selectedCurrencySymbol,
            '1.2-2'
        ) || '';
    }

    ngOnInit(): void {
        this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId)).pipe(
            skip(1),
            switchMap((selectedCurrencyId) => this.componentIsActivated ? of(selectedCurrencyId) : this.lifecycleService.activate$.pipe(first(), mapTo(selectedCurrencyId)))
        ).subscribe((selectedCurrencyId) => {
            this.filtersService.change([this.setCurrenciesFilter(selectedCurrencyId)]);
        });

        this.calendarService.dateRange$.pipe(
            skip(1),
            takeUntil(this.destroy$),
            switchMap((dateRange) => this.componentIsActivated
                ? of(dateRange)
                : this.lifecycleService.activate$.pipe(first(), mapTo(dateRange))
            )
        ).subscribe(() => {
            this.filtersService.change([this.dateFilter]);
        });

        this.dataSource = new DataSource({
            store: new ODataStore({
                key: this.transactionFields.Id,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.moveDropdownsToHost();                    
                    this.changeDetectionRef.detectChanges();
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    const orderBy = request.params.$orderby;
                    request.params.$orderby = orderBy ? orderBy + (orderBy.match(/\b(Id)\b/i) ? '' : ',Id desc') : 'Id desc';
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [ this.transactionFields.Id, this.transactionFields.CashFlowTypeId ],
                        this.fieldsDependencies
                    );
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
                },
                onLoaded: () => {
                    if (this.showFilterRow) {
                        this.showFilterRow = false;
                        this.dataGrid.instance.option('filterRow.visible', true);
                        this.initToolbarConfig();
                    }

                    setTimeout(() => {
                        if (this.isHeaderFilterVisible && this.repaintTimeout &&
                            this.getElementRef().nativeElement === this.categoryChooserContainer.nativeElement.parentElement
                        ) {
                             this.repaintDataGrid();
                        }
                        this.repaintTimeout = true;
                    });
                }
            })
        });
        this.dataSource['exportIgnoreOnLoaded'] = true;

        this.countDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                url: this.getODataUrl(this.countDataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.totalCount = this.totalErrorMsg = undefined;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (count: any) => {
                    if (!isNaN(count)) {
                        this.totalCount = count;
                        this.changeDetectionRef.detectChanges();
                    }
                },
                errorHandler: (e: any) => {
                    this.totalErrorMsg = this.l('AnHttpErrorOccured');
                }
            })
        });

        this.totalDataSource = new DataSource({
            store: new ODataStore({
                url: this.getODataUrl(this.totalDataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }),
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
        ).subscribe(([typeAndCategories, filtersInitialData, syncAccounts]:
                     [TransactionTypesAndCategoriesDto, FiltersInitialData, SyncAccountBankDto[]]) => {
            this.syncAccounts = syncAccounts;
            this.types = typeAndCategories.types.map((item: TransactionTypeDto) => item.name);
            this.categories = typeAndCategories.categories.map((item: FilterElementDtoOfString) => item.name);
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
                })
            ].concat(
                this._cfoService.hasStaticInstance ? [] : [
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
                    options: { type: 'number'},
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
                this.syncAccountsLookup = syncAccounts.map(acc => {
                    acc['accountName'] = acc.name;
                    acc['id'] = acc.syncRef;
                    return acc;
                }).filter(acc => acc.bankAccounts.length);
                this.bankAccountsLookup = syncAccounts.reduce((acc, item) => {
                    return acc.concat(item.bankAccounts);
                }, []);
                this.changeDetectionRef.detectChanges();
            });
            /** After selected accounts change */
            this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
                /** filter all widgets by new data if change is on this component */
                if (this.componentIsActivated) {
                    this.applyTotalBankAccountFilter(true);
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

    ngAfterViewInit() {
        super.activate();
    }

    reload() {
        this.refreshDataGrid();
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
            currencyId || categoryIdsString ||
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
        this.filtersService.fixed = false;
        this.filtersService.disable();
        /** Toggle balances widgets if it's mobile */
        if (AppConsts.isMobile) {
            this.showDataGridToolbar = !this.showDataGridToolbar;
        }
        this.repaintDataGrid();
        this.initToolbarConfig();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        visible: !this.isAdvicePeriod && !this._cfoService.hasStaticInstance,
                        action: () => {
                            this.filtersService.fixed = !this.filtersService.fixed;
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
                            placeholder: this.l('Search') + ' ' + this.l('Transactions').toLowerCase(),
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
                        visible: !!(!AppConsts.isMobile && this.searchValue && this.searchValue.length > 0 && (this.filtersService.hasFilterSelected || this.areCategoriesSelected())),
                        options: {
                            text: this.l('Search All')
                        },
                        attr: {
                            'filter-selected': this.searchValue && this.searchValue.length > 0 && (this.filtersService.hasFilterSelected || this.areCategoriesSelected()),
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
                        action: event => {
                            if (this.isHeaderFilterVisible) {
                                this.moveDropdownsToHost();
                            }
                            DataGridService.enableFilteringRow(this.dataGrid, event);
                        },
                        options: {
                            checkPressed: () => this.isHeaderFilterVisible
                        }
                    },
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [
                                {
                                    action: (option) => {
                                        this.exportService.exportToPDF(option, this.dataGrid);
                                    },
                                    text: this.l('SaveAsPDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: this.exportToXLS.bind(this),
                                    text: this.l('ExportToExcel'),
                                    visible: !this.isAdvicePeriod,
                                    icon: 'xls',
                                },
                                {
                                    action: this.downloadExcelReport.bind(this),
                                    text: this.isAdvicePeriod ? this.l('ExportToExcel') : this.l('ExportToExcelReport'),
                                    icon: 'xls'
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('ExportToCSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('ExportToGoogleSheets'),
                                    visible: !this.isAdvicePeriod,
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportToGoogleSheetReport.bind(this),
                                    text: this.isAdvicePeriod ? this.l('ExportToGoogleSheets') : this.l('ExportToGoogleSheetsReport'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions'
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
    }

    repaintDataGrid(delay = 0) {
        clearTimeout(this.repaintTimeout);
        this.repaintTimeout = setTimeout(() => {
            this.dataGrid.instance.repaint();
        }, delay);
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
            this.changeDetectionRef.detectChanges();
        }
    }

    onGridOptionChanged(event) {
        super.onGridOptionChanged(event);
        if (event.name == 'columns' && (
            event.fullName.includes('visibleIndex') ||
            event.fullName.includes('sortOrder') ||
            event.fullName.includes('visible')
        ))
            this.moveDropdownsToHost();
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
    }

    refreshDataGrid() {
        this.noRefreshedAfterSync = false;
        this.bankAccountsService.load(true, false).subscribe(
            () => this.applyTotalBankAccountFilter()
        );
        this.categorizationComponent.refreshCategories(false, false);
        this.processFilterInternal();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    searchAllClick() {
        this.clearCategoriesFilters();
        this.categorizationComponent.clearFilterSelection();

        this.filtersService.clearAllFilters();
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
            this.filtersService.change([classifiedFilter]);
        }
    }

    clearClassifiedFilter() {
        this.classifiedFilter.items['yes'].value = false;
        this.classifiedFilter.items['no'].value = false;
        this.filtersService.change([this.classifiedFilter]);
    }

    initFiltering() {
        if (this._activatedRoute.snapshot.queryParams.filters) {
            this.categoriesRowsData = [];
            this.clearCategoriesFilters();
            this.categorizationComponent.clearFilterSelection();
        }

        this.filtersService.apply((filters: FilterModel[]) => {
            if (filters && filters.length) {
                filters && filters.forEach((filter: FilterModel) => {
                    let filterName = filter.caption && filter.caption.toLowerCase();
                    if (filterName == 'businessentity' || filterName == 'account') {
                        this.bankAccountsService.changeSelectedBusinessEntities(
                            this.businessEntityFilter.items.element.value);
                        this.bankAccountsService.applyFilter();
                    }

                    if (filterName == 'classified') {
                        if (this.areCategoriesSelected() && filter.items['no'].value === true && filter.items['yes'].value !== true) {
                            this.clearCategoriesFilters();
                            this.categorizationComponent.clearFilterSelection();
                        }
                    }
                });
            } else {
                this.selectAllAccounts();
                this.dataGrid.instance.clearFilter();
            }

            this.initToolbarConfig();
            this.processFilterInternal();
        });
        this.filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams);
    }

    onPopupOpened(event) {
        event.component._popup.option('width', '340px');
    }

    setDataSource() {
        if (this.dataGrid && !this.dataGrid.dataSource) {
            if (!this.dataGrid.instance.option('paging.pageSize'))
                this.dataGrid.instance.option('paging.pageSize', 20);
            this.dataGrid.dataSource = this.dataSource;
        }
    }

    applyTotalBankAccountFilter(emitFilterChange = false) {
        this.setDataSource();
        this.bankAccountsService.setBankAccountsFilter(
            this.filters, this.syncAccounts, emitFilterChange
        );
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
        this.isDataLoaded = false;
        let filterQuery$: Observable<string> = this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.filters.concat(
                this.cashFlowCategoryFilter,
                this.counterpartiesFilter || []
            ), (filter) => {
                if (filter.caption && filter.caption.toLowerCase() === 'account')
                    this.bankAccountsService.applyFilter();

                if (!filter.options || !filter.options.method) {
                    let filterMethod = FiltersService['filterBy' + this.capitalize(filter.caption)];
                    if (filterMethod)
                        return filterMethod.call(this, filter);
                }
            }
        );

        filterQuery$.subscribe((filterQuery: string) => {
            if (filterQuery == 'canceled')
                return;

            this.filterQuery = filterQuery;

            this.countDataSource['_store']['_url'] = super.getODataUrl(this.countDataSourceURI, filterQuery);
            this.countDataSource.load();
            this.totalDataSource['_store']['_url'] = this.getODataUrl(this.totalDataSourceURI, filterQuery);
            this.totalDataSource.load();

            this.transactionsFilterQuery = _.reject(filterQuery, query =>
                this.checkFilterQueryByField(query, 'AccountingTypeId') ||
                this.checkFilterQueryByField(query, 'CashflowCategoryId') ||
                this.checkFilterQueryByField(query, 'CashflowSubCategoryId')
            );

            this.changeDetectionRef.detectChanges();
        });
    }

    checkFilterQueryByField(query, field) {
        return (_.has(query, field) && typeof query[field] == 'number') ||
            (_.has(query, 'or') && (typeof query.or[0] == 'string' ? query.or[0].includes(field) : _.has(query.or[0], field)));
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

    applyCashflowCategories(categories: Category[], component: CategorizationComponent) {
        this.filterByCashflowCategories(categories, component);
        this.categoryChooser.instance.close();
    }

    filterByCashflowCategories(categories: Category[], component: CategorizationComponent) {
        let filterCategories = categories.filter((category: Category) => this.isCategory(category));
        if (filterCategories.length) {
            let filterItems = {};
            this.addCategorizationFilter(filterCategories, 'OriginCashflowCategoryId', filterItems);
            this.cashFlowCategoryFilter = [
                new FilterModel({
                    items: filterItems,
                    options: { method: 'filterMethod' },
                    filterMethod: this.filterByOriginCategories.bind(
                        this, filterItems, component.categories
                    )
                })
            ];
        } else
            this.clearCategoriesFilters();

        this.clearClassifiedFilter();
        this.categoriesRowsData = categories.slice();
        this.initToolbarConfig();
    }

    private areCategoriesSelected() {
        return Boolean(this.categoriesRowsData && this.categoriesRowsData.length);
    }

    private addCategorizationFilter(categories: Category[], filterName: string, filterObject) {
        if (categories.length) {
            let keys = categories.map((category: Category) => parseInt(<string>category.key));
            filterObject[filterName] = new FilterItemModel(keys);
        }
    }

    private isCategory(category: Category): boolean {
        return !isNaN(<number>category.key);
    }

    private filterByOriginCategories(selectedItems, categorizationTree) {
        let filterObj = [];
        _.pairs(selectedItems)
            .reduce((filter, pair) => {
                let selectedIds = pair.pop().value, key = pair.pop();
                if (selectedIds) {
                    let categories = categorizationTree.filter(item => this.isCategory(item)),
                        selectedCount = selectedIds.length,
                        totalCount = categories.length;

                    if (totalCount > 0 && selectedCount == totalCount)
                        filter.push(`not(${key} eq null)`);
                    else if (selectedCount > totalCount - selectedCount) {
                        let lookupSelected = _.object(selectedIds, selectedIds);
                        filter.push(`not(${key} in (${
                            categories.filter(
                                category => !lookupSelected.hasOwnProperty(category.key)
                            ).map(category => category.key).join(',')
                        })) and not(${key} eq null)`);
                    } else if (selectedCount)
                        filter.push(`${key} in (${selectedIds.join(',')})`);
                }
                return filter;
            }, filterObj);
        return filterObj;
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
        if (!initial && (this.areCategoriesSelected() || Boolean(transactionKeys.length)))
            this.categoriesShowed = true;

        let img = new Image();
        img.src = './assets/common/icons/drag-icon.svg';

        let element = <any>$($event.element);
        let affectedRows = element.find('tr.dx-data-row').removeAttr('draggable').off('dragstart').off('dragend');
        if (transactionKeys.length)
            affectedRows = affectedRows.filter('.dx-selection');
        affectedRows.attr('draggable', true).on('dragstart', (e) => {
            if (!transactionKeys.length)
                this.draggedTransactionId = this.dataGrid.instance.getKeyByRowIndex(e.currentTarget.rowIndex);
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

            this.draggedTransactionId = null;
            this.dragInProgress = false;
            document.removeEventListener('dxpointermove', this.stopPropagation);
            this.changeDetectionRef.detectChanges();
        }).on('click', () => {
            this.draggedTransactionId = null;
            this.dragInProgress = false;
            this.changeDetectionRef.detectChanges();
        });
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    onCellClick($event) {
        if ($event.rowType === 'data') {
            const transaction: TransactionDto = $event.data;
            if (this._cfoService.classifyTransactionsAllowed() &&
                (($event.column.dataField == this.transactionFields.CashflowCategoryName && transaction.CashflowCategoryId) ||
                ($event.column.dataField == this.transactionFields.CashflowSubCategoryName && transaction.CashflowSubCategoryId))) {
                this.dialog.open(RuleDialogComponent, {
                    panelClass: 'slider',
                    data: {
                        categoryId: $event.column.dataField == this.transactionFields.CashflowCategoryName
                            ? transaction.CashflowCategoryId
                            : transaction.CashflowSubCategoryId,
                        categoryCashflowTypeId: $event.CashFlowTypeId,
                        transactions: [transaction],
                        transactionIds: [transaction.Id],
                        refershParent: this.refreshDataGrid.bind(this)
                    }
                }).afterClosed().subscribe();
            }
            if ($event.column.dataField == this.transactionFields.Description) {
                this.transactionId = transaction.Id;
                this.showTransactionDetailsInfo();
            }
        }
    }

    appendFilter(event, filter) {
        clearTimeout(filter.nativeElement.getAttribute('timeout'));
        filter.nativeElement.setAttribute('timeout', setTimeout(() => {
            if (this.getElementRef().nativeElement == filter.nativeElement.parentElement) {
                event.cellElement.innerHTML = '';
                event.cellElement.appendChild(filter.nativeElement);
            }
        }), 300);
    }

    onCellPrepared($event) {
        if ($event.rowType === 'filter') {
            if ($event.column.dataField == TransactionFields.BusinessEntityId)
                this.appendFilter($event, this.businessEntitiesFilterContainer);
            else if ($event.column.dataField == TransactionFields.CashflowCategoryName)
                this.appendFilter($event, this.categoryChooserContainer);
            else if ($event.column.dataField == TransactionFields.CounterpartyName)
                this.appendFilter($event, this.counterpartyFilterContainer);
            else if ($event.column.dataField == TransactionFields.BankAccountId)
                this.appendFilter($event, this.accountFilterContainer);
        } else if ($event.rowType === 'data') {
            const transaction: TransactionDto = $event.data;
            if ($event.column.dataField == this.transactionFields.CashflowCategoryName && !transaction.CashflowCategoryName) {
                let parentRow = <HTMLTableRowElement>$event.cellElement.parentElement;
                if (parentRow) {
                    let rowIndex = parentRow.rowIndex;
                    let rows = $event.cellElement.closest('.dx-datagrid-rowsview').querySelectorAll(`tr:nth-of-type(${rowIndex + 1})`);
                    /** add uncategorized class to both checkbox and row (hack) */
                    for (let i = 0; i < rows.length; i++) {
                        rows[i].classList.add(`uncategorized`);
                    }
                }
            } else if ($event.column.dataField == this.transactionFields.CashflowSubCategoryName && transaction.CashflowSubCategoryName) {
                $event.cellElement.classList.add('clickable-item');
            }
        }
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        this.onSelectionChanged(event, true);
        this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
    }

    categorizeTransactions($event) {
        let transactions: TransactionDto[] = this.dataGrid.instance.getSelectedRowsData();
        if (!transactions.length && this.draggedTransactionId) {
            let selectedRow = this.dataGrid.instance.getVisibleRows().find(row => row.data.Id == this.draggedTransactionId);
            transactions = [selectedRow ? selectedRow.data : <any>{Id: this.draggedTransactionId}];
        }
        let transactionIds: number[] = transactions.map((transaction: TransactionDto) => transaction.Id);
        let isSingleDraggedTransaction = !!this.draggedTransactionId;

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
                    if (this.filtersService.hasFilterSelected || this.areCategoriesSelected()) {
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

            if (transactions.some((transaction: TransactionDto) => transaction.CashFlowTypeId != $event.categoryCashType)) {
                abp.message.confirm(this.l('RuleDialog_ChangeCashTypeMessage'), this.l('RuleDialog_ChangeCashTypeTitle'),
                    (result: boolean) => {
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

            this.transactionDetailDialogRef.afterOpened().subscribe(
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

    customizeGroupAmountCell = (cellInfo) => this.amountCustomizer(cellInfo.value);

    calculateDateDisplayValue = (data) => this.datePipe.transform(data.Date, 'MM/dd/yyyy');

    calculateMonthYearDisplayValue = (data) => this.datePipe.transform(data.Date, 'MMM yyyy');

    calculateIsPendingDisplayValue = (data) => this.l(data.IsPending ? 'Transactions_Pending' : 'Transactions_Settled');

    toggleDataGridToolbar() {
        this.showDataGridToolbar = !this.showDataGridToolbar;
        this.repaintDataGrid();
    }

    onCounterpartiesInitialized(event) {
        this.counterpartiesFilter = new FilterModel({
            field: 'CounterpartyId',
            options: { method: 'filterMethod' },
            filterMethod: () => {
                return {
                    or: event.component.option('selectedItems').map(item => {
                        return { CounterpartyId: item.id };
                    }
                )};
            }
        });
    }

    onCounterpartiesChanged(component) {
        this.counterpartiesFilter.isSelected =
            component.instance.option('selectedItems').length;
        this.processFilterInternal();
        this.counterpartyFilter.instance.close();
    }

    onCounterpartiesClear(component) {
        component.instance.unselectAll();
        setTimeout(() => this.onCounterpartiesChanged(component));
    }

    onAccountsChanged() {
        let keys = this.syncAccountsLookup.reduce((acc, item) => {
            return acc.concat(item.bankAccounts.filter(bank => bank.selected).map(bank => bank.id));
        }, []);
        this.bankAccountFilter.isSelected = keys.length;
        this.bankAccountFilter.items.element.value = keys;

        this.filtersService.change([this.bankAccountFilter]);
        this.accountFilter.instance.close();
    }

    onAccountsClear(component) {
        component.instance.unselectAll();
        this.bankAccountFilter.isSelected = false;
        this.bankAccountFilter.clearFilterItems();
        this.filtersService.change([this.bankAccountFilter]);
        this.accountFilter.instance.close();
    }

    customizeExcelCell(e) {
        if (e.gridCell.rowType === 'header' && e.gridCell.column.dataField === 'Description') {
            e.value = 'Description';
        }
    }

    getDownloadExcelReportUrl(option, dataGrid): string {
        dataGrid = dataGrid || this.dataGrid;
        let filterQuery = [...<any[]>this.filterQuery];
        if (option != 'all') {
            let ids: number[] = dataGrid.instance.getSelectedRowKeys();
            filterQuery.push(`Id in (${ids.join(',')})`);
        }

        let url = super.getODataUrl(this.reportSourceURI, filterQuery);
        let businessEntityValues: number[] = this.businessEntityFilter.items.element.value;
        if (url.indexOf('?') == -1) url += '?';

        let dateFrom = this.dateFilter.items.from.value ? new Date(this.dateFilter.items.from.value) : undefined;
        let dateTo = this.dateFilter.items.to.value ? new Date(this.dateFilter.items.to.value) : undefined;
        if (dateFrom)
            url += '&fromDate=' + DateHelper.removeTimezoneOffset(dateFrom, false, 'from').toJSON();
        if (dateTo)
            url += '&toDate=' + DateHelper.removeTimezoneOffset(dateTo, false, 'to').toJSON();
        if (businessEntityValues)
            businessEntityValues.map(v => url += '&businessEntityIds=' + v);
        url += '&currencyId=' + this.cfoPreferencesService.selectedCurrencyId;

        return url;
    }

    downloadExcelReport(option, dataGrid) {
        document.location.href = this.getDownloadExcelReportUrl(option, dataGrid);
    }

    exportToGoogleSheetReport(option, dataGrid) {
        let url = this.getDownloadExcelReportUrl(option, dataGrid);
        abp.ui.setBusy();
        RequestHelper.downloadFileBlob(url, (blob, fileName) => {
            this.exportService.exportBlobToGoogleSheet(blob, fileName || this.exportService.getFileName(null, 'Report'))
                .then(() => abp.ui.clearBusy());
        }, true);
    }

    private moveDropdownsToHost() {
        let hostElement = this.getElementRef().nativeElement;
        if (hostElement !== this.businessEntitiesFilterContainer.nativeElement.parentElement)
            hostElement.appendChild(this.businessEntitiesFilterContainer.nativeElement);
        if (hostElement !== this.categoryChooserContainer.nativeElement.parentElement)
            hostElement.appendChild(this.categoryChooserContainer.nativeElement);
        if (hostElement !== this.counterpartyFilterContainer.nativeElement.parentElement)
            hostElement.appendChild(this.counterpartyFilterContainer.nativeElement);
        if (hostElement !== this.accountFilterContainer.nativeElement.parentElement)
            hostElement.appendChild(this.accountFilterContainer.nativeElement);
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
        this.dataGrid.instance.repaint();
    }

    deactivate() {
        super.deactivate();
        this.dialog.closeAll();
        this.moveDropdownsToHost();
        this.filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}