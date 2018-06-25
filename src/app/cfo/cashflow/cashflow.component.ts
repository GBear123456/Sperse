import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

import { Periods } from './enums/periods.enum';
import { Projected } from './enums/projected.enum';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';

import { IGroupbyItem } from './models/groupbyItem';
import { IEventDescription } from './models/event-description';
import { WeekInfo } from './models/week-info';
import { CellInfo } from './models/cell-info';
import { CategorizationModel } from './models/categorization-model';
import { CellInterval } from './models/cell-interval';
import { TransactionStatsDtoExtended } from './models/transaction-stats-dto-extended';
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';

import { CashflowService } from './cashflow.service';
import {
    CashflowServiceProxy,
    StatsFilter,
    CashFlowInitialData,
    StatsDetailFilter,
    TransactionStatsDto,
    CashFlowForecastServiceProxy,
    ClassificationServiceProxy,
    BankAccountsServiceProxy,
    GetCategoryTreeOutput,
    CashFlowGridSettingsDto,
    InstanceType,
    InstanceType10,
    InstanceType17,
    InstanceType18,
    UpdateForecastInput,
    CashFlowStatsDetailDtoStatus,
    AddForecastInput,
    BankAccountDto,
    StatsFilterGroupByPeriod,
    TransactionStatsDtoAdjustmentType,
    DiscardDiscrepanciesInput,
    CreateForecastModelInput,
    CashFlowStatsDetailDto,
    Period,
    UpdateTransactionsCategoryWithFilterInput,
    UpdateForecastsInput,
    CreateForecastsInput,
    CashflowGridGeneralSettingsDtoSplitMonthType
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from './preferences-dialog/preferences.service';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { OperationsComponent } from './operations/operations.component';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';

import { DxPivotGridComponent, DxDataGridComponent } from 'devextreme-angular';
import DevExpress from 'devextreme/bundles/dx.all';
import config from 'devextreme/core/config';
import TextBox from 'devextreme/ui/text_box';
import NumberBox from 'devextreme/ui/number_box';
import Button from 'devextreme/ui/button';
import Tooltip from 'devextreme/ui/tooltip';
import SparkLine from 'devextreme/viz/sparkline';
import ScrollView from 'devextreme/ui/scroll_view';

import * as _ from 'underscore.string';
import * as underscore from 'underscore';
import * as moment from 'moment';

import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { MatDialog } from '@angular/material';
import { PreferencesDialogComponent } from './preferences-dialog/preferences-dialog.component';
import { GeneralScope } from './enums/general-scope.enum';
import { IExpandLevel } from './models/expand-level';
import * as $ from 'jquery';

import { CacheService } from 'ng2-cache-service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/buffer';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from 'shared/filters/bank-account-filter/bank-account-filter.model';
import { CellsCopyingService } from 'shared/common/xls-mode/cells-copying/cells-copying.service';

import { CalculatorService } from '@app/cfo/shared/calculator-widget/calculator-widget.service';
import { TransactionDetailInfoComponent } from '@app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import { SynchProgressComponent } from '@app/cfo/shared/common/synch-progress/synch-progress.component';

/** Constants */
const StartedBalance = 'B',
      Income         = 'I',
      Expense        = 'E',
      Reconciliation = 'D',
      NetChange      = 'NC',
      Total          = 'T',
      GrandTotal     = 'GT';

const PSB = CategorizationPrefixes.CashflowType + StartedBalance,
      PI  = CategorizationPrefixes.CashflowType + Income,
      PE  = CategorizationPrefixes.CashflowType + Expense,
      PR  = CategorizationPrefixes.CashflowType + Reconciliation,
      PNC = CategorizationPrefixes.CashflowType + NetChange,
      PT  = CategorizationPrefixes.CashflowType + Total;

/** @todo check error cell_options_1.CellOptions is not a constructor when import from separate file */
export class CellOptions {
    classes?: string[] = [];
    parentClasses?: string[] = [];
    attributes?: any = {};
    elementsToAppend?: HTMLElement[] = [];
    childrenSelectorsToRemove?: string[] = [];
    eventListeners?: object = {};
    eventsToTrigger?: string[] = [];
    value?: string = null;
    general?: any = {};
}

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashflowServiceProxy, CashFlowForecastServiceProxy, CacheService, ClassificationServiceProxy, UserPreferencesService, BankAccountsServiceProxy, CellsCopyingService, CashflowService ]
})
export class CashflowComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    @ViewChild(DxDataGridComponent) cashFlowGrid: DxDataGridComponent;
    @ViewChild(OperationsComponent) operations: OperationsComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    @ViewChild(TransactionDetailInfoComponent) transactionInfo: TransactionDetailInfoComponent;
    transactionId: any;
    selectedBankAccounts;
    sliderReportPeriod = {
        start: null,
        end: null,
        minDate: moment().utc().subtract(10, 'year').year(),
        maxDate: moment().utc().add(10, 'year').year()
    };

    allowChangingForecast: boolean;
    showAllVisible = false;
    showAllDisable = false;
    private noRefreshedAfterSync: boolean;

    /** Config of header */
    headlineConfig: any;

    /** The tree of categories after first data loading */
    private categoryTree: GetCategoryTreeOutput;

    /** The main data for cashflow table */
    cashflowData = [];

    /** Years in cashflow */
    private allYears: number[] = [];

    /** Amount of years with stubs */
    private yearsAmount = 0;

    /** The string paths of cashflow data */
    private treePathes = {};

    cashflowTypes: any;

    /** Current group by period */
    private groupBy: 'year' | 'quarter' | 'month' = 'year';

    /** Bank accounts of user with extracted bank accounts */
    private bankAccounts: BankAccountDto[];
    private activeBankAccounts: BankAccountDto[];

    /** Source of the cashflow table (data fields descriptions and data) */
    dataSource;

    dragImg;

    /** Moment.js formats string for different periods */
    private momentFormats = {
        'year':     'Y',
        'quarter':  'Q',
        'month':    'M',
        'week':     'w',
        'day':      'D'
    };
    statsDetailFilter: StatsDetailFilter = new StatsDetailFilter();
    statsDetailResult: any;

    /** Whether stats details contains historical data */
    detailsContainsHistorical: 'always' | 'none' = 'none';

    currencySymbol = '$';

    private filterByChangeTimeout: any;

    /** Filter by string */
    private filterBy: string;

    private rowCellRightPadding = 10;

    private sparkLinesWidth = 64;

    private accountNumberWidth = 53;

    private _calculatorShowed = false;

    private expandBeforeIndex: number = null;

    public set calculatorShowed(value: boolean) {
        if (this._calculatorShowed = value) {
            //this.filtersService.fixed = false;
            //this.filtersService.disable();
        }
    }

    public get calculatorShowed(): boolean {
        return this._calculatorShowed;
    }

    /**
     *  Categorization settings for creating categorization tree on cashflow
     */
    private categorization: CategorizationModel[] = [
        {
            'prefix'                 : CategorizationPrefixes.CashflowType,
            'statsKeyName'           : 'cashflowTypeId',
            'namesSource'            : 'categoryTree.types',
            'childNamesSource'       : 'categoryTree.accountingTypes',
            'childReferenceProperty' : 'typeId'
        },
        {
            'prefix'                 : CategorizationPrefixes.AccountName,
            'statsKeyName'           : 'accountId',
            'namesSource'            : 'bankAccounts'
        },
        {
            'prefix'                 : CategorizationPrefixes.AccountingType,
            'statsKeyName'           : 'accountingTypeId',
            'namesSource'            : 'categoryTree.accountingTypes',
            'childNamesSource'       : 'categoryTree.categories',
            'childReferenceProperty' : 'accountingTypeId'
        },
        {
            'prefix'                 : CategorizationPrefixes.Category,
            'statsKeyName'           : 'categoryId',
            'namesSource'            : 'categoryTree.categories',
            'childNamesSource'       : 'categoryTree.categories',
            'childReferenceProperty' : 'parentId'
        },
        {
            'prefix'                 : CategorizationPrefixes.SubCategory,
            'statsKeyName'           : 'subCategoryId',
            'namesSource'            : 'categoryTree.categories'
        },
        {
            'prefix'                 : CategorizationPrefixes.TransactionDescriptor,
            'statsKeyName'           : 'transactionDescriptor'
        }
    ];

    /** posible groupIntervals year, quarter, month, dayofweek, day */
    private groupbyItems: IGroupbyItem[] = [
        {
            'groupInterval': 'year',
            'optionText': this.l('Years').toUpperCase()
        },
        {
            'groupInterval': 'quarter',
            'optionText': this.l('Quarters').toUpperCase(),
            'customizeTextFunction': this.getQuarterHeaderCustomizer
        },
        {
            'groupInterval': 'month',
            'optionText': this.l('Months').toUpperCase(),
            'customizeTextFunction': this.getMonthHeaderCustomizer
        }
    ];

    /** First categorization level items order */
    private leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
        NetChange,
        Reconciliation,
        Total
    ];

    /** Pivot grid fields settings */
    private apiTableFields: any = [
        {
            caption: 'Type',
            width: 120,
            area: 'row',
            expanded: false,
            allowExpandAll: false,
            allowExpand: false,
            sortOrder: 'asc',
            dataField: 'level0',
            rowHeaderLayout: 'tree',
            showTotals: true,
            sortingMethod: (firstItem, secondItem) => {
                return this.leftMenuOrder.indexOf(firstItem.value.slice(2)) > this.leftMenuOrder.indexOf(secondItem.value.slice(2));
            },
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Account Type',
            width: 120,
            area: 'row',
            dataField: 'level1',
            sortBy: 'displayText',
            sortOrder: 'asc',
            expanded: false,
            showTotals: true,
            resortable: true,
            customizeText: cellInfo => this.customizeFieldText.bind(this, cellInfo, this.l('Unclassified'))(),
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Category',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            dataField: 'level2',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Sub Category',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            dataField: 'level3',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Descriptor',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            dataField: 'level4',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Amount',
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: value => {
                return this.formatAsCurrencyWithLocale(value);
            },
            area: 'data',
            showColumnTotals: true,
            calculateSummaryValue: this.calculateSummaryValue(),
            summaryDisplayMode: 'percentOfColumnTotal'
        },
        {
            caption: 'Historical',
            area: 'column',
            areaIndex: 0,
            showTotals: false,
            selector: this.getYearHistoricalSelectorWithCurrent(),
            customizeText: this.getHistoricalCustomizer.bind(this)(),
            expanded: true,
            allowExpand: false,
            wordWrapEnabled: true,
            visible: true
        },
        {
            caption: 'Year',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            areaIndex: 1,
            groupInterval: 'year',
            showTotals: true,
            visible: true,
            summaryDisplayMode: 'percentVariation'
        },
        {
            caption: 'Quarter',
            dataField: 'date',
            dataType: 'date',
            width: 0.01,
            area: 'column',
            areaIndex: 2,
            groupInterval: 'quarter',
            showTotals: false,
            customizeText: this.getQuarterHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Month',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            width: 0.01,
            areaIndex: 3,
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Projected',
            area: 'column',
            showTotals: false,
            areaIndex: 4,
            selector: this.projectedSelector,
            customizeText: cellInfo => {
                let projectedKey;
                switch (cellInfo.value) {
                    case Projected.PastTotal:
                    case Projected.FutureTotal:    projectedKey = 'CashflowFields_Total'; break;
                    case Projected.Forecast:       projectedKey = 'CashflowFields_Projected'; break;
                    case Projected.Mtd:            projectedKey = 'CashflowFields_Mtd'; break;
                    case Projected.Today:          projectedKey = 'CashflowFields_Today'; break;
                }
                return this.l(projectedKey).toUpperCase();
            },
            expanded: false,
            allowExpand: false,
            visible: true
        },
        {
            caption: 'Week',
            area: 'column',
            width: 0.01,
            areaIndex: 5,
            showTotals: false,
            sortBy: 'displayText',
            selector: this.weekHeaderSelector,
            sortingMethod: this.weekSorting,
            customizeText: this.getWeekHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Day',
            dataField: 'date',
            dataType: 'date',
            areaIndex: 6,
            area: 'column',
            showTotals: false,
            groupInterval: 'day',
            visible: true
        }
    ];

    /** Language keys for historical field texts*/
    private historicalTextsKeys = [
        'Periods_Historical',
        'Periods_Current',
        'Periods_Forecast'
    ];

    /** Paths that should be clicked in onContentReady */
    private fieldPathsToClick = [];

    private forecastModelsObj: { items: any[], selectedItemIndex: number };

    private selectedForecastModel;

    private currencyId = 'USD';

    private preferenceCurrencyId = 'USD';

    /** @todo create model */
    private userPreferencesHandlers = {
        localizationAndCurrency: {
            applyTo: 'cells',
            preferences: {
                numberFormatting: {
                    areas: ['data'],
                    handleMethod: this.reformatCell
                }
            }
        },
        general: {
            applyTo: 'cells',
            preferences: {
                showAmountsWithDecimals : {
                    areas: ['data'],
                    handleMethod: this.showAmountsWithDecimals,
                },
                hideZeroValuesInCells: {
                    areas: ['data'],
                    handleMethod: this.hideZeroValuesInCells,
                },
                showNegativeValuesInRed: {
                    areas: ['data'],
                    handleMethod: this.showNegativeValuesInRed
                }
            }
        },
        visualPreferences: {
            applyTo: 'areas',
            preferences: {
                fontName: {
                    areas: ['data'],
                    handleMethod: this.addPreferenceClass
                },
                fontSize: {
                    areas: ['data'],
                    handleMethod: this.addPreferenceStyle
                },
                cfoTheme: {
                    areas: ['data', 'row', 'column'],
                    handleMethod: this.addPreferenceClass
                }
            }
        }
    };

    private cellTypesCheckMethods = {
        [GeneralScope.TransactionRows]: this.isTransactionRows,
        [GeneralScope.TotalRows]: this.isIncomeOrExpensesDataCell,
        [GeneralScope.BeginningBalances]: this.isStartingBalanceDataColumn,
        [GeneralScope.EndingBalances]: this.isAllTotalBalanceCell
    };

    cashflowGridSettings: CashFlowGridSettingsDto;

    private expandLevels: IExpandLevel[] = [
        {
            action: this.togglePivotGridRows.bind(this),
            text: this.l('Level 1'),
        }, {
            action: this.togglePivotGridRows.bind(this),
            text: this.l('Level 2'),
        }, {
            action: this.togglePivotGridRows.bind(this),
            text: this.l('Level 3'),
        }, {
            action: this.togglePivotGridRows.bind(this),
            text: this.l('All'),
        }, {
            action: this.togglePivotGridRows.bind(this),
            text: this.l('None'),
        }
    ];

    categoryToolbarConfig = [
        {
            location: 'center', items: [
                {
                    name: 'find',
                    action: (event) => {
                        event.event.stopPropagation();
                        event.event.preventDefault();
                        let toolbarElement = event.element.closest('.dx-area-description-cell');
                        if (!toolbarElement.querySelector('#findInputBlock')) {
                            let searchInputBlock = document.createElement('div');
                            searchInputBlock.id = 'findInputBlock';
                            searchInputBlock.innerHTML = '<div></div>';
                            let textBoxInstance = new TextBox(searchInputBlock.children[0], {
                                showClearButton: true,
                                mode: 'search',
                                onFocusOut: e => {
                                    searchInputBlock.style.display = 'none';
                                },
                                onInput: e => {
                                    clearTimeout(this.filterByChangeTimeout);
                                    this.filterByChangeTimeout = setTimeout(() => {
                                        this.cachedRowsFitsToFilter.clear();
                                        this.filterBy = e.element.querySelector('input').value;
                                        this.pivotGrid.instance.getDataSource().reload();
                                        this.pivotGrid.instance.updateDimensions();
                                    }, 300);
                                }
                            });
                            toolbarElement.appendChild(searchInputBlock);
                        } else {
                            toolbarElement.querySelector('#findInputBlock').style.display = '';
                        }
                        toolbarElement.querySelector('input').focus();
                        toolbarElement = null;
                    }
                },
                {
                    name: 'sort',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.l('Sort'),
                        items: [{
                            text: this.ls('Platform', 'SortBy', this.ls('CFO', 'Transactions_CashflowCategoryName')),
                            action: this.resortPivotGrid.bind(this, {
                                sortBy: 'displayText',
                                sortOrder: 'asc'
                            })
                        }, {
                            text: this.ls('Platform', 'SortBy', this.ls('CFO', 'Transactions_Amount')),
                            action: this.resortPivotGrid.bind(this, {
                                sortBySummaryField: 'amount',
                                sortBySummaryPath: [],
                                sortOrder: 'asc'
                            })
                        }]
                    }
                },
                {
                    name: 'expandTree',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.l('Expand'),
                        items: this.expandLevels
                    }
                }
            ]
        }
    ];

    footerToolbarConfig = [];

    private initialData: CashFlowInitialData;
    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;
    private requestFilter: StatsFilter;
    private anotherPeriodAccountsValues: Map<string, number> = new Map();
    private cachedColumnActivity: Map<string, boolean> = new Map();
    private cachedRowsFitsToFilter: Map<string, boolean> = new Map();

    /** List of cached sparklines of rows of type Sparkline */
    private cachedRowsSparkLines: Map<string, SparkLine> = new Map();

    /** Total amount of transactions */
    private transactionsTotal = 0;

    /** Amount of transactions */
    private transactionsAmount = 0;

    /** Avereage amount of all transcations */
    private transactionsAverage = 0;

    /** Marker that change its value after content is fully rendering on cashflow */
    private contentReady = false;

    private gridDataExists = false;

    /** List of adjustments on cashflow */
    private adjustmentsList = [];

    /** Text box for modifying of the cell*/
    private modifyingCellNumberBox: NumberBox;

    private functionButton: any;

    private saveButton: any;

    /** Cell input padding */
    private oldCellPadding: string;

    /** Detail of clicked cell from server */
    private clickedRowResult: CashFlowStatsDetailDto;

    /** Save the state of year headers */
    private quarterHeadersAreCollapsed = false;

    /** Save the state of year headers */
    private yearHeadersAreCollapsed = false;

    /** Selected cell on cashflow grid (dxPivotGridPivotGridCell) interface */
    private selectedCell;

    /** Cell to be copied (dxPivotGridPivotGridCell) interface */
    private copiedCell;

    /** Row pathes of the months that had been already expanded and we don't need to load the days again */
    private monthsDaysLoadedPathes = [];

    /** Key to cache the transaction details height */
    private cashflowDetailsGridSessionIdentifier = `cashflow_forecastModel_${abp.session.tenantId}_${abp.session.userId}`;

    /** If cashflow has some disperancy data */
    private hasDiscrepancyInData = false;

    /** Key for storing the state of the cashflow in local storage*/
    private stateStorageKey = `cashflow_state_storage_${abp.session.tenantId}_${abp.session.userId}`;

    /** Row paths list expanded by default */
    private rowDefaultExpandedPaths = [
        [PI],
        [PE]
    ];

    /** Columns paths list expanded by default */
    private columnDefaultExpandedPaths = [
        /** Expand current year */
        [Periods.Current, moment().year()],
        /** Expand all quarters of current year */
        [Periods.Current, moment().year(), 1],
        [Periods.Current, moment().year(), 2],
        [Periods.Current, moment().year(), 3],
        [Periods.Current, moment().year(), 4],
        /** Expand current month */
        [Periods.Current, moment().year(), moment().quarter(), moment().month() + 1],
    ];

    /** The width of the left pivot grid column (pixels) */
    private leftColumnWidth = 339;

    /** The height of the bottom toolbar (pixels) */
    private bottomToolbarHeight = 41;

    /** Tooltip instance to show adjustment info */
    private infoTooltip: Tooltip;

    /** Cashflow events descriptions */
    private cashflowEvents: IEventDescription[] = [
        {
            name: 'dragstart',
            handler: this.onDragStart.bind(this)
        },
        {
            name: 'dragend',
            handler: this.onDragEnd.bind(this)
        },
        {
            name: 'dragenter',
            handler: this.onDragEnter.bind(this)
        },
        {
            name: 'dragover',
            handler: this.onDragOver.bind(this)
        },
        {
            name: 'drop',
            handler: this.onDrop.bind(this)
        },
        {
            name: 'mouseover',
            handler: this.onMouseOver.bind(this),
            useCapture: true
        },
        {
            name: 'mouseout',
            handler: this.onMouseOut.bind(this),
            useCapture: true
        }
    ];

    /** Listener of keydown event */
    private keyDownEventHandler = this.keyDownListener.bind(this);

    /** Interval between state saving (ms) */
    public stateSavingTimeout = 1000;

    /** Whether the data started loading */
    public startDataLoading = false;

    /** Whether the loading of data was performed with filter */
    public filteredLoad = false;

    private modifyingNumberBoxCellObj: any;
    private modifyingNumberBoxStatsDetailFilter: any;

    private detailsModifyingNumberBoxCellObj: any;

    tabularFontName;

    constructor(injector: Injector,
                private _cashflowServiceProxy: CashflowServiceProxy,
                private _filtersService: FiltersService,
                private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
                private _cacheService: CacheService,
                private _classificationServiceProxy: ClassificationServiceProxy,
                private _bankAccountsServiceProxy: BankAccountsServiceProxy,
                public dialog: MatDialog,
                public userPreferencesService: UserPreferencesService,
                private _appService: AppService,
                private _calculatorService: CalculatorService,
                private _cellsCopyingService: CellsCopyingService,
                private cashflowService: CashflowService,
                private _bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(0);
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        this._calculatorService.subscribePeriodChange((value) => {
            this.onCalculatorValueChange(value);
        });
        /** Subscribe to copying events */
        this._cellsCopyingService.selectedCellsToCopyChange$.subscribe(data => {
            this.handleCellsSelecting(data);
        });
        this._cellsCopyingService.selectedCellsToCopyFinished$.subscribe(targetCells => {
            this.handleCellsCopying(this._cellsCopyingService.copiedCell, targetCells);
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = this.currencyId;
        this.requestFilter.groupByPeriod = StatsFilterGroupByPeriod.Monthly;
        /** Create parallel operations */
        let getCashFlowInitialDataObservable = this._cashflowServiceProxy.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId);
        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        let getCategoryTreeObservable = this._classificationServiceProxy.getCategoryTree(InstanceType[this.instanceType], this.instanceId, false);

        this.userPreferencesService.removeLocalModel();
        let getCashflowGridSettings = this._cashflowServiceProxy.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
        let getBankAccountsObservable = this._bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, this.currencyId);
        Observable.forkJoin(getCashFlowInitialDataObservable, getForecastModelsObservable, getCategoryTreeObservable, getCashflowGridSettings, getBankAccountsObservable)
            .subscribe(result => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(result[0], result[4]);

                /** Forecast models handling */
                this.handleForecastModelResult(result[1]);

                /** Handle the get categories response */
                this.handleGetCategoryTreeResult(result[2]);

                /** Handle the get cashflow grid settings response*/
                this.handleGetCashflowGridSettingsResult(result[3]);

                this.initFiltering();
            });

        this.initHeadlineConfig();

        /** Add event listeners for cashflow component (delegation for cashflow cells mostly) */
        this.addEvents(this.getElementRef().nativeElement, this.cashflowEvents);
        this.createDragImage();

        document.addEventListener('keydown', this.keyDownEventHandler, true);
    }

    createDragImage() {
        this.dragImg = new Image();
        this.dragImg.src = 'assets/common/icons/drag-icon.svg';
        this.dragImg.style.display = 'none';
        this.getElementRef().nativeElement.appendChild(this.dragImg);
    }

    /**
     * Override the native array push method for the cashflow that will add the total and netChange objects before pushing the income or expense objects
     */
    overrideCashflowDataPushMethod() {
        if (this.cashflowData.push) {
            this.cashflowData.push = cashflowItem => {
                if (cashflowItem.cashflowTypeId === Income || cashflowItem.cashflowTypeId === Expense) {
                    let totalObject = { ...cashflowItem };
                    totalObject.cashflowTypeId = Total;
                    [].push.call(this.cashflowData, this.addCategorizationLevels(totalObject));
                    if (this.cashflowGridSettings.general.showNetChangeRow) {
                        let netChangeObject = { ...cashflowItem };
                        netChangeObject.cashflowTypeId = NetChange;
                        [].push.call(this.cashflowData, this.addCategorizationLevels(netChangeObject));
                    }
                }

                this.anotherPeriodAccountsValues.clear();
                this.getUserPreferencesForCell.cache = {};
                return [].push.call(this.cashflowData, cashflowItem);
            };
        }
    }

    addEvents(element: HTMLElement, events: IEventDescription[]) {
        for (let event of events) {
            element.addEventListener(event.name, event.handler, event.useCapture);
        }
    }

    removeEvents(element: HTMLElement, events: IEventDescription[]) {
        for (let event of events) {
            element.removeEventListener(event.name, event.handler);
        }
    }

    customizeFieldText(cellInfo, emptyText = null): string | null {
        let text;
        if (cellInfo.value) {
            let [ key, prefix ] = [ cellInfo.value.slice(2), cellInfo.value.slice(0, 2) ];

            /** General text customizing handling */
            let namesSource = this.getNamesSourceLink(prefix);
                text = namesSource && namesSource[key] && namesSource[key]['name'] ?
                       namesSource[key]['name'] :
                       cellInfo.value;

            /** Text customizing for cashflow types */
            if (prefix === CategorizationPrefixes.CashflowType) {
                text = this.cashflowTypes[key];
                if (key === Income || key === Expense) {
                    text  = `${this.l('Total')} ${text}`;
                }
                text = text.toUpperCase();
            }

            /** Text customizing for accounts names */
            if (prefix === CategorizationPrefixes.AccountName) {
                let account = this.bankAccounts.find(account => account.id == key );
                text = account && account.accountName ? account.accountName : '';
            }

            /** Text customizing for transactions descriptor */
            if (prefix === CategorizationPrefixes.TransactionDescriptor) {
                text = key;
            }

        } else {
            return emptyText;
        }
        return text;
    }

    getNamesSourceLink(prefix: CategorizationPrefixes) {
        let category = this.getCategoryParams(prefix);
        return category && category['namesSource'] ? this.getDescendantPropValue(this, category.namesSource) : undefined;
    }

    getCategoryParams(prefix: CategorizationPrefixes) {
        return this.categorization.find(item => item.prefix === prefix);
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Cashflow_mainTitle')],
            onRefresh: this.refreshDataGrid.bind(this),
            iconSrc: 'assets/common/icons/chart-icon.svg'
        };
    }

    initFiltering() {
        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                if (filter.caption.toLowerCase() === 'date') {
                    this.monthsDaysLoadedPathes = [];
                    if (filter.items.from.value)
                        this.sliderReportPeriod.start = filter.items.from.value.getFullYear();
                    else
                        this.sliderReportPeriod.start = this.sliderReportPeriod.minDate;

                    if (filter.items.to.value)
                        this.sliderReportPeriod.end = filter.items.to.value.getFullYear();
                    else
                        this.sliderReportPeriod.end = this.sliderReportPeriod.maxDate;
                }
                if (filter.caption.toLowerCase() === 'account') {
                    this.selectedBankAccounts = filter.items.element.value;
                }

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }
            this.closeTransactionsDetail();
            this.filteredLoad = true;
            this.loadGridDataSource();
            this.operations.initToolbarConfig();
        });
        /** Repaint pivot grid after closing the filter modal */
        this._filtersService.subjectFilterDisable.subscribe(e => {
            setTimeout(
                this.repaintDataGrid.bind(this),
                1000
            );
        });
    }

    /**
     * Add the handling of the click on the date header cells in pivot grid
     */
    headerExpanderClickHandler = $event => {
        let clickedElement = $($event.target);
        if (clickedElement.closest('td').hasClass('dx-pivotgrid-expanded')) {

            let fieldPeriod = clickedElement.closest('td').hasClass('year') ? 'year' : 'quarter';
            let defaultClick = true;
            /** Click for decreasing the height of the header */
            if (
                !clickedElement.hasClass('closed-head-cell') &&
                !clickedElement.hasClass('totals') &&
                /** year or quarter values */
                !clickedElement.is('span')
            ) {
                $event.stopPropagation();
                defaultClick = false;
            }

            let cashflowComponent = this;
            clickedElement.closest('tr').children('.dx-pivotgrid-expanded').each(function() {
                let headCellExpandElement = $(this).find('div.head-cell-expand');
                headCellExpandElement.toggleClass('closed');
                cashflowComponent[`${fieldPeriod}HeadersAreCollapsed`] = headCellExpandElement.hasClass('closed') || defaultClick;
            });
            this.synchronizeHeaderHeightWithCashflow();
        }
        clickedElement = null;
    }

    /**
     * Handle the subscription result from getInitialData Observable
     * @param initialDataResult
     */
    handleCashFlowInitialResult(initialDataResult, bankAccounts) {
        this.initialData = initialDataResult;
        this.cashflowTypes = this.initialData.cashflowTypes;
        this.addCashflowType(Total, this.l('Ending Cash Balance'));
        this.addCashflowType(NetChange, this.l('Net Change'));
        this.bankAccounts = this.initialData.banks.map(x => x.bankAccounts).reduce((x, y) => x.concat(y), []);
        this.activeBankAccounts = this.bankAccounts.filter(b => b.isActive);
        this.createFilters(initialDataResult, bankAccounts);
        this.setupFilters(this.filters);
    }

    createFilters(initialData, bankAccounts) {
        this.filters = [
            new FilterModel({
                field: 'accountIds',
                component: BankAccountFilterComponent,
                caption: 'Account',
                items: {
                    element: new BankAccountFilterModel(
                        {
                            dataSource: bankAccounts,
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                }
            }),
            new FilterModel({
                component: FilterCalendarComponent,
                caption: 'Date',
                items: {from: new FilterItemModel(), to: new FilterItemModel()},
                options: {
                    allowFutureDates: true,
                    endDate: moment(new Date()).add(10, 'years').toDate()
                }
            }),
            new FilterModel({
                component: FilterCheckBoxesComponent,
                field: 'businessEntityIds',
                caption: 'BusinessEntity',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource: initialData.businessEntities,
                        nameField: 'name',
                        keyExpr: 'id'
                    })
                }
            })
        ];
    }

    setupFilters(filters) {
        this._filtersService.setup(filters);
    }

    /**
     * Handle forecast models result
     * @param forecastModelsResult
     */
    handleForecastModelResult(forecastModelsResult) {
        let items = forecastModelsResult.map(forecastModelItem => {
            return {
                id: forecastModelItem.id,
                text: forecastModelItem.name
            };
        });
        /** If we have the forecast model in cache - get it there, else - get the first model */
        let cachedForecastModel = this.getForecastModel();
        /** If we have cached forecast model and cached forecast exists in items list - then use it **/
        this.selectedForecastModel = cachedForecastModel && items.findIndex(item => item.id === cachedForecastModel.id) !== -1 ?
            cachedForecastModel :
            items[0];
        let selectedForecastModelIndex = items.findIndex(item => item.id === this.selectedForecastModel.id);
        this.forecastModelsObj = {
            items: items,
            selectedItemIndex: selectedForecastModelIndex
        };
    }

    initFooterToolbar() {
        this.footerToolbarConfig = [
            {
                location: 'before',
                items: [
                    {
                        name: 'amount',
                        text: '1 of 9'
                    },
                    {
                        name: 'forecastModels',
                        widget: 'dxTabs',
                        options: {
                            items: this.forecastModelsObj.items,
                            selectedIndex: this.forecastModelsObj.selectedItemIndex,
                            accessKey: 'cashflowForecastSwitcher',
                            onItemClick: (e) => {
                                this.handleDoubleSingleClick(e, this.changeSelectedForecastModel.bind(this), this.handleForecastModelDoubleClick.bind(this));
                            }
                        }
                    },
                    {
                        name: 'forecastModelAdd',
                        action: this.showForecastAddingInput.bind(this)
                    }
                ]
            },
            {
                location: 'after',
                items: [
                    {
                        name: 'total',
                        html: `${this.ls('Platform', 'Total')} : <span class="value">${this.transactionsTotal.toLocaleString('en-EN', {style: 'currency',  currency: 'USD' })}</span>`
                    },
                    {
                        name: 'count',
                        html: `${this.l('Cashflow_BottomToolbarCount')} : <span class="value">${this.transactionsAmount}</span>`
                    },
                    {
                        name: 'average',
                        html: `${this.l('Cashflow_BottomToolbarAverage')} : <span class="value">${this.transactionsAverage.toLocaleString('en-EN', {style: 'currency',  currency: 'USD' })}</span>`
                    },
                    {
                        action: this.hideFooterBar.bind(this),
                        options: {
                            icon: 'assets/common/icons/close.svg'
                        }
                    }
                ]
            }
        ];
    }

    handleDoubleSingleClick(e, singleClickHandler = null, doubleClickHandler = null) {
        let component = e.component;
        component.prevent = false;
        if (!component.clickCount) component.clickCount = 1;
        else component.clickCount += 1;
        if (component.clickCount === 1) {
            component.lastClickTime = new Date();
            component.timer = setTimeout(function () {
                if (!component.prevent) {
                    if (singleClickHandler && typeof singleClickHandler === 'function') {
                        singleClickHandler(e);
                    }
                }
                component.lastClickTime = 0;
                component.clickCount = 0;
                component.prevent = false;
            }, 350);
        } else if (component.clickCount === 2) {
            clearTimeout(component.timer);
            component.prevent = true;
            if (((+new Date()) - component.lastClickTime) < 300) {
                if (doubleClickHandler && typeof doubleClickHandler === 'function') {
                    doubleClickHandler(e);
                }
            }
            component.clickCount = 0;
            component.lastClickTime = 0;
        }
    }

    /** @todo refactor change for the TextBox component */
    handleForecastModelDoubleClick(e) {
        let editElement = document.createElement('div');
        editElement.className = 'editModel';
        editElement.innerHTML = `<input value="${e.itemData.text}">`;
        e.itemElement.appendChild(editElement);
        let cashflowComponent = this;
        editElement.addEventListener('focusout', function() {
            let newName = this.querySelector('input').value;
            /** Rename forecast model if the name changed */
            if (e.itemData.text !== newName) {
                cashflowComponent.renameForecastModel({
                    id: e.itemData.id,
                    newName: newName
                }).subscribe(result => {
                    e.itemElement.querySelector('.dx-tab-text').innerText = newName;
                    cashflowComponent.forecastModelsObj.items[e.itemIndex].text = newName;
                }, error => {
                    console.log('unable to rename forecast model');
                });
            }
            this.remove();
        });
        editElement = null;
    }

    addForecastModel(modelName) {
        return this._cashFlowForecastServiceProxy.createForecastModel(
            InstanceType17[this.instanceType],
            this.instanceId,
            modelName
        );
    }

    renameForecastModel(modelData) {
        return this._cashFlowForecastServiceProxy.renameForecastModel(
            InstanceType18[this.instanceType],
            this.instanceId,
            modelData
        );
    }

    /** @todo continue implementing in other task */
    showForecastAddingInput(e) {
        let inputBlockElement = document.createElement('div');
        inputBlockElement.className = 'addModel';
        inputBlockElement.innerHTML = '<input value=""></div>';
        let thisComponent = this;
        inputBlockElement.addEventListener('focusout', function() {
            let modelName = this.querySelector('input').value;
            /** Add forecast model */
            if (modelName) {
                let createForecastModelInput: CreateForecastModelInput = CreateForecastModelInput.fromJS({ name: modelName });
                thisComponent.addForecastModel(createForecastModelInput)
                .subscribe(
                    result => {},
                    error => { console.log('unable to add forecast model'); }
                );
            }
            $(this).remove();
        });
        e.element.appendChild(inputBlockElement);
        inputBlockElement = null;
    }

    /**
     * Handle get categories result
     * @param getCategoriesResult
     */
    handleGetCategoryTreeResult(getCategoriesResult) {
        this.categoryTree = getCategoriesResult;
        /** Add starting balance, ending balance, netchange and balance discrepancy */
        for (let type in this.cashflowTypes) {
            if (!this.categoryTree.types.hasOwnProperty(type)) {
                this.categoryTree.types[type] = <any>{ name: this.cashflowTypes[type]};
            }
        }
    }

    /**
     * Handle getCashflow grid settings result
     * @param cashflowSettingsResult
     */
    handleGetCashflowGridSettingsResult(cashflowSettingsResult) {
        this.cashflowGridSettings = cashflowSettingsResult;

        let getCurrency = (777).toLocaleString('en-EN', {style: 'currency', currency: this.cashflowGridSettings.localizationAndCurrency.currency});
        this.preferenceCurrencyId = getCurrency.indexOf('$') < 0 && getCurrency.indexOf('SGD') < 0 ? this.cashflowGridSettings.localizationAndCurrency.currency : 'USD';
        this.currencySymbol = (777).toLocaleString('en-EN', { style: 'currency', currency: this.preferenceCurrencyId}).substr(0, 1);

        this.applySplitMonthIntoSetting(this.cashflowGridSettings.general.splitMonthType);
        this.tabularFontName = this.userPreferencesService.getClassNameFromPreference({
            sourceName: 'fontName',
            sourceValue: this.cashflowGridSettings.visualPreferences.fontName
        });
        const thousandsSeparator = this.cashflowGridSettings.localizationAndCurrency.numberFormatting.indexOf('.') == 3 ? '.' : ',';
        /** Changed thousands and decimal separators */
        config({
            thousandsSeparator: thousandsSeparator,
            decimalSeparator: thousandsSeparator === '.' ? ',' : '.'
        });
    }

    applySplitMonthIntoSetting(splitMonthType: CashflowGridGeneralSettingsDtoSplitMonthType) {
        let showWeeks = splitMonthType === CashflowGridGeneralSettingsDtoSplitMonthType.Weeks;
        let weekField = this.apiTableFields.find(field => field.caption === 'Week');
        let projectedField = this.apiTableFields.find(field => field.caption === 'Projected');
        weekField.visible = showWeeks;
        projectedField.visible = !showWeeks;
    }

    /**
     * Get forecast model from the cache
     */
    getForecastModel() {
        return this._cacheService.exists(`cashflow_forecastModel_${abp.session.userId}`) ?
               this._cacheService.get(`cashflow_forecastModel_${abp.session.userId}`) :
               null;
    }

    /**
     * Change the forecast model to reuse later
     * @param modelObj - new forecast model
     */
    changeSelectedForecastModel(modelObj) {
        if (modelObj.itemIndex !== this.forecastModelsObj.selectedItemIndex &&
            !modelObj.element.find('.editModel').length) {
            this.selectedForecastModel = modelObj.itemData;
            this.forecastModelsObj.selectedItemIndex = modelObj.itemIndex;
            this._cacheService.set(`cashflow_forecastModel_${abp.session.userId}`, this.selectedForecastModel);
            this.loadGridDataSource();
        }
    }

    getFullscreenElement() {
        return document.documentElement; //!!VP To avoid dropdown elements issue in fullscreen mode
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.localizationSourceName
            = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        /** Remove cashflow events handlers */
        this.removeEvents(this.getElementRef().nativeElement, this.cashflowEvents);
        this._appService.toolbarIsHidden = false;

        document.removeEventListener('keydown', this.keyDownEventHandler);
        super.ngOnDestroy();
    }

    loadGridDataSource(period: StatsFilterGroupByPeriod = StatsFilterGroupByPeriod.Monthly, completeCallback = null) {
        this.startLoading();
        this.requestFilter.forecastModelId = this.selectedForecastModel.id;
        this.requestFilter.groupByPeriod = period;
        if (period === StatsFilterGroupByPeriod.Monthly) {
            this.requestFilter.dailyPeriods = this.getDailyPeriods();
        }

        /** Clear cache of tree paths */
        this.treePathes = {};

        /** Clear cache for rows sparklines */
        this.cachedRowsSparkLines.forEach(sparkLine => {
            sparkLine.dispose();
        });
        this.cachedRowsSparkLines.clear();
        this._cashflowServiceProxy.getStats(InstanceType[this.instanceType], this.instanceId, this.requestFilter)
            .pluck('transactionStats')
            .subscribe(transactions => {
                this.startDataLoading = true;
                this.handleCashflowData(transactions, period);
                /** override cashflow data push method to add totals and net change automatically after adding of cashflow */
                this.overrideCashflowDataPushMethod();
            },
            e => {},
            () => {
                if (!this.gridDataExists && (!this.cashflowData || !this.cashflowData.length)) {
                    this._appService.toolbarIsHidden = true;
                } else {
                    this.gridDataExists = true;
                    this._appService.toolbarIsHidden = false;
                    this.dataSource = this.getApiDataSource();

                    /** Init footer toolbar with the gathered data from the previous requests */
                    this.initFooterToolbar();
                }
                if (completeCallback) {
                    completeCallback.call(this);
                }

                this.finishLoading();
            });
    }

    handleCashflowData(transactions, period = StatsFilterGroupByPeriod.Monthly) {
        if (transactions && transactions.length) {
            /** categories - object with categories */
            this.cashflowData = this.getCashflowDataFromTransactions(transactions);
            /** Make a copy of cashflow data to display it in custom total group on the top level */
            let stubCashflowDataForEndingCashPosition = this.getStubCashflowDataForEndingCashPosition(this.cashflowData);
            let stubCashflowDataForAllDays = this.getStubCashflowDataForAllPeriods(this.cashflowData, period);
            let cashflowWithStubForEndingPosition = this.cashflowData.concat(stubCashflowDataForEndingCashPosition);
            let stubCashflowDataForAccounts = this.getStubCashflowDataForAccounts(cashflowWithStubForEndingPosition);

            /** concat initial data and stubs from the different hacks */
            this.cashflowData = cashflowWithStubForEndingPosition.concat(
                stubCashflowDataForAccounts,
                stubCashflowDataForAllDays
            );

            let start = underscore.min(this.cashflowData, function (val) { return val.date; }).date.year();
            let end = underscore.max(this.cashflowData, function (val) { return val.date; }).date.year();
            this.setSliderReportPeriodFilterData(start, end);
        } else {
            this.cashflowData = [];
        }
    }

    handleDailyCashflowData(transactions, startDate, endDate) {

        /** Remove old month transactions */
        if (this.cashflowData && this.cashflowData.length) {
            this.cashflowData.slice().forEach(item => {
                if (item.initialDate.format('MM.YYYY') === startDate.format('MM.YYYY') &&
                    item.adjustmentStartingBalanceTotal !== TransactionStatsDtoAdjustmentType._2) {
                    this.cashflowData.splice(this.cashflowData.indexOf(item), 1);
                }
            });
        }

        if (this.adjustmentsList && this.adjustmentsList.length) {
            this.adjustmentsList.slice().forEach(item => {
                if (item.initialDate.format('MM.YYYY') === startDate.format('MM.YYYY') &&
                    item.adjustmentStartingBalanceTotal !== TransactionStatsDtoAdjustmentType._2) {
                    this.adjustmentsList.splice(this.cashflowData.indexOf(item), 1);
                }
            });
        }

        transactions = this.getCashflowDataFromTransactions(transactions, false);
        let existingPeriods = [];
        transactions.forEach(transaction => {
            /** Move the year to the years array if it is unique */
            let formattedDate = transaction.initialDate.format('YYYY-MM-DD');
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
        });
        let accountId: number = transactions[0] ? +transactions[0].accountId : this.bankAccounts[0].id;
        let stubCashflowDataForAllDays = this.createStubsForPeriod(startDate, endDate, StatsFilterGroupByPeriod.Daily, accountId, existingPeriods);
        let stubCashflowDataForAccounts = this.getStubCashflowDataForAccounts(transactions);

        /** concat initial data and stubs from the different hacks */
        transactions = transactions.concat(
            stubCashflowDataForAccounts,
            stubCashflowDataForAllDays
        );

        /** Simple arrays concat doesn't work with reload, so forEach is used*/
        transactions.forEach(transaction => {
            this.cashflowData.push(transaction);
        });
    }

    /**
     * Get the array of stub cashflow data to add stub empty columns for cashflow
     * @param {TransactionStatsDto[]} transactions
     */
    getStubCashflowDataForAccounts(transactions) {
        let stubCashflowDataForAccounts = [],
            allAccountsIds: number[] = [],
            currentAccountsIds = {
                [StartedBalance]: [],
                [Total]: []
            },
            firstDate, firstInitialDate;
        if (this.hasDiscrepancyInData)
            currentAccountsIds[Reconciliation] = [];

        transactions.forEach(transaction => {
            /** get the first real date for stub data */
            if (!firstDate && transaction.date) {
                firstDate = transaction.date;
            }
            if (!firstInitialDate && transaction.initialDate) {
                firstInitialDate = transaction.initialDate;
            }
            if (allAccountsIds.indexOf(transaction.accountId) === -1) {
                allAccountsIds.push(transaction.accountId);
            }
            /** find current accounts ids for started balances, totals and reconciliations */
            for (let cashflowType in currentAccountsIds) {
                if (transaction.cashflowTypeId === cashflowType &&
                    currentAccountsIds[cashflowType].indexOf(transaction.accountId) === -1) {
                    currentAccountsIds[cashflowType].push(transaction.accountId);
                }
            }
        });

        /** for all accounts that are absent add stub empty transactions to show
         *  the empty accounts anyway */
        allAccountsIds.filter(accountId => accountId).forEach(accountId => {
            for (let cashflowType in currentAccountsIds) {
                if (currentAccountsIds[cashflowType].indexOf(accountId) === -1) {
                    stubCashflowDataForAccounts.push(
                        this.createStubTransaction({
                            'cashflowTypeId': cashflowType,
                            'date': firstDate,
                            'initialDate': firstInitialDate,
                            'accountId': accountId
                        })
                    );
                }
            }
        });
        return stubCashflowDataForAccounts;
    }

    /**
     * Return the stub transaction
     * @param stubObj - the object with own custom data for stub transaction
     * @return {TransactionStatsDto & any}
     */
    createStubTransaction(stubObj, path = []) {
        let stubTransaction = {
            'adjustmentType': null,
            'accountId': null,
            'currencyId': this.currencyId,
            'amount': 0,
            'comment': null,
            'date': null,
            'initialDate': null,
            'forecastId': null,
            'isStub': true
        };
        if (path && path.length) {
            path.forEach(pathItem => {
                if (pathItem) {
                    let [ key, prefix ] = [ pathItem.slice(2), pathItem.slice(0, 2) ];
                    let categoryParams = this.getCategoryParams(prefix);
                    stubTransaction[categoryParams['statsKeyName']] = key;
                }
            });
        }
        return this.addCategorizationLevels({ ...stubTransaction, ...stubObj });
    }

    /**
     * Get the cashflow data from the transactions from the server
     * @param {TransactionStatsDto[]} cashflowData
     * @return {TransactionStatsDto[]}
     */
    /** @todo refactor */
    getCashflowDataFromTransactions(transactions, reset = true) {
        if (reset) {
            this.transactionsAmount = 0;
            this.transactionsTotal = 0;
            this.transactionsAverage = 0;
            this.adjustmentsList = [];
            this.hasDiscrepancyInData = false;
        }

        const data = transactions.reduce((result, transactionObj) => {
            if (!this.hasDiscrepancyInData && transactionObj.cashflowTypeId == Reconciliation)
                this.hasDiscrepancyInData = true;
            transactionObj.categorization = {};
            transactionObj.date.utc();
            transactionObj.initialDate = moment(transactionObj.date);
            transactionObj.date.add(transactionObj.date.toDate().getTimezoneOffset(), 'minutes');
            let isAccountTransaction = transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation;
            /** change the second level for started balance and reconciliations for the account id */
            if (isAccountTransaction) {
                /** @todo Remove adjustment list for the months and create another for days */
                if (transactionObj.cashflowTypeId === StartedBalance) {
                    this.adjustmentsList.push({...transactionObj});
                    transactionObj.cashflowTypeId = Total;
                }
            } else {
                /** @todo change reset for some normal prop */
                if (!transactionObj.forecastId && reset) {
                    this.transactionsTotal += transactionObj.amount;
                    this.transactionsAmount = this.transactionsAmount + transactionObj.count;
                }
            }
            this.addCategorizationLevels(transactionObj);
            result.push(transactionObj);
            return result;
        }, []);

        this.transactionsTotal = +this.transactionsTotal.toFixed(2);
        this.transactionsAverage = this.transactionsAmount ? +(this.transactionsTotal / this.transactionsAmount).toFixed(2) : 0;

        return data;
    }

    addCategorizationLevels(transactionObj) {
        /** Add group and categories numbers to the categorization list and show the names in
         *  customize functions by finding the names with ids
         */
        let levelNumber = 0;
        let isAccountTransaction = transactionObj.cashflowTypeId === StartedBalance ||
                                   transactionObj.cashflowTypeId === Total ||
                                   transactionObj.cashflowTypeId === Reconciliation ||
                                   transactionObj.cashflowTypeId === NetChange;
        let key, parentKey = null;
        if (transactionObj[`level${levelNumber}`]) {
            for (let i = levelNumber; i < 5; i++) {
                if (transactionObj[`level${i}`]) {
                    delete transactionObj[`level${i}`];
                }
            }
        }
        this.categorization.every((level) => {
            if (transactionObj[level.statsKeyName]) {

                /** If user doens't want to show accounting type row - skip it */
                if (level.prefix === CategorizationPrefixes.AccountingType && !this.cashflowGridSettings.general.showAccountingTypeRow) {
                    return true;
                }

                /** Create categories levels properties */
                if (level.prefix === CategorizationPrefixes.AccountName) {
                    if (isAccountTransaction) {
                        key = level.prefix + transactionObj[level.statsKeyName];
                        transactionObj[`level${levelNumber++}`] = key;
                        return false;
                    } else {
                        return true;
                    }
                }

                key = level.prefix + transactionObj[level.statsKeyName];
                transactionObj[`level${levelNumber++}`] = key;
            }
            return true;
        });
        this.updateTreePathes(transactionObj);
        return transactionObj;
    }

    /**
     * Update pathes for the filtering
     * @param transactionObj
     */
    updateTreePathes(transactionObj, removePath = false) {
        let fullPath = [];
        for (let i = 0; i < 5; i++) {
            let levelValue = transactionObj[`level${i}`];
            if (levelValue || i === 1) {
                fullPath.push(levelValue);
            }
        }

        let stringPath = fullPath.join(',');
        if (!this.treePathes.hasOwnProperty(stringPath)) {
            this.treePathes[stringPath] = 1;
        } else {
            if (removePath) {
                this.treePathes[stringPath]--;
                if (!this.treePathes[stringPath])
                    delete this.treePathes[stringPath];
            } else {
                this.treePathes[stringPath]++;
            }
        }
    }

    /**
     * Build the nested object from array as the properties
     * @param base - the object to create
     * @param names - the array with nested keys
     */
    updateNestedObject(base, names) {
        for (let i = 0; i < names.length; i++ ) {
            base = base[ names[i] ] = base[ names[i] ] || {};
        }
    }

    /**
     * Add the new cashflow type by the hand
     * @param key
     * @param value
     */
    addCashflowType(key, value) {
        this.cashflowTypes[key] = value;
    }

    /**
     * Get the Income and Expense transactions, clone and change the cashflowTypeId to total
     * (hack to show ending balances with the ability to expand them into accounts)
     * @param {TransactionStatsDto[]} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getStubCashflowDataForEndingCashPosition(cashflowData) {
        let stubCashflowDataForEndingCashPosition = [];
        cashflowData.forEach(cashflowDataItem => {
            /** clone transaction to another array */
            if (cashflowDataItem.cashflowTypeId === Income || cashflowDataItem.cashflowTypeId === Expense) {
                let clonedTransaction = this.createStubTransaction({
                    'cashflowTypeId': Total,
                    'amount': cashflowDataItem.amount,
                    'forecastId': cashflowDataItem.forecastId,
                    'accountId': cashflowDataItem.accountId,
                    'date': cashflowDataItem.date,
                    'initialDate': cashflowDataItem.initialDate
                });
                stubCashflowDataForEndingCashPosition.push(clonedTransaction);

                /** add net change row if user choose preference */
                if (this.cashflowGridSettings.general.showNetChangeRow) {
                    stubCashflowDataForEndingCashPosition.push(
                        this.createStubTransaction({
                            'cashflowTypeId': NetChange,
                            'amount': cashflowDataItem.amount,
                            'accountId': cashflowDataItem.accountId,
                            'date': cashflowDataItem.date,
                            'forecastId': cashflowDataItem.forecastId,
                            'initialDate': cashflowDataItem.initialDate
                        })
                    );
                }
            }
        });
        return stubCashflowDataForEndingCashPosition;
    }

    getStubForNetChange(cashflowData: TransactionStatsDto[]) {
        let stubCashflowDataForEndingCashPosition: TransactionStatsDto[] = [];
        if (!cashflowData.some(item => item.cashflowTypeId === NetChange)) {
            cashflowData.forEach(cashflowDataItem => {
                if (cashflowDataItem.cashflowTypeId === Income || cashflowDataItem.cashflowTypeId === Expense) {
                    /** add net change row if user choose preference */
                    if (this.cashflowGridSettings.general.showNetChangeRow) {
                        stubCashflowDataForEndingCashPosition.push(
                            this.createStubTransaction({
                                'cashflowTypeId': NetChange,
                                'expenseCategoryId': null,
                                'amount': cashflowDataItem.amount,
                                'accountId': cashflowDataItem.accountId,
                                'date': cashflowDataItem.date
                            })
                        );
                    }
                }
            });
        }
        return stubCashflowDataForEndingCashPosition;
    }

    /**
     * for every day that is absent in cashflow data add stub object
     * (hack to show all days, months and quarters for all years in cashflow data page)
     * @param {TransactionStatsDtoExtended[]} cashflowData
     * @return {TransactionStatsDtoExtended[]}
     */
    getStubCashflowDataForAllPeriods(cashflowData: TransactionStatsDtoExtended[], period = StatsFilterGroupByPeriod.Monthly) {
        this.allYears = [];
        this.yearsAmount = 0;
        let existingPeriods: string[] = [],
            minDate: moment.Moment,
            maxDate: moment.Moment,
            periodFormat = period === StatsFilterGroupByPeriod.Monthly ? 'YYYY-MM' : 'YYYY-MM-DD';

        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let date = cashflowItem.initialDate;
            let transactionYear = date.year();
            let formattedDate = date.utc().format(periodFormat);
            if (this.allYears.indexOf(transactionYear) === -1) this.allYears.push(transactionYear);
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
            if (!minDate || cashflowItem.date < minDate)
                minDate = moment(date);
            if (!maxDate || cashflowItem.date > maxDate)
                maxDate = moment(date);
        });
        this.allYears = this.allYears.sort();
        let stubsInterval = this.getStubsInterval(minDate, maxDate, existingPeriods, periodFormat);
        this.yearsAmount = stubsInterval.endDate.diff(stubsInterval.startDate, 'years') + 1;

        /** cycle from started date to ended date */
        /** added fake data for each date that is not already exists in cashflow data */
        let accountId = cashflowData[0] ? cashflowData[0].accountId : this.bankAccounts[0].id;
        let stubCashflowData = this.createStubsForPeriod(stubsInterval.startDate, stubsInterval.endDate, period, accountId, existingPeriods);
        if (this.requestFilter.dailyPeriods.length) {
            this.requestFilter.dailyPeriods.forEach(dailyPeriod => {
                let filterStart = this.requestFilter.startDate ? moment(this.requestFilter.startDate) : null;
                let filterEnd = this.requestFilter.endDate ? moment(this.requestFilter.endDate) : null;
                let start = filterStart && dailyPeriod.start.isBefore(filterStart) ? filterStart : dailyPeriod.start.utc();
                let end = filterEnd && dailyPeriod.end.isAfter(filterEnd) ? filterEnd : dailyPeriod.end.utc();
                let dailyStubs = this.createStubsForPeriod(start, end, StatsFilterGroupByPeriod.Daily, accountId, []);
                stubCashflowData = stubCashflowData.concat(dailyStubs);
            });
        }

        return stubCashflowData;
    }

    /**
     * Return stubs intervals
     * @param {moment.Moment} minDate
     * @param {moment.Moment} maxDate
     * @param {string[]} existingPeriods
     * @param {string} periodFormat
     * @return {{startDate: Moment.moment; endDate: Moment.moment}}
     */
    getStubsInterval(minDate: moment.Moment, maxDate: moment.Moment, existingPeriods: string[], periodFormat: string): { startDate: moment.Moment, endDate: moment.Moment } {

        let currentDate = this.cashflowService.getUtcCurrentDate();
        let filterStart = this.requestFilter.startDate;
        let filterEnd = this.requestFilter.endDate;

        /** If current date is not in existing - set min or max date as current */
        if (existingPeriods.indexOf(currentDate.format(periodFormat)) === -1) {
            if (currentDate.format(periodFormat) < minDate.format(periodFormat)) {
                minDate = currentDate;
                /** if endDate from filter */
            } else if (currentDate.format(periodFormat) > maxDate.format(periodFormat) &&
                (!filterEnd || (filterEnd && currentDate.isBefore(moment(filterEnd).utc())))
            ) {
                maxDate = currentDate;
            }
        }

        /** set max date to the end of year if current maxDate year is current year */
        if (maxDate.year() === currentDate.year()) {
            let endOfYear = maxDate.clone().endOf('year');
            if (!filterEnd || (filterEnd && endOfYear.isBefore(moment(filterEnd).utc()))) {
                maxDate = endOfYear;
            }
        }

        /** consider the filter */
        if (filterStart && (!minDate || moment(filterStart).utc().isAfter(minDate))) minDate = filterStart;
        if (filterEnd && (!maxDate || moment(filterEnd).utc().isAfter(maxDate))) maxDate = filterEnd;

        return { startDate: moment.utc(minDate), endDate: moment.utc(maxDate) };
    }

    createStubsForPeriod(startDate, endDate, groupingPeriod: StatsFilterGroupByPeriod, bankAccountId, existingPeriods = []): TransactionStatsDtoExtended[] {
        let stubs = [];
        let startDateCopy = moment(startDate),
            endDateCopy = moment(endDate),
            period: any = groupingPeriod === StatsFilterGroupByPeriod.Monthly ? 'month' : 'day',
            format = period === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        while (startDateCopy.isSameOrBefore(endDateCopy)) {
            let date = moment.tz(startDateCopy.format(format), format, 'utc');
            if (existingPeriods.indexOf(date.format(format)) === -1) {
                stubs.push(
                    this.createStubTransaction({
                        'cashflowTypeId': StartedBalance,
                        'accountId': bankAccountId,
                        'date': moment(date).add(date.toDate().getTimezoneOffset(), 'minutes'),
                        'initialDate': date
                    })
                );
            }
            startDateCopy.add(1, period);
        }
        return stubs;
    }

    /** @todo move to some helper */
    getDescendantPropValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    showRefreshButton() {
        this.noRefreshedAfterSync = true;
        this.initHeadlineConfig();
    }

    refreshDataGrid() {
        this.noRefreshedAfterSync = false;
        this.getUserPreferencesForCell.cache = {};
        this.getCellOptionsFromCell.cache = {};
        this.getNewTextWidth.cache = {};
        this.monthsDaysLoadedPathes = [];
        this.anotherPeriodAccountsValues.clear();
        this.operations.bankAccountSelector.getBankAccounts(true);
        this.initHeadlineConfig();
    }

    repaintDataGrid() {
        if (this.pivotGrid) {
            let pivotGridInstance = <any>this.pivotGrid.instance;
            if (this.pivotGrid.instance && pivotGridInstance.$element().children().length) {
                this.pivotGrid.instance.updateDimensions();
            }
        }
    }

    refreshDataGridWithPreferences(options) {
        let preferencesObservable, notificationMessage;
        const dataSource = this.pivotGrid.instance.getDataSource();
        /** If just apply - then get from the options */
        if (options && options.apply && options.model) {
            let model = new CashFlowGridSettingsDto(options.model);
            model.init(options.model);
            preferencesObservable = Observable.from([options.model]);
            notificationMessage = this.l('AppliedSuccessfully');
        /** If settings were saved - get them from the api */
        } else {
            preferencesObservable = this._cashflowServiceProxy.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
            notificationMessage = this.l('SavedSuccessfully');
        }
        preferencesObservable.subscribe((result: CashFlowGridSettingsDto) => {
            const updateWithNetChange = result.general.showNetChangeRow !== this.cashflowGridSettings.general.showNetChangeRow;
            const updateAfterAccountingTypeShowingChange = result.general.showAccountingTypeRow !== this.cashflowGridSettings.general.showAccountingTypeRow;
            const updateWithDiscrepancyChange = result.general.showBalanceDiscrepancy !== this.cashflowGridSettings.general.showBalanceDiscrepancy;
            const updateMonthSplitting = result.general.splitMonthType !== this.cashflowGridSettings.general.splitMonthType;
            this.handleGetCashflowGridSettingsResult(result);
            this.closeTransactionsDetail();
            this.startLoading();

            /** @todo refactor - move to the showNetChangeRow and call here all
             *  appliedTo data methods before reloading the cashflow
             */

            /** Clear user preferences cache */
            this.getUserPreferencesForCell.cache = {};
            if (updateMonthSplitting) {
                let showWeeks = result.general.splitMonthType === CashflowGridGeneralSettingsDtoSplitMonthType.Weeks;
                /** Changed showing of week and projected fields */
                dataSource.field('Projected', { visible: !showWeeks, expanded: !showWeeks });
                dataSource.field('Week', { visible: showWeeks });
            }

            /** @todo move to the userPreferencesHandlers to avoid if else structure */
            if (updateWithDiscrepancyChange) {
                dataSource.reload();
            }
            if (!updateWithNetChange && !updateAfterAccountingTypeShowingChange && !updateWithDiscrepancyChange && !updateMonthSplitting) {
                this.pivotGrid.instance.repaint();
            } else {
                if (!updateWithNetChange && !updateAfterAccountingTypeShowingChange) {
                    dataSource.reload();
                } else {
                    if (updateWithNetChange) {
                        /** If user choose to show net change - then add stub data to data source */
                        if (result.general.showNetChangeRow) {
                            this.cashflowData = this.cashflowData.concat(this.getStubForNetChange(this.cashflowData));
                            /** else - remove the stubbed net change data from data source */
                        } else {
                            this.cashflowData = this.cashflowData.filter(item => item.cashflowTypeId !== NetChange);
                        }
                    }

                    if (updateAfterAccountingTypeShowingChange) {
                        this.cashflowData.forEach(item => {
                            this.addCategorizationLevels(item);
                        });
                    }
                    this.dataSource = this.getApiDataSource();
                }
            }
            this.pivotGrid.instance.updateDimensions();
            this.handleBottomHorizontalScrollPosition();
            this.notify.info(notificationMessage);
        });
    }

    getApiDataSource() {
        return {
            fields: this.apiTableFields,
            store: this.cashflowData
        };
    }

    /**
     * Update the fields array with the date fields with different date intervals like year, quarter and month
     * @param startedGroupInterval - the groupInterval from which we should start show headers
     */
    updateDateFields(startedGroupInterval) {
        let allColumnsFields = this.getColumnFields();
        for (let field of allColumnsFields) {
            field.expanded = false;
        }
        allColumnsFields.every(field => {
            if (field.groupInterval === startedGroupInterval) {
                return false;
            } else {
                field.expanded = true;
                return true;
            }
        });
    }

    /**
     * Event that happens when the content renders
     * @param event
     */
    onContentReady(event) {

        if (this.expandBeforeIndex !== null) {
            this.startLoading();
            let res = this.expandAll(this.expandBeforeIndex);
            if (res) {
                this.expandBeforeIndex = null;
            }
        }

        /** If amount of years is 1 and it is collapsed - expand it to the month */
        if (this.allYears && this.allYears.length && this.allYears.length === 1 && this.yearsAmount === 1) {
            /** Check if the year was expanded, if no - expand to months for better user experience */
            let yearWasExpanded = this.pivotGrid.instance.getDataSource().state().columnExpandedPaths.some(path => {
                return path.indexOf(this.allYears[0]) !== -1;
            });
            if (!yearWasExpanded) {
                this.expandYear(this.allYears[0]);
                this.allYears = undefined;
            }
        }

        /** Get the groupBy element and append the dx-area-description-cell with it */
        let areaDescription = event.element.querySelector('.dx-area-description-cell');
        if (areaDescription) areaDescription.appendChild(document.querySelector('.sort-options'));

        /** Calculate the amount current cells to cut the current period current cell to change current from
         *  current for year to current for the grouping period */
        let lowestOpenedCurrentInterval = this.getLowestOpenedCurrentInterval();
        $('.lowestOpenedCurrent').removeClass('lowestOpenedCurrent');
        let targetCell = lowestOpenedCurrentInterval === 'year' && $(`.dx-pivotgrid-expanded.current${_.capitalize(lowestOpenedCurrentInterval)}`).length ?
                         $(`.current${_.capitalize(lowestOpenedCurrentInterval)}.dx-total`) :
                         $(`.current${_.capitalize(lowestOpenedCurrentInterval)}:not(.dx-pivotgrid-expanded)`);
        targetCell.addClass('lowestOpenedCurrent');

        this.changeHistoricalColspans(lowestOpenedCurrentInterval);
        this.hideProjectedFields();

        /** Clear cache with columns activity */
        this.cachedColumnActivity.clear();
        this.applyUserPreferencesForAreas();

        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();

        /** update dimensions as cells font sizes might be changed in user preferences and cells widths don't correspond
         *  to the new font sizes */
        if (!this.contentReady) {
            setTimeout(() => { this.pivotGrid.instance.updateDimensions(); }, 0);
        }

        this.contentReady = true;
        if (this.pivotGrid.instance != undefined && !this.pivotGrid.instance.getDataSource().isLoading()) {
            this.finishLoading();
        }

    }

    keyDownListener(e) {
        if (e.target.nodeName == 'INPUT')
            return;

        if (this.selectedCell) {
            let nextElement: HTMLElement;
            let direction: string;
            switch (e.keyCode) {
                case 37: //left
                    nextElement = this.selectedCell.cellElement.previousElementSibling;
                    direction = 'left';
                    break;
                case 38: //up
                    let prevSibling = this.selectedCell.cellElement.parentElement.previousElementSibling;
                    nextElement = prevSibling ? prevSibling.querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                    direction = 'up';
                    break;
                case 39: //right
                    nextElement = this.selectedCell.cellElement.nextElementSibling;
                    direction = 'right';
                    break;
                case 40: //down
                    let nextSibling = this.selectedCell.cellElement.parentElement.nextElementSibling;
                    nextElement = nextSibling ? nextSibling.querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                    direction = 'down';
                    break;
                case 67: // ctrl + c
                    if (this.selectedCell && this.isCopyable(this.selectedCell) && (e.ctrlKey || e.metaKey)) {
                        this.onCopy(e);
                    }
                    break;
                case 86: // ctrl + v
                    if (this.copiedCell && this.isCopyable(this.copiedCell) && (e.ctrlKey || e.metaKey)) {
                        this.onPaste();
                    }
                    break;
                case 46: // delete
                    if (this.statsDetailResult)
                        this.onDetailsRowDelete(e);
                    else
                        this.onDelete(e);
                    break;
                default:
                    return;
            }

            e.stopPropagation();
            if (nextElement) {
                let scrollValue = this.calculateScrollValue(this.selectedCell.cellElement, nextElement, direction);
                if (scrollValue) {
                    let scrollable = direction == 'up' || direction == 'down'
                        ? ScrollView.getInstance(this.getElementRef().nativeElement.querySelector('.cashflow .cashflow-scroll'))
                        : this.pivotGrid.instance['$element']().find('.dx-scrollable').last().dxScrollable('instance');

                    scrollable.scrollBy(scrollValue);
                }

                this.pivotGrid.instance['clickCount'] = 0;
                nextElement.click();
                this.pivotGrid.instance['clickCount'] = 0;
            }
        }
    }

    expandYear(year: number) {
        let historicalValue = this.getYearHistoricalSelectorWithCurrent()({date: moment.unix(0).tz('UTC').year(year)});
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 1]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 2]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 3]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 4]);
    }

    calculateScrollValue(cell: HTMLElement, nextCell: HTMLElement, direction: string): number {
        let parentRect: ClientRect;
        let cellRect: ClientRect = cell.getBoundingClientRect();

        switch (direction) {
            case 'right':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-pivotgrid-area-data').getBoundingClientRect();
                return cellRect.right + cell.offsetWidth > parentRect.right ? nextCell.offsetWidth : 0;
            case 'left':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-pivotgrid-area-data').getBoundingClientRect();
                return cellRect.left - cell.offsetWidth < parentRect.left ? -nextCell.offsetWidth : 0;
            case 'up':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-area-column-cell').getBoundingClientRect();
                return cellRect.top - cell.offsetHeight < parentRect.bottom ? -nextCell.offsetHeight : 0;
            case 'down':
                parentRect = document.body.getBoundingClientRect();
                return cellRect.bottom + cell.offsetHeight * 2 > parentRect.bottom ? nextCell.offsetHeight : 0;
        }

        return 0;
    }

    onScroll(e) {
        this.handleBottomHorizontalScrollPosition();
    }

    synchronizeHeaderHeightWithCashflow() {
        let descriptionCellElement = document.querySelector('.dx-area-description-cell');
        let headerElement = descriptionCellElement ? descriptionCellElement.parentElement : undefined;
        if (headerElement) {
            let headerElementHeight = headerElement.clientHeight;
            let bottomRow = <HTMLElement>document.getElementsByClassName('dx-bottom-row')[0];
            /** Set the top padding for bottom row children depends on header element height */
            for (let i = 0; i < bottomRow.children.length; i++) {
                let childTd = <HTMLTableCellElement>bottomRow.children[i];
                if (childTd.style.paddingTop !== headerElementHeight + 'px') {
                    childTd.style.paddingTop = headerElementHeight + 'px';
                } else {
                    break;
                }
                childTd = null;
            }
        }
        headerElement = null;
    }

    handleBottomHorizontalScrollPosition() {
        let scrollElement = $('.dx-pivotgrid-area-data .dx-scrollable-scrollbar');
        let cashflowWrapper = document.getElementsByClassName('pivot-grid-wrapper')[0];
        if (cashflowWrapper && (cashflowWrapper.getBoundingClientRect().bottom > window.innerHeight || this.statsDetailResult)) {
            scrollElement.addClass('fixedScrollbar');
            let minusValue = scrollElement.height();

            if (this.statsDetailResult) {
                let height = $('.cashflow-wrap').outerHeight();
                minusValue += height || 0;
            } else if (this.cashflowGridSettings.visualPreferences.showFooterBar) {
                minusValue += $('#cashflowFooterToolbar').length ? $('#cashflowFooterToolbar').height() : this.bottomToolbarHeight;
            }
            let fixedFiltersWidth: number = $('.fixed-filters').length ? parseInt($('.fixed-filters').css('marginLeft')) : 0;
            /** Set new offset to stick the scrollbar to the bottom of the page */
            scrollElement.offset({
                top: window.innerHeight - minusValue,
                left: this.leftColumnWidth + fixedFiltersWidth
            });
        } else {
            scrollElement.removeClass('fixedScrollbar');
            scrollElement.css({left: 'auto', top: 'auto'});
        }
        scrollElement = null;
        cashflowWrapper = null;
    }

    handleVerticalScrollPosition() {
        let cashflowScroll = $('.cashflow-scroll');
        if (this.statsDetailResult) {
            let cashflowElement = $('.cashflow');
            cashflowScroll.height(cashflowElement.outerHeight() - $('.cashflow-wrap').outerHeight());
        } else {
            cashflowScroll.height('');
        }
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    getDataItemsByCell(cellObj): TransactionStatsDtoExtended[] {
        return this.cashflowData.filter(cashflowItem => {
            let rowPathPropertyName = cellObj.area === 'data' ? 'rowPath' : 'path';
            let columnPathPropertyName = cellObj.area === 'data' ? 'columnPath' : 'path';
            return cashflowItem.amount &&
                   (cellObj.area === 'column' || cellObj.cell[rowPathPropertyName].every((fieldValue, index) => !fieldValue || fieldValue === cashflowItem[`level${index}`])) &&
                   (cellObj.area === 'row' || cellObj.cell[columnPathPropertyName].every((fieldValue, index) => {
                        let field = this.pivotGrid.instance.getDataSource().getAreaFields('column', true)[index];
                        if (field.caption === 'Projected' && fieldValue !== Projected.PastTotal && fieldValue !== Projected.FutureTotal) {
                            return this.projectedSelector(cashflowItem) === fieldValue;
                        }
                        if (field.caption === 'Week') {
                            const weekInfo = JSON.parse(fieldValue);
                            return cashflowItem.initialDate.isBetween(weekInfo.startDate, weekInfo.endDate, 'days', '[]');
                        }
                        let dateMethod = field.groupInterval === 'day' ? 'date' : field.groupInterval;
                        return field.dataType !== 'date' ||
                               (field.groupInterval === 'month' ?
                                cashflowItem.initialDate[dateMethod]() + 1 :
                                cashflowItem.initialDate[dateMethod]()
                               ) === fieldValue;
                   }));
        });
    }

    /**
     * Changes historical colspans depend on current, previous and forecast periods using jquery dates columns colspans
     * and historical classes that added in onCellPrepared to the dates that belongs to the current periods like
     * currentYear, currentQuarter, currentMonth or currentDay
     */
    changeHistoricalColspans(lowestOpenedCurrentInterval) {
        /** Get the colspans values for the prev, current and forecast historical td that should be counted to
         * correctly display different historical periods */
        let colspanAmountForPrevious = this.getIntervalColspansAmount(lowestOpenedCurrentInterval, 'prev');
        let colspanAmountForCurrent =  this.getIntervalColspansAmountForCurrent(lowestOpenedCurrentInterval);
        let colspanAmountForForecast = this.getIntervalColspansAmount(lowestOpenedCurrentInterval, 'next');

        let currentHasRowspan = $('.historicalRow .currentHistorical').attr('rowspan');
        /** Hide current cell if there is no current opened lowest period and change the colspan */
        if (colspanAmountForCurrent === 0 && !currentHasRowspan) {
            $('.historicalRow .currentHistorical').hide();
        }
        /** If historical cell is absent - create it */
        if (!$('.historicalRow .prevHistorical').length && colspanAmountForPrevious) {
            this.createHistoricalCell('prev');
        }
        /** If forecast cell is absent - create it */
        if (!$('.historicalRow .nextHistorical').length && colspanAmountForForecast) {
            this.createHistoricalCell('next');
        }
        /** Change the colspan for the historical period */
        $('.historicalRow .prevHistorical').attr('colspan', (colspanAmountForPrevious));
        if (!currentHasRowspan) {
            $('.historicalRow .currentHistorical').attr('colspan', colspanAmountForCurrent);
        }
        /** Change colspan for forecast cell */
        $('.historicalRow .nextHistorical').attr('colspan', (colspanAmountForForecast));
    }

    /**
     * Creates historical cell in historical row
     * @param period
     */
    createHistoricalCell(period) {
        let positionMethod = period === 'next' ? 'after' : 'before',
            textKey = period === 'next' ? this.historicalTextsKeys[2] : this.historicalTextsKeys[0],
            text = this.l(textKey);
        $('.historicalRow .currentHistorical')
            [positionMethod](function () {
            return `<td class="dx-pivotgrid-expanded historicalField ${period}Historical">${text.toUpperCase()}</td>`;
        });
    }

    getIntervalColspansAmountForCurrent(lowestColumnCaption) {
        let colspanAmount = 0;
        while (lowestColumnCaption) {
            let currentElement = $(`.dx-pivotgrid-horizontal-headers .lowestOpenedCurrent.current${_.capitalize(lowestColumnCaption)}`);
            if (currentElement.length) {
                colspanAmount = +currentElement.attr('colspan') || 1;
                break;
            } else {
                lowestColumnCaption = this.getPrevColumnField(lowestColumnCaption);
            }
            currentElement = null;
        }
        return colspanAmount;
    }

    /**
     * Get lowest opened interval
     */
    getLowestOpenedCurrentInterval(): string {
        let lowestInterval;
        let columnsTree = this.pivotGrid.instance.getDataSource().getData().columns;
        this.getColumnFields().some(column => {
            let currentColumnValue = this.getColumnFieldValueForCurrent(column);
            columnsTree = columnsTree.find(item => item.value === currentColumnValue);
            if (columnsTree && columnsTree.children) {
                columnsTree = columnsTree.children;
            } else {
                lowestInterval = column.caption.toLowerCase();
                return true;
            }
        });

        return lowestInterval;
    }

    getColumnFieldValueForCurrent(columnField) {
        let columnFieldValueForCurrent;
        if (columnField.caption === 'Projected') {
            columnFieldValueForCurrent = Projected.Today;
        } else if (columnField.caption === 'Historical') {
            columnFieldValueForCurrent = Periods.Current;
        } else {
            let currentDate = this.cashflowService.getUtcCurrentDate();
            if (columnField.dataType === 'date') {
                let method = columnField.groupInterval === 'day' ? 'date' : columnField.groupInterval;
                columnFieldValueForCurrent = method === 'month' ? currentDate[method]() + 1 : currentDate[method]();
            }
            if (columnField.caption === 'Week') {
                columnFieldValueForCurrent = JSON.stringify(new WeekInfo(currentDate));
            }
        }
        return columnFieldValueForCurrent;
    }

    getIntervalColspansAmount(groupInterval, period) {
        let colspansAmount = 0;
        let dataAreaElement = this.getElementRef().nativeElement.querySelector('.dx-area-data-cell');
        let currentElement = dataAreaElement.querySelector(`.current${_.capitalize(groupInterval)}`);
        if (dataAreaElement) {
            let allCellsAmount = dataAreaElement.querySelector('tr').childElementCount;
            if (!currentElement) {
                if (dataAreaElement.querySelector(`[class*=${[period]}]`)) {
                    colspansAmount = allCellsAmount;
                }
            } else {
                colspansAmount = period === 'prev' ? currentElement.cellIndex : allCellsAmount - currentElement.cellIndex - 1;
            }
        }
        return colspansAmount;
    }

    getPrevColumnField(columnField) {
        let columnFields = this.getColumnFields();
        let currentIndex = columnFields.map(item => item.caption.toLowerCase()).indexOf(columnField);
        return currentIndex > 0 ? columnFields[currentIndex - 1].caption.toLowerCase() : null;
    }

    getHistoricalCustomizer() {
        return cellInfo => this.l(this.historicalTextsKeys[cellInfo.value]).toUpperCase();
    }

    getYearHistoricalSelectorWithCurrent(): any {
        return data => {
            let currentYear = moment().year();
            let itemYear = data.initialDate ? data.initialDate.year() : data.date.year();
            let result = Periods.Historical;
            if (currentYear < itemYear) {
                result = Periods.Forecast;
            } else if (currentYear === itemYear) {
                result = Periods.Current;
            }
            return result;
        };
    }

    projectedSelector(dataItem) {
        let result: Projected;
        let itemMonthFormatted = dataItem.initialDate.format('YYYY.MM');
        let currentMonthFormatted = moment().format('YYYY.MM');
        if (itemMonthFormatted !== currentMonthFormatted) {
            result = currentMonthFormatted > itemMonthFormatted ? Projected.PastTotal : Projected.FutureTotal;
        } else {
            let itemDate = dataItem.initialDate.format('YYYY.MM.DD');
            let currentDate = moment().format('YYYY.MM.DD');
            if (itemDate === currentDate) {
                result = Projected.Today;
            } else if (itemDate > currentDate) {
                result = Projected.Forecast;
            } else if (itemDate < currentDate) {
                result = Projected.Mtd;
            }
        }
        return  result;
    }

    /**
     * Gets quarter from the year
     * @param date
     * @returns {number}
     */
    getQuarter(date: Date = new Date()) {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    /**
     * Gets the text for quarters header
     * @returns {string}
     */
    getQuarterHeaderCustomizer(): any {
        return cellInfo => cellInfo.valueText.slice(0, 3).toUpperCase();
    }

    /**
     * Gets the text for months header
     * @returns {string}
     */
    getMonthHeaderCustomizer(): any {
        return cellInfo => cellInfo.valueText.slice(0, 3).toUpperCase();
    }

    weekHeaderSelector(dataItem): string {
        let weekInfo = new WeekInfo(dataItem.initialDate);
        return JSON.stringify(weekInfo);
    }

    weekSorting(firstItem, secondItem) {
        return JSON.parse(firstItem.value).weekNumber > JSON.parse(secondItem.value).weekNumber;
    }

    getWeekHeaderCustomizer(): any {
        return (weekInfo: {value: string, valueText: string}) => {
            let weekInfoObj: WeekInfo = JSON.parse(weekInfo.value);
            let startDate = moment(weekInfoObj.startDate).utc().format('DD.MM');
            let endDate = moment(weekInfoObj.endDate).utc().format('DD.MM');
            let text = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
            return text;
        };
    }

    /**
     * Gets the historical field object in tableFields
     * @returns {Object}
     */
    getHistoricField(): any {
        return this.apiTableFields.find(
            field => field['caption'] === 'Historical'
        );
    }

    /** Get all column fields */
    getColumnFields() {
        return this.apiTableFields.filter(field => field.area === 'column' && field.visible);
    }

    expandAll(itemIndex) {
        let result = false;
        if (this.pivotGrid) {
            let dataSource = this.pivotGrid.instance.getDataSource();
            this.getColumnFields().forEach(item => {
                /** exclude historical field */
                if (item.dataType === 'date') {
                    if (item.areaIndex <= itemIndex) {
                        dataSource.expandAll(item.index);
                    } else {
                        dataSource.collapseAll(item.index);
                    }
                }
            });
            result = true;
        }
        return result;
    }

    changeGroupBy(event) {
        this.startLoading();
        let itemIndex = event.itemData.itemIndex !== undefined ? event.itemData.itemIndex : event.itemIndex,
            value = this.groupbyItems[itemIndex],
            startedGroupInterval = value.groupInterval;
        /** Change historical field for different date intervals */
        let historicalField = this.getHistoricField();
        this.closeTransactionsDetail();
        this.expandAll(itemIndex);
        this.pivotGrid.instance.repaint();
    }

    getMonthsPaths(columns) {
        let monthsPaths = [];
        let monthIndex = this.pivotGrid.instance.getDataSource().field('Month').areaIndex;
        for (let stringPath in columns._cacheByPath) {
            let path = stringPath.split('.');
            if (path.length === monthIndex + 1) {
                monthsPaths.push(path);
            }
        }
        return monthsPaths;
    }

    downloadData(event) {
        let format = event.itemData.format;
        if (format === 'xls') {
            this.pivotGrid.export.fileName = this._exportService.getFileName();
            this.pivotGrid.instance.exportToExcel();
        }
    }

    togglePivotGridRows(event) {
        let levelIndex = event.itemData.itemIndex !== undefined ? event.itemData.itemIndex : event.itemIndex;
        let source;
        switch (levelIndex) {
            case 0:
            case 1:
            case 2:
                source = this.pivotGrid.instance.getDataSource().getData();
                this.expandRows(source, levelIndex);
                this.pivotGrid.instance.getDataSource().collapseAll(levelIndex + 1);
                break;
            case 3:
                source = this.pivotGrid.instance.getDataSource().getData();
                this.expandRows(source);
                break;
            case 4:
                this.pivotGrid.instance.getDataSource().collapseAll(2);
                this.pivotGrid.instance.getDataSource().collapseAll(1);
                this.pivotGrid.instance.getDataSource().collapseAll(0);
                break;
            default:
                // Don't know yet what to do by default.
                break;
        }
    }

    expandRows(source: any, stopDepth: number = 5, path: any = [], currentDepth: number = 0) {
        if (!source || (!source.children && !source.rows))
            return;
        let rows = source.rows ? source.rows : source.children;
        for (let child of rows){
            let childPath = path.slice();
            childPath.push(child.value);
            if (this.hasChildsByPath(childPath)) {
                let dataSource = this.pivotGrid.instance.getDataSource();
                dataSource.expandHeaderItem('row', childPath);

                this.pivotGrid.instance.getDataSource().load().then((d) => {
                    var dataSourceChild = this.getDataSourceItemByPath(dataSource.getData().rows, childPath.slice());
                    if (currentDepth != stopDepth)
                        this.expandRows(dataSourceChild, stopDepth, childPath, currentDepth + 1);
                });
            }
        }
    }

    getDataSourceItemByPath(dataSourceItems: any[], path: any[]) {
        let pathValue = path.shift();
        for (let i = 0; i < dataSourceItems.length; i++){
            let item = dataSourceItems[i];
            if (item.value == pathValue) {
                if (path.length == 0)
                    return item;

                if (!item.children)
                    return null;

                return this.getDataSourceItemByPath(item.children, path);
            }
        };
    }

    /**
     * whether or not the cell is balance sheet header
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return bool
     */
    isStartingBalanceHeaderColumn(cellObj) {
        return cellObj.area === 'row' &&
            cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.rowspan === undefined &&
            cellObj.cell.path[0] === PSB &&
            !cellObj.cell.isWhiteSpace;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isStartingBalanceDataColumn(cell, area): boolean {
        return area === 'data' && cell.rowPath !== undefined && cell.rowPath[0] === PSB;
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj): boolean {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === PSB &&
            (cellObj.cell.rowType === PT || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether cell is cashflow type header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isCashflowTypeRowTotal(cell, area): boolean {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace ? path.length === 1 : false;
        }
        return result;
    }

    isAccountingRowTotal(cell, area): boolean {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace && path.length === 2 && path[1] ? path[1].slice(0, 2) === CategorizationPrefixes.AccountingType : false;
        }
        return result;
    }

    isUnclassified(cell, area) {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace && path.length === 2 && path[2] === undefined;
        }
        return result;
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isIncomeOrExpensesChildCell(cell, area) {
        return area === 'row' && cell.path && cell.path.length > 1 && (cell.path[0] === PI || cell.path[0] === PE);
    }

    /**
     * whether the cell is income or expenses header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isIncomeOrExpensesChildHeaderCell(cellObj): boolean {
        return cellObj.area === 'row' && cellObj.cell.path && cellObj.cell.path.length > 1 &&
               (cellObj.cell.path[0] === PI || cellObj.cell.path[0] === PE);
    }

    /**
     * whether the cell is net change header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isNetChangeTotalCell(cellObj) {
        let pathProperty = cellObj.area === 'row' ? 'path' : 'rowPath';
        return cellObj.cell[pathProperty] && !cellObj.cell.isWhiteSpace && cellObj.cell[pathProperty].length === 1 && cellObj.cell[pathProperty][0] === PNC;
    }

    isAccountHeaderCell(cell, area): boolean {
        return area === 'row' && cell.path && cell.path[1] && cell.path[1].slice(0, 2) === CategorizationPrefixes.AccountName;
    }

    isCopyable(cellObj) {
        return cellObj.area === 'data' && (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE) && cellObj.cell.value;
    }

    isDayCell(cell) {
        let result = false;
        if (this.pivotGrid) {
            let dayIndex = this.getAreaIndexByCaption('day', 'column');
            let path = cell.path || cell.columnPath;
            result = path.length === (dayIndex + 1);
        }
        return result;
    }

    isMonthHeaderCell(cellObj): boolean {
        let isMonthHeaderCell = false;
        if (this.pivotGrid) {
            let monthIndex = this.getAreaIndexByCaption('month', 'column');
            isMonthHeaderCell = cellObj.area === 'column' && cellObj.cell.path && cellObj.cell.path.length === (monthIndex + 1);
        }
        return isMonthHeaderCell;
    }

    isProjectedHeaderCell(cellObj) {
        let projectedField = this.pivotGrid.instance.getDataSource().field('Projected');
        let projectedAreaIndex = this.getAreaIndexByCaption('Projected', 'column');
        return cellObj.area === 'column' && cellObj.cell.path && projectedField.visible && cellObj.cell.path.length === projectedAreaIndex + 1;
    }

    getIndexByCaption(caption: string) {
        let index;
        this.apiTableFields.some((item, itemIndex) => {
            if (item.caption.toLowerCase() === caption.toLowerCase()) {
                 index = itemIndex;
                 return true;
            }
            return false;
        });
        return index;
    }

    /**
     * Return index in path for field for a row or column areas
     * @param {string} caption
     * @param {"row" | "column"} area
     * @return {any}
     */
    getAreaIndexByCaption(caption: string, area: 'row' | 'column') {
        let areaIndex = null;
        caption = caption.toLowerCase();
        this.apiTableFields.some(field => {
            if (field.area === area) {
                if (field.caption.toLowerCase() === caption) {
                    areaIndex = field.areaIndex;
                    return true;
                }
            }
        });
        return areaIndex;
    }

    isTransactionDetailHeader(cell, area) {
        let result = false;
        if (area === 'row' && !cell.isWhiteSpace && cell.path) {
            let prefix = this.getPrefixFromPath(cell.path);
            if (prefix && prefix === CategorizationPrefixes.TransactionDescriptor) {
                result = true;
            }
        }
        return result;
    }

    getPrefixFromPath(path) {
        /** get last row - it is opened */
        let row = path.slice(-1);
        return row[0] ? row[0].slice(0, 2) : undefined;
    }

    cellCanBeDragged(cell, area) {
        return area === 'data' && (cell.rowPath[0] === PI || cell.rowPath[0] === PE) &&
               !(cell.rowPath.length && cell.rowPath.length === 2 && (cell.rowPath[1] && cell.rowPath[1].slice(0, 2) !== CategorizationPrefixes.Category)) &&
               cell.rowPath.length !== 1;
    }

    getCellObjectFromCellElement(cellElement: HTMLTableCellElement) {
        let pivotGridObject = <any>this.pivotGrid.instance;
        return pivotGridObject._createCellArgs(cellElement);
    }

    /**
     * whether or not the cell is income or expenses data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesDataCell(cell, area) {
        return area === 'data' && cell.rowPath !== undefined && cell.rowPath.length === 1 &&
               (cell.rowPath[0] === PI || cell.rowPath[0] === PE);
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
               cellObj.cell.path.length === 1 &&
               cellObj.cell.path[0] === PT &&
               !cellObj.cell.isWhiteSpace;
    }

    isStartingBalanceWhiteSpace(cell) {
        return cell.isWhiteSpace &&
               cell.path.length === 1 &&
               cell.path[0] === PSB;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === PT);
    }

    isAllTotalBalanceCell(cell) {
        return cell.rowPath !== undefined && (cell.rowPath[0] === PT || cell.rowPath[0] === PNC);
    }

    isTransactionRows(cell) {
        return cell.rowPath !== undefined &&
               cell.rowPath.length !== 1 &&
               (cell.rowPath[0] === PI || cell.rowPath[0] === PE);
    }

    isReconciliationRows(cell) {
        return cell.rowPath !== undefined && cell.rowPath[0] === PR;
    }

    /**
     * whether the cell is the historical cell
     * @param cellObj
     * @returns {boolean}
     */
    isHistoricalCell(cellObj) {
        return cellObj.area === 'column' && cellObj.rowIndex === 0;
    }

    createActionButton(name, attributes: object = {}) {
        let a = document.createElement('a');
        a.className = 'dx-link dx-link-' + name;
        a.innerText = this.l(this.capitalize(name));
        if (attributes) {
            for (let key in attributes) {
                a.setAttribute(key, attributes[key]);
            }
        }
        return a;
    }

    applyOptionsToElement(element, ...optionsList) {
        for (let options of optionsList) {
            options.classes.length && element.classList.add(...options.classes);
            options.parentClasses.length && element.parentElement.classList.add(...options.parentClasses);
            if (Object.keys(options.attributes).length) {
                for (let attribute in options.attributes) {
                    element.setAttribute(attribute, options.attributes[attribute]);
                }
            }
            options.elementsToAppend.length && options.elementsToAppend.forEach(appendElement => element.appendChild(appendElement));
            options.childrenSelectorsToRemove.length && options.childrenSelectorsToRemove.forEach(selectorToRemove => element.querySelector(selectorToRemove).remove());
            if (Object.keys(options.eventListeners).length) {
                for (let listener in options.eventListeners) {
                    element[listener] = options.eventListeners[listener];
                }
            }
            options.eventsToTrigger.length && options.eventsToTrigger.forEach(eventName => element[eventName]());
            if (options.value !== null) {
                /** @todo add class to the span with actual value and get it */
                element.firstElementChild.innerHTML = options.value;
            }
        }
    }

    /**
     * Event that runs before rendering of every cell of the pivot grid
     * @param e - the object with the cell info
     * https://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxPivotGrid/Events/#cellPrepared
     */
    onCellPrepared(e) {

        /** Apply user preferences to the data showing */
        let preferencesOptions = this.getUserPreferencesForCell(e.cell, e.area);

        let options = this.getCellOptionsFromCell(e.cell, e.area, e.rowIndex, e.isWhiteSpace);

        /** added charts near row titles */
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path) {
            this.addChartToRow(e);
        }

        /** Apply all cell options to the cellElement */
        this.applyOptionsToElement(e.cellElement, options, preferencesOptions);

        /** hide long text for row headers and show '...' instead with the hover and long text */
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path && e.cell.text) {
            let textElement: HTMLSpanElement = e.cellElement.parentElement.querySelector(`td:nth-child(${e.cellElement.cellIndex + 1}) > span`);
            let cellClientRect = e.cellElement.getBoundingClientRect();
            let textClientRect = textElement.getBoundingClientRect();
            let textWidth: number = Math.round(textClientRect.width);
            let textPaddingLeft = Math.round(textClientRect.left - cellClientRect.left);
            let descriptionClientRect = document.querySelector('.dx-area-description-cell').getBoundingClientRect();
            let cellWidth = descriptionClientRect.left + descriptionClientRect.width - cellClientRect.left;
            let newTextWidth = this.getNewTextWidth(cellWidth, textWidth, textPaddingLeft, options.general.isAccountHeaderCell);
            if (newTextWidth) {
                this.applyNewTextWidth(e, textElement, newTextWidth);
            }
        }

        if (e.area === 'column' && e.cell.type !== GrandTotal && e.cell.path) {
            let fieldObj = this.getFieldObjectByPath(e.cell.path);
            let fieldName = fieldObj.groupInterval;
            /** Added 'Total' text to the year and quarter headers */
            if (fieldName === 'year' || fieldName === 'quarter') {
                let hideHead = (e.cellElement.classList.contains('dx-pivotgrid-expanded') &&
                    (fieldName === 'quarter' || e.cellElement.parentElement.children.length >= 6)) ||
                    (fieldName === 'quarter' && this.quarterHeadersAreCollapsed) ||
                    (fieldName === 'year' && this.yearHeadersAreCollapsed);
                e.cellElement.onclick = this.headerExpanderClickHandler;
                e.cellElement.innerHTML = this.getMarkupForExtendedHeaderCell(e, hideHead, fieldName);
            }
        }

        if (this.filterBy && this.filterBy.length && e.area === 'row' && e.cell.text && e.cell.isLast) {
            this.highlightFilteredResult(e);
        }
    }

    applyNewTextWidth(cellObj, element, newCellWidth) {
        cellObj.cellElement.setAttribute('title', cellObj.cell.text.toUpperCase());
        /** Extend text to the whole cell */
        element.style.whiteSpace = 'nowrap';
        element.classList.add('truncated');
        /** created another span inside to avoid inline-flex and text-overflow: ellipsis conflicts */
        element.innerHTML = `<span>${element.textContent}</span>`;
        /** Set new width to the text element */
        element.style.width = newCellWidth + 'px';
    }

    addChartToRow(e) {
        let rowKey = e.cell.path.toString();
        let cachedSparkLine = this.cachedRowsSparkLines.get(rowKey);
        if (cachedSparkLine) {
            e.cellElement.appendChild(cachedSparkLine.element());
        } else {
            let allData: any;
            allData = this.pivotGrid.instance.getDataSource().getData();
            let chartData = [];
            for (let i in allData.columns) {
                if (allData.columns[i].children) {
                    let years = allData.columns[i].children;
                    years.forEach(obj => {
                        let rObj = {};
                        let value = allData.values[e.cell.dataSourceIndex][obj.index];
                        rObj['year'] = obj.value;
                        rObj['value'] = value.length ? Math.abs(value[0]) : Math.abs(value);
                        chartData.push(rObj);
                    });
                }
            }
            if (chartData.length > 1) {
                let spanChart = document.createElement('div');
                spanChart.className = 'chart';
                e.cellElement.appendChild(spanChart);
                let chartOptions = {
                    dataSource: chartData,
                    type: 'area',
                    argumentField: 'year',
                    valueField: 'value',
                    lineWidth: 1,
                    lineColor: '#fab800',
                    showMinMax: false,
                    showFirstLast: false,
                    tooltip: {
                        enabled: false
                    }
                };
                if (e.cell.path[0] === PI) {
                    chartOptions.lineColor = '#61c670';
                }
                if (e.cell.path[0] === PE) {
                    chartOptions.lineColor = '#e7326a';
                }
                let sparkLineInstance = new SparkLine(spanChart, chartOptions);
                this.cachedRowsSparkLines.set(rowKey, sparkLineInstance);
            }
        }
    }

    getFieldObjectByPath(path) {
        let fieldName, columnFields = this.pivotGrid.instance.getDataSource().getAreaFields('column', false);
        let columnNumber = path.length ? path.length  - 1 : 0;
        return columnFields.find(field => field.areaIndex === columnNumber && field.visible);
    }

    highlightFilteredResult(e) {
        let filterByLower = this.filterBy.toLocaleLowerCase();
        let cellText = e.cell.text.toLocaleLowerCase();
        if (cellText.includes(filterByLower)) {
            let resultElement = '';
            let usedPosition = 0;
            let position = cellText.indexOf(filterByLower);
            while (position > -1) {
                resultElement = resultElement + e.cell.text.substr(usedPosition, position)
                    + '<span class="filter-text">' + e.cell.text.substr(usedPosition + position, filterByLower.length) + '</span>';
                usedPosition = usedPosition + position + filterByLower.length;
                cellText = cellText.substr(position + filterByLower.length);
                position = cellText.indexOf(filterByLower);
            }
            resultElement = resultElement + e.cell.text.substr(usedPosition);
            $(e.cellElement).find('> span:first-of-type').text('');
            $(e.cellElement).find('> span:first-of-type').before(resultElement);
        }
    }

    getCellOptionsFromCell = underscore.memoize(
        (cell, area: 'row' | 'column' | 'data', rowIndex: number, isWhiteSpace: boolean): CellOptions => {
            let options: CellOptions = new CellOptions();

            /** Add day (MON, TUE etc) to the day header cells */
            if ((area === 'column' || area === 'data') && cell.text !== undefined && this.isDayCell(cell)) {
                let path = cell.path || cell.columnPath;
                let date = this.formattingDate(path);
                options.attributes['data-is-weekend'] = this.isWeekend(date.startDate);
            }

            if (this.isStartingBalanceWhiteSpace(cell)) {
                options.classes.push('startedBalanceWhiteSpace');
            }

            /** If cell is cashflow type header total row - add css classes to parent tr */
            if (this.isCashflowTypeRowTotal(cell, area)) {
                let path = cell.path || cell.rowPath;
                options.parentClasses.push(path[0].slice(2).toLowerCase() + 'Row', 'totalRow', 'grandTotal');
            }

            if (this.isUnclassified(cell, area)) {
                options.parentClasses.push('unclassifiedRow');
            }

            if (this.isAccountingRowTotal(cell, area)) {
                options.parentClasses.push('totalRow', 'accountingTotal');
            }

            /** added css class to the income and outcomes columns */
            if (this.isIncomeOrExpensesChildCell(cell, area)) {
                let cssClass = `${cell.path[0] === PI ? 'income' : 'expenses'}ChildRow`;
                options.parentClasses.push(cssClass);
            }

            /** add account number to the cell */
            if (this.isAccountHeaderCell(cell, area)) {
                let accountId = cell.path[1].slice(2);
                let account = this.bankAccounts.find(account => account.id == accountId);
                if (account && account.accountNumber) {
                    /** @todo check for memory leak */
                    let accountNumberElement = document.createElement('span');
                    accountNumberElement.className = 'accountNumber';
                    accountNumberElement.innerText = account.accountNumber;
                    options.elementsToAppend.push(accountNumberElement);
                }
                options.general['isAccountHeaderCell'] = true;
            }

            /** add current classes for the cells that belongs to the current periods */
            if (area === 'data' || (area === 'column' || rowIndex >= 1)) {
                let currentPeriodClass = this.getCurrentPeriodsClass(cell, area);
                if (currentPeriodClass) {
                    options.classes.push(currentPeriodClass);
                }
            }

            /** add zeroValue class for the data cells that have zero values to style them with grey color */
            if (area === 'data' && cell.value === 0) {
                options.classes.push('zeroValue');
            }

            /** disable expanding and hide the plus button of the elements that has no children */
            if (area === 'row' && cell.path && !cell.isWhiteSpace && cell.path.length !== this.pivotGrid.instance.getDataSource().getAreaFields('row', true).length) {
                if (!this.hasChildsByPath(cell.path)) {
                    this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', cell.path);
                    options.classes.push('emptyChildren');
                    options.childrenSelectorsToRemove.push('.dx-expand-icon-container');
                    options.eventListeners['onclick'] = function(event) {
                        event.stopImmediatePropagation();
                    };
                }
            }

            /** If there are some cells to click - click it! */
            if (area === 'column' && cell.path) {
                if (this.fieldPathsToClick.length) {
                    let index;
                    this.fieldPathsToClick.forEach((path, arrIndex) => { if (path.toString() === cell.path.toString()) index = arrIndex; });
                    if (index !== undefined) {
                        delete this.fieldPathsToClick[index];
                        if (!cell.expanded) {
                            options.eventsToTrigger.push('click');
                        }
                    }
                }
            }

            /** Show descriptors in Italic */
            if (this.isTransactionDetailHeader(cell, area)) {
                options.classes.push('descriptor');
            }

            /** add draggable and droppable attribute to the cells that can be dragged */
            if (this.cellCanBeDragged(cell, area)) {
                options.attributes['draggable'] = 'true';
                options.attributes['droppable'] = 'false';
                if (!this.cellIsHistorical(cell)) {
                    const cellDateInterval = this.formattingDate(cell.columnPath);
                    const futureForecastsYearsAmount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
                    if (!this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)) {
                        options.classes.push('outOfAllowedForecastsInterval');
                    }
                }
            }

            if (this.isReconciliationRows(cell) && cell.value !== 0) {
                let actionButton = this.createActionButton('discard');
                options.elementsToAppend.push(actionButton);
            }

            if (this.isStartingBalanceDataColumn(cell, area) && cell.value == 0) {
                let elements = this.adjustmentsList.filter(cashflowItem => {
                    return (cell.rowPath[1] === CategorizationPrefixes.AccountName + cashflowItem.accountId || cell.rowType == 'T') &&
                        cell.columnPath.every((fieldValue, index) => {
                        let field = this.pivotGrid.instance.getDataSource().getAreaFields('column', true)[index];
                        let dateMethod = field.groupInterval === 'day' ? 'date' : field.groupInterval;
                            return field.dataType !== 'date' || (field.groupInterval === 'month' ? cashflowItem.initialDate[dateMethod]() + 1 : cashflowItem.initialDate[dateMethod]()) === cell.columnPath[index];
                    });
                });
                if (elements.length) {
                    let sum = elements.reduce((x, y) => x + y.amount, 0);
                    options.classes.push('containsInfo');
                    let infoElement = this.createActionButton('info', {
                        'data-sum': sum
                    });
                    options.elementsToAppend.push(infoElement);
                }
            }

            /** headers manipulation (adding css classes and appending 'Totals text') */
            if (area === 'column' && cell.type !== GrandTotal && cell.path) {
                let fieldName, fieldObj = this.getFieldObjectByPath(cell.path);
                let columnNumber = cell.path.length ? cell.path.length  - 1 : 0;
                let fieldGroup = fieldObj.groupInterval ? 'dateField' : fieldObj.caption.toLowerCase() + 'Field';
                if (fieldGroup === 'dateField') {
                    fieldName = fieldObj.groupInterval;
                    if (fieldName === 'day') {
                        let dayNumber = cell.path.slice(-1)[0],
                            dayEnding = [, 'st', 'nd', 'rd'][ dayNumber % 100 >> 3 ^ 1 && dayNumber % 10] || 'th';

                        let dayEndingElement = document.createElement('span');
                        dayEndingElement.innerText = dayEnding;
                        dayEndingElement.className = 'dayEnding';
                        options.elementsToAppend.push(dayEndingElement);

                        let date = this.formattingDate(cell.path);
                        let dayNameElement = document.createElement('span');
                        dayNameElement.innerText = date.startDate.format('ddd').toUpperCase();
                        dayNameElement.className = 'dayName';
                        /** Add day name */
                        options.elementsToAppend.push(dayNameElement);
                    }
                } else if (fieldGroup === 'historicalField') {
                    fieldName = 'historical';
                } else if (fieldGroup === 'projectedField') {
                    fieldName = Projected[cell.path[columnNumber]];
                }

                /** add class to the cell */
                options.classes.push(fieldGroup, fieldName);

                /** hide projected field for not current months for mdk and projected */
                if (fieldGroup === 'projectedField') {
                    fieldName = 'projected';
                }

                /** add class to the whole row */
                options.parentClasses.push(`${fieldName}Row`);
            }

            return options;
        },
        function() { return JSON.stringify(arguments); }
    );

    cellIsHistorical(cell) {
        let path = cell.path || cell.columnPath;
        let cellInterval = this.formattingDate(path);
        let currentDate = this.cashflowService.getUtcCurrentDate();
        return cellInterval.endDate.isBefore(currentDate);
    }

    /**
     * Check if cell text is not fit to one row with other elements and if so - truncate it
     * @param e
     */
    getNewTextWidth = underscore.memoize(
        (cellInnerWidth, textWidth, textPaddingLeft, isAccount): number => {
            let newTextWidth;
            /** Get the sum of widths of all cell children except text element width */
            let anotherChildrenElementsWidth: number = this.sparkLinesWidth + (isAccount ? this.accountNumberWidth : 0);
            let cellAvailableWidth: number = cellInnerWidth - this.rowCellRightPadding - textPaddingLeft - anotherChildrenElementsWidth;

            /** If text size is too big - truncate it */
            if (textWidth > cellAvailableWidth) {
                newTextWidth = cellAvailableWidth - 1;
            }
            return newTextWidth;
        },
        function() { return JSON.stringify(arguments); }
    )

    /**
     * Return whehter element is cell of cashflow table
     * @param {HTMLElement} element
     * @return {boolean}
     */
    elementIsDataCell(element: HTMLElement): boolean {
        return Boolean(element.closest('.dx-area-data-cell'));
    }

    getCellElementFromTarget(target: Element): HTMLTableCellElement | null {
        let element;
        if (target.nodeType === Node.TEXT_NODE) {
            target = target.parentElement;
        }
        element = target.closest('td');
        return element;
    }

    onDragStart(e) {
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell)) {
            let cellObj = this.getCellObjectFromCellElement(targetCell);

            if (cellObj.cell.value) {

                /** add selected class */
                if (!targetCell.classList.contains('selectedCell')) {
                    $('.selectedCell').removeClass('selectedCell');
                    this.hideModifyingNumberBox();
                    targetCell.classList.add('selectedCell');
                }

                let items = this.getDataItemsByCell(cellObj);
                /** If there are some forecasts for this cell */
                let moveOnlyHistorical = !items.some(item => !!item.forecastId);
                e.dataTransfer.setData('movedCell', JSON.stringify(cellObj));
                e.dataTransfer.setData('moveOnlyHistorical', moveOnlyHistorical);

                this.dragImg.style.display = '';
                e.dataTransfer.setDragImage(this.dragImg, -10, -10);
                e.dataTransfer.dropEffect = 'none';

                $('[droppable]').attr('droppable', 'false');

                let $targetCell = $(targetCell);
                let $targetCellParent = $targetCell.parent();
                let $availableRows = $targetCellParent.add($targetCellParent.prevUntil('.grandTotal')).add($targetCellParent.nextUntil('.grandTotal'));
                /** Highlight cells where we can drop cell */
                if (moveOnlyHistorical) {
                    this.highlightHistoricalTargetCells($targetCell, $availableRows);
                } else {
                    this.highlightForecastsTargetCells($targetCell, $availableRows);
                }

                document.addEventListener('dxpointermove', this.stopPropagation, true);
           }
        }
        targetCell = null;
    }

    highlightHistoricalTargetCells($targetCell, $availableRows) {
        $availableRows.find(`[droppable]:nth-child(${$targetCell.index() + 1})`).attr('droppable', 'true');
    }

    highlightForecastsTargetCells($targetCell, $availableRows) {
        /** Exclude cells that are not in allowed forecasts amount interval */
        const allowedForecastsYearAmount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));

        /** Exclude next current total row from droppable */
        let closestYearColumnTotalSelector = !$targetCell.hasClass('dx-total')
            ? `:not(:nth-child(${$targetCell.nextAll('.dx-total').index() + 1}))`
            : '';
        let nextCellsSelectors = `[droppable][class*="next"]:not(.outOfAllowedForecastsInterval):not(.selectedCell)${closestYearColumnTotalSelector}`;
        $availableRows.find(nextCellsSelectors).attr('droppable', 'true');
        $availableRows.find(`[droppable][class*="current"]:not(.outOfAllowedForecastsInterval):not(.selectedCell):not(.currentYear.dx-total)`).attr('droppable', 'true');
        $availableRows.find(`[droppable]:not(.outOfAllowedForecastsInterval):not(.selectedCell) > span`).attr('droppable', 'true');
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    onDragEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        const targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell)) {
            const hoveredElements = document.querySelectorAll(':hover');
            const lastHoveredElement = hoveredElements[hoveredElements.length - 1];
            const hoveredCell = this.getCellElementFromTarget(lastHoveredElement);
            if (hoveredCell && this.elementIsDataCell(hoveredCell) && hoveredCell !== targetCell
                && hoveredCell.getAttribute('droppable') !== 'true') {
                /** Show messages */
                const targetCellObj = this.getCellObjectFromCellElement(hoveredCell);
                const targetInterval = this.formattingDate(targetCellObj.cell.columnPath);
                const currentDate = this.cashflowService.getUtcCurrentDate();
                const forecastsYearCount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
                if (targetInterval.endDate.isBefore(currentDate)) {
                    this.notify.error(this.l('SelectFutureDate'));
                } else if (!this.cashflowService.cellIsAllowedForAddingForecast(targetInterval, forecastsYearCount)) {
                    this.notify.error(this.l('ForecastIsProjectedTooFarAhead'));
                } else {
                    this.notify.error(this.l('SelectCategory'));
                }
            }

            targetCell.classList.remove('dragged');
            $('[droppable]').removeClass('currentDroppable');
            $('[droppable]').attr('droppable', 'false');
        }
        this.dragImg.style.display = 'none';
        document.removeEventListener('dxpointermove', this.stopPropagation);
    }

    onDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell) && !targetCell.classList.contains('selectedCell')) {
            /** change the class for the target cell */
            if (targetCell.getAttribute('droppable') === 'true') {
                $('[droppable]').removeClass('currentDroppable');
                targetCell.classList.add('currentDroppable');
            }
        }
        targetCell = null;
    }

    onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell) && !targetCell.classList.contains('selectedCell')) {
            /** change the class for the target cell */
            if (targetCell.getAttribute('droppable') === 'true') {
                $('[droppable]').removeClass('currentDroppable');
                targetCell.classList.add('currentDroppable');
            } else {
                e.dataTransfer.dropEffect = 'none';
            }
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
        targetCell = null;
    }

    onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell)) {
            let historicalItemsIds, moveForecastsModels;
            let cellObj = this.getCellObjectFromCellElement(targetCell);
            let targetCellData = this.getCellInfo(cellObj);
            const movedCell = JSON.parse(e.dataTransfer.getData('movedCell'));
            /** Get the transactions of moved cell if so */
            let sourceCellInfo = this.getCellInfo(movedCell);
            this.statsDetailFilter = this.getDetailFilterFromCell(movedCell);
            let statsDetailObservable = this._cashflowServiceProxy.getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter).flatMap(x => x);
            const forecastsObservable = statsDetailObservable.filter(transaction => !!transaction.forecastId).toArray();
            const historicalsObservable = statsDetailObservable.filter(transaction => !!!transaction.forecastId).toArray();
            Observable.forkJoin(
                historicalsObservable.mergeMap(historicalTransactions => {
                    const historicalTransactionsExists = historicalTransactions && historicalTransactions.length && cellObj.cellElement.className.indexOf('next') === -1;
                    return historicalTransactionsExists ? this.getMoveHistoricalObservable(movedCell, targetCellData) : Observable.of('empty');
                }),
                forecastsObservable.mergeMap(forecastsTransactions => {
                    if (forecastsTransactions && forecastsTransactions.length) {
                        let moveForecastsModels = this.createMovedForecastsModels(forecastsTransactions, sourceCellInfo, targetCellData);
                        return <any>this.getMoveForecastsObservable(moveForecastsModels);
                    } else {
                        return Observable.of('empty');
                    }
                })
            ).subscribe(
                res => {
                    if (res) {
                        let itemsToMove = this.getDataItemsByCell(movedCell);
                        if (res[0] !== 'empty') {
                            let historicalItems = itemsToMove.filter(item => !item.forecastId);
                            this.updateMovedHistoricals(historicalItems, targetCellData);
                        }
                        if (res[1] !== 'empty') {
                            let forecastItems = itemsToMove.filter(item => item.forecastId);
                            this.updateMovedForecasts(forecastItems, targetCellData);
                        }
                    }
                },
                e => { console.log(e); this.notify.error(e); },
                () => {
                    this.updateDataSource()
                        .then(() => {
                            this.notify.success(this.l('Cell_moved'));
                        });
                }
            );
        }
        targetCell = null;
    }

    onMouseOver(e) {
        let targetCell = this.getCellElementFromTarget(e.target);
        let relatedTargetCell = e.relatedTarget && this.getCellElementFromTarget(e.relatedTarget);
        if (targetCell && this.elementIsDataCell(targetCell) && targetCell !== relatedTargetCell) {
            let infoButton = targetCell.getElementsByClassName('dx-link-info');
            if (infoButton.length) {
                let sum = parseInt(infoButton[0].getAttribute('data-sum'));
                let infoTooltip = document.createElement('div');
                infoTooltip.className = 'tootipWrapper';
                this.infoTooltip = new Tooltip(infoTooltip, {
                    target: targetCell,
                    contentTemplate: `<div>New account added: ${this.formatAsCurrencyWithLocale(sum)}</div>`,
                });
                targetCell.appendChild(infoTooltip);
                this.infoTooltip.show();
            }
        }
    }

    onMouseOut(e) {
        if (this.infoTooltip) {
            let infoTooltipParent = this.infoTooltip.element().parentElement;
            this.infoTooltip.dispose();
            this.infoTooltip = undefined;
            if (infoTooltipParent) {
                infoTooltipParent.removeChild(infoTooltipParent.querySelector('.tootipWrapper'));
            }
        }
    }

    getMoveHistoricalObservable(movedCell, targetCellData): Observable<any> {
        let filter = this.getDetailFilterFromCell(movedCell);
        let destinationCategoryId = targetCellData.subCategoryId || targetCellData.categoryId;
        return this._classificationServiceProxy.updateTransactionsCategoryWithFilter(
            InstanceType[this.instanceType],
            this.instanceId,
            UpdateTransactionsCategoryWithFilterInput.fromJS({
                transactionFilter: filter,
                destinationCategoryId: destinationCategoryId,
                standardDescriptor: destinationCategoryId ? targetCellData.transactionDescriptor : 'Unclassified'
            })
        );
    }

    updateMovedHistoricals(items: TransactionStatsDtoExtended[], targetData: CellInfo) {
        items.forEach(item => {
            item.categoryId = targetData.categoryId;
            item.subCategoryId = targetData.subCategoryId;
            item.transactionDescriptor = targetData.categoryId || targetData.subCategoryId
                ? targetData.transactionDescriptor || item.transactionDescriptor
                : null;
            this.addCategorizationLevels(item);
        });
    }

    createMovedForecastsModels(forecasts: CashFlowStatsDetailDto[], sourceData: CellInfo, targetData: CellInfo): UpdateForecastsInput {
        let date, forecastModel;
        let forecastModels = {'forecasts': []};
        forecasts.forEach(forecast => {
            date = this.getDateForForecast(targetData.fieldCaption, targetData.date.startDate, targetData.date.endDate, forecast.forecastDate.utc());
            forecastModel = new UpdateForecastInput({
                id: forecast.forecastId,
                date: moment(date),
                amount: forecast.debit !== null ? -forecast.debit : forecast.credit,
                categoryId: targetData.subCategoryId || targetData.categoryId,
                transactionDescriptor: targetData.transactionDescriptor || forecast.description,
                bankAccountId: forecast.accountId
            });

            if (forecastModel)
                forecastModels.forecasts.push(forecastModel);
        });

        return new UpdateForecastsInput(forecastModels);
    }

    getMoveForecastsObservable(forecastsModels: UpdateForecastsInput): Observable<void> {
        return this._cashFlowForecastServiceProxy.updateForecasts(
            InstanceType10[this.instanceType],
            this.instanceId,
            UpdateForecastsInput.fromJS(forecastsModels)
        );
    }

    copyForecasts(forecastsModels: CreateForecastsInput) {
        return this._cashFlowForecastServiceProxy.createForecasts(
            InstanceType10[this.instanceType],
            this.instanceId,
            CreateForecastsInput.fromJS(forecastsModels)
        );
    }

    createCopyItemsModels(transactions: CashFlowStatsDetailDto[], sourceCellInfo: CellInfo, targetsData: CellInfo[], isHorizontalCopying: boolean): CreateForecastsInput {
        let forecastsItems: AddForecastInput[] = [];
        let activeAccountIds = this.cashflowService.getActiveAccountIds(this.bankAccounts, this.requestFilter.accountIds);
        targetsData.forEach((targetData, index) => {
            transactions.forEach(transaction => {
                let target = { ...targetData };
                let transactionDate = transaction.forecastDate || transaction.date;
                let date = this.getDateForForecast(target.fieldCaption, target.date.startDate, target.date.endDate, transactionDate.utc());
                let transactionAccountId = this.bankAccounts.find(account => account.accountNumber === transaction.accountNumber).id;
                let accountId = this.cashflowService.getActiveAccountId(activeAccountIds, transactionAccountId);
                let data = {
                    forecastModelId: this.selectedForecastModel.id,
                    bankAccountId: accountId,
                    date: moment(date),
                    startDate: target.date.startDate,
                    endDate: target.date.endDate,
                    currencyId: this.currencyId,
                    amount: transaction.debit !== null ? -transaction.debit : transaction.credit
                };
                /** To update local data */
                if (isHorizontalCopying) {
                    target.transactionDescriptor = transaction.descriptor;
                    if (this.cashflowService.isSubCategory(transaction.categoryId, this.categoryTree)) {
                        target.subCategoryId = transaction.categoryId;
                    }
                }
                /** Get target descriptor or if we copy to category - get transaction description */
                target.transactionDescriptor = target.transactionDescriptor || transaction.descriptor;
                data['target'] = target;
                let categorizationData = this.cashflowService.getCategorizationFromForecastAndTarget(sourceCellInfo, target);
                let combinedData = <any>{ ...data, ...categorizationData };
                let forecastModel = new AddForecastInput(combinedData);
                if (forecastModel) {
                    forecastsItems.push(forecastModel);
                }
            });
        });
        return new CreateForecastsInput({
            forecasts: forecastsItems
        });
    }

    updateMovedForecasts(forecasts: TransactionStatsDtoExtended[], targetData: CellInfo) {
        /** if the operation is update - then also remove the old objects (income or expense, net change and total balance) */
        forecasts.forEach((forecastInCashflow, index) => {
            /** Add stub to avoid hiding of old period from cashflow */
            let stubCopy = this.createStubTransaction(forecastInCashflow);
            stubCopy.amount = 0;
            stubCopy.forecastId = null;
            this.cashflowData.push(stubCopy);

            let date = moment(targetData.date.startDate).utc();
            let timezoneOffset = date.toDate().getTimezoneOffset();

            /** Change forecast locally */
            forecastInCashflow.date = date.add(timezoneOffset, 'minutes');
            forecastInCashflow.initialDate = targetData.date.startDate.utc();
            forecastInCashflow.accountingTypeId = targetData.accountingTypeId;
            forecastInCashflow.categoryId = targetData.categoryId || targetData.subCategoryId;
            forecastInCashflow.subCategoryId = targetData.subCategoryId;
            forecastInCashflow.transactionDescriptor = targetData.transactionDescriptor;
            forecasts[index] = this.addCategorizationLevels(forecastInCashflow);
            this.updateTreePathes(forecastInCashflow, true);
        });

    }

    createForecastsFromCopiedItems(copiedForecastsIds: number[], forecasts: AddForecastInput[], sourceData: CellInfo) {
        let activeAccountIds = this.cashflowService.getActiveAccountIds(this.bankAccounts, this.requestFilter.accountIds);
        forecasts.forEach((forecast, index) => {
            let timezoneOffset = forecast.date.toDate().getTimezoneOffset();
            let accountId = this.cashflowService.getActiveAccountId(activeAccountIds, forecast.bankAccountId);
            let data = {
                accountId: accountId,
                count: 1,
                amount: forecast.amount,
                date: moment(forecast.date).add(timezoneOffset, 'minutes'),
                initialDate: forecast.date,
                forecastId: copiedForecastsIds[index]
            };
            let categorizationData = this.cashflowService.getCategorizationFromForecastAndTarget(sourceData, forecast['target'], false);
            this.cashflowData.push(this.createStubTransaction({...data, ...categorizationData}));
        });
    }

    getDateForForecast(targetCaption, targetStartDate, targetEndDate, sourceDate) {
        let date = moment(targetStartDate);
        sourceDate = sourceDate.utc();
        /** if targetCellDate doesn't have certain month or day - get them from the copied transactions */
        if (['year', 'quarter', 'month'].indexOf(targetCaption) !== -1) {
            if (targetCaption === 'quarter') {
                date.month(date.month() + (sourceDate.month() % 3));
            }
            if (targetCaption === 'year') {
                date.month(sourceDate.month());
            }
            let dayNumber = sourceDate.date() < date.daysInMonth() ? sourceDate.date() : date.daysInMonth();
            date.date(dayNumber);
        }

        /** If current date is in target interval and is bigger then forecast date - then use current date as current */
        let currentDate = this.cashflowService.getUtcCurrentDate();
        if (currentDate.isBetween(date, targetEndDate, 'days', '(]')) {
            date = currentDate;
        } else {
            /** If date is after allowed last date for forecasts year feature - get this last date */
            const forecastsYearCount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
            if (forecastsYearCount) {
                const allowedForecastsInterval = this.cashflowService.getAllowedForecastsInterval(forecastsYearCount);
                if (date.isAfter(allowedForecastsInterval.endDate)) {
                    date = allowedForecastsInterval.endDate;
                }
            }
        }

        /** @todo discuss and handle situation if end of filter is before current day and we move or copy to the current quarter/month etc */
        /** If date is after filter end date - use filter end date */
        // if (this.requestFilter.endDate && date.isAfter(this.requestFilter.endDate)) {
        //     date = this.requestFilter.endDate;
        // }

        return date;
    }

    getCellInfo(cellObj): CellInfo {
        return {
            date: this.formattingDate(cellObj.cell.columnPath),
            fieldCaption: this.getLowestFieldCaptionFromPath(cellObj.cell.columnPath, this.getColumnFields()),
            cashflowTypeId: this.cashflowService.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.CashflowType),
            categoryId: this.cashflowService.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.Category),
            subCategoryId: this.cashflowService.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.SubCategory),
            transactionDescriptor: this.cashflowService.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor),
            accountingTypeId: this.cashflowService.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.AccountingType)
        };
    }

    getUserPreferencesForCell = underscore.memoize(
        (cell, area) => {
            let options: CellOptions = new CellOptions();
            let userPreferences = this.getUserPreferencesAppliedTo('cells');
            userPreferences.forEach(preference => {
                if (preference['sourceValue'] !== null && (!preference.areas.length || preference.areas.indexOf(area) !== -1)) {
                    let preferenceOptions = preference['handleMethod'].call(this, cell, area, preference);
                    this.mergeOptions(options, preferenceOptions);
                }
            });
            return options;
        },
        function() { return JSON.stringify(arguments); }
    )

    mergeOptions(initialOptions: CellOptions, options: CellOptions) {
        for (let optionName in options) {
            let optionValue = options[optionName];
            if (optionValue === null) {
                continue;
            }
            if (Array.isArray(optionValue)) {
                initialOptions[optionName] = [ ...initialOptions[optionName], ...options[optionName] ];
                continue;
            }
            if (typeof optionValue === 'string') {
                initialOptions[optionName] = optionValue;
                continue;
            }
            if (typeof optionValue === 'object') {
                initialOptions[optionName] = { ...initialOptions[optionName], ...options[optionName] };
            }
        }
    }

    /**
     * Get user preferences by applyTo type
     * @param {"cells" | "areas"} applyTo
     */
    getUserPreferencesAppliedTo(applyTo: 'cells' | 'areas') {
        let userPreferences = [];
        for (let preferencesType of Object.keys(this.userPreferencesHandlers)) {
            let preferences = this.userPreferencesHandlers[preferencesType]['preferences'];
            for (let preferenceName of Object.keys(preferences)) {
                let preferenceApplyTo;
                if (preferences[preferenceName].applyTo) {
                    preferenceApplyTo = preferences[preferenceName].applyTo;
                } else {
                    preferenceApplyTo = this.userPreferencesHandlers[preferencesType]['applyTo'];
                }
                if (applyTo === preferenceApplyTo) {
                    preferences[preferenceName]['sourceName'] = preferenceName;
                    preferences[preferenceName]['sourceValue'] = this.cashflowGridSettings ? this.cashflowGridSettings[preferencesType][preferenceName] : null;
                    userPreferences.push(preferences[preferenceName]);
                }
            }
        }
        return userPreferences;
    }

    applyUserPreferencesForAreas() {
        let userPreferences = this.getUserPreferencesAppliedTo('areas');
        userPreferences.forEach(preference => {
            if (preference['sourceValue'] !== null) {
                preference['handleMethod'].call(this, preference);
            }
        });
    }

    /** User preferences */
    showAmountsWithDecimals(cell, area, preference): CellOptions {
        let options: CellOptions = { attributes: {}, value: null };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (!isCellMarked) {
                options.value = this.formatAsCurrencyWithLocale(Math.round(cell.value), 0);

                /** add title to the cells that has too little value and shown as 0 to show the real value on hover */
                if (cell.value > -1 && cell.value < 1 && cell.value !== 0 && Math.abs(cell.value) >= 0.01) {
                    options.attributes.title = this.formatAsCurrencyWithLocale(cell.value, 2);
                }
            }
        }

        return options;
    }

    hideZeroValuesInCells(cell, area, preference): CellOptions {
        let options: CellOptions = { value: null, classes: [] };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && (cell.value > -0.01 && cell.value < 0.01)) {
                options.value = '';
                options.classes.push('hideZeroValues');
            }
        }
        return options;
    }

    showNegativeValuesInRed(cell, area, preference): CellOptions {
        let options: CellOptions = { classes: [] };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cell.value < -0.01) {
                options.classes.push('red');
            }
        }
        return options;
    }

    addPreferenceClass(preference) {
        const className = this.userPreferencesService.getClassNameFromPreference(preference);
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).removeClass((index, classes) => {
                /** remove old setting class */
                const start = classes.indexOf(preference['sourceName']),
                      end = classes.indexOf(' ', start) === -1 ? classes.length + 1 : classes.indexOf(' ', start);
                return classes.slice(start, end);
            });
            $(`.dx-area-${area}-cell`).addClass(className);
        }
    }

    addPreferenceStyle(preference) {
        const cssProperty = _.dasherize(preference['sourceName']);
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).css(cssProperty, preference['sourceValue']);
        }
    }

    reformatCell(cell, area, preference): CellOptions {
        return { value: this.formatAsCurrencyWithLocale(cell.value) };
    }

    formatAsCurrencyWithLocale(value: number, fractionDigits = 2, locale: string = null) {
        if (!locale)
            locale = this.cashflowGridSettings.localizationAndCurrency.numberFormatting.indexOf('.') == 1 ? 'tr' : 'en-EN';
        value = value > -0.01 && value < 0.01 ? 0 : value;
        return value.toLocaleString(locale, {
            style: 'currency',
            currency: this.preferenceCurrencyId,
            maximumFractionDigits: fractionDigits,
            minimumFractionDigits: fractionDigits
        });
    }

    hideFooterBar() {
        this.cashflowGridSettings.visualPreferences.showFooterBar = false;
        this.userPreferencesService.removeLocalModel();
        this.handleBottomHorizontalScrollPosition();
        this._cashflowServiceProxy.saveCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId, this.cashflowGridSettings)
            .subscribe((result) => {  });
    }

    /** Format moment js object to the lowest interval */
    formatToLowest(date, lowestPeriod): string {
        let formatAbbr = '';
        for (let format of Object.keys(this.momentFormats)) {
            formatAbbr += `${this.momentFormats[format]}.`;
            if (format === lowestPeriod) {
                break;
            }
        }
        return date.format(formatAbbr);
    }

    /** @todo refactor */
    getCellType(cell, area) {
        let cellType;
        if (this.cellTypesCheckMethods) {
            for (let type of Object.keys(this.cellTypesCheckMethods)) {
                let method = <any>this.cellTypesCheckMethods[type];
                if (method(cell, area)) {
                    cellType = type;
                    break;
                }
            }
        }
        return cellType;
    }

    getMarkupForExtendedHeaderCell(cellObj, hideHead, fieldName) {
        let value = cellObj.cell.path[cellObj.cell.path.length - 1];
        value = fieldName === 'quarter' ? 'Q' + value : value;
        return `<div class="head-cell-expand ${hideHead ? 'closed' : ''}">
                    <div class="main-head-cell">
                        ${cellObj.cellElement.innerHTML}
                        <div class="totals">${this.l('Totals').toUpperCase()}</div>
                    </div>
                    <div class="closed-head-cell" title="${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}">
                        ${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}
                    </div>
                </div>`;
    }

    /**
     * Get the classes for the current cells such as currentYear, currentQuarter and currentMonth
       @todo refactor
     */
    getCurrentPeriodsClass(cell, area) {
        let className;
        const path = cell.path || cell.columnPath;
        if (area !== 'row' && path && path.length) {
            let fieldIndex = path.length - 1;
            let cellField = this.getColumnFields()[fieldIndex];
            let fieldCaption = cellField.caption.toLowerCase();
            let cellValue = path[fieldIndex];
            let currentDate = moment();
            if (cellField.dataType === 'date' || fieldCaption === 'week') {
                let periodFormat;
                switch (fieldCaption) {
                    case 'year'    : periodFormat = 'YYYY'; break;
                    case 'quarter' : periodFormat = 'YYYY.QQ'; break;
                    case 'month'   : periodFormat = 'YYYY.MM'; break;
                    case 'week'    : periodFormat = 'W.YYYY'; break;
                    case 'day'     : periodFormat = 'YYYY.MM.DD'; break;
                }
                let cellDate = this.getDateByPath(path, this.getColumnFields(), fieldCaption);
                let cellDateFormated = cellDate.format(periodFormat);
                let currentDateFormatted = currentDate.format(periodFormat);
                if (cellDateFormated === currentDateFormatted) {
                    className = `current${_.capitalize(fieldCaption)}`;
                } else if (cellDateFormated < currentDateFormatted) {
                    className = `prev${_.capitalize(fieldCaption)}`;
                } else if (cellDateFormated > currentDateFormatted) {
                    className = `next${_.capitalize(fieldCaption)}`;
                }
            } else if (fieldCaption === 'projected') {
                if (cellValue === Projected.Today) {
                    className = `current${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Mtd || cellValue === Projected.PastTotal) {
                    className = `prev${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Forecast || cellValue === Projected.FutureTotal) {
                    className = `next${_.capitalize(fieldCaption)}`;
                }
            } else if (fieldCaption === 'historical') {
                if (cellValue === Periods.Current) {
                    className = `current${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Periods.Historical) {
                    className = `prev${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Periods.Forecast) {
                    className = `next${_.capitalize(fieldCaption)}`;
                }
            }
        }
        return className;
    }

    /**
     * Check if date is weekend date
     * @param date
     */
    isWeekend(date) {
        /** if day number is 0 (sunday) or 6 (saturday) */
        return date.day() === 0 || date.day() === 6;
    }

    /**
     * Gets the mtd or projected 0 or 1 from the path
     * @param projected
     */
    getProjectedValueByPath(path) {
        let projectedFieldIndex = this.getAreaIndexByCaption('projected', 'column');
        return projectedFieldIndex ? path[projectedFieldIndex] : undefined;
    }

    /**
     * Hide projected row if all projected columns are expanded (except current)
     * @param cellObj
     */
    hideProjectedFields() {
        let projectedFields = this.getElementRef().nativeElement.querySelectorAll('.projectedField');
        if (projectedFields && projectedFields.length) {
            let allProjectedFieldsAreExpanded: boolean = [].every.call(projectedFields, projectedCell => {
                return projectedCell.classList.contains('dx-pivotgrid-expanded');
            });
            if (allProjectedFieldsAreExpanded) {
                /** Hide projected row */
                projectedFields[0].parentElement.classList.add('hidden');
                let dayRowElement = projectedFields[0].parentElement.nextElementSibling;
                if (dayRowElement) {
                    let currentDayElement = dayRowElement.querySelector('.currentDay');
                    if (currentDayElement) {
                        currentDayElement.classList.add('topBorder');
                    }
                }
            }
        }
    }

    /**
     * initialize the click trigger for the cell column if user click for the left empty cell
     * @param cellObj
     */
    bindCollapseActionOnWhiteSpaceColumn(cellObj) {
        let rowSpan = cellObj.cellElement.rowSpan || 1;
        let totalCell = $(cellObj.cellElement).parent().nextAll().eq(rowSpan-1).first().find('td.dx-total');
        totalCell.trigger('click');
    }

    getRequestFilterFromPath(path) {
        let requestFilter: StatsFilter = Object.assign({}, this.requestFilter);
        const datePeriod = this.formattingDate(path);
        /** if somehow user click on the cell that is not in the filter date range - return */
        if (this.requestFilter.startDate && datePeriod.endDate < this.requestFilter.startDate ||
            this.requestFilter.endDate && datePeriod.startDate > this.requestFilter.endDate) {
            return;
        }
        requestFilter.groupByPeriod = StatsFilterGroupByPeriod.Daily;
        requestFilter.startDate = this.requestFilter.startDate && moment(this.requestFilter.startDate).utc().isAfter(datePeriod.startDate) ? moment(this.requestFilter.startDate).utc() : datePeriod.startDate;
        requestFilter.endDate = this.requestFilter.endDate && moment(this.requestFilter.endDate).utc().isBefore(datePeriod.endDate ) ? moment(this.requestFilter.endDate).utc() : datePeriod.endDate;
        requestFilter.calculateStartingBalance = false;
        return requestFilter;
    }

    getDailyPeriods() {
        let dailyPeriods = [];
        let state = this.pivotGrid ? this.pivotGrid.instance.getDataSource().state() : this.stateLoad();
        if (state && state.columnExpandedPaths.length) {
            let monthIndex = this.getAreaIndexByCaption('month', 'column');
            state.columnExpandedPaths.forEach(columnPath => {
                if (columnPath.length === monthIndex + 1) {
                    this.monthsDaysLoadedPathes.push(columnPath);
                    let datePeriod = this.formattingDate(columnPath);
                    let dailyPeriod: Period = Period.fromJS({ start: datePeriod.startDate, end: datePeriod.endDate });
                    dailyPeriods.push(dailyPeriod);
                }
            });
        }
        return dailyPeriods;
    }

    isProjectedCellOfCurrentMonth(cellObj) {
        const projectedField = this.pivotGrid.instance.getDataSource().field('Projected');
        return cellObj.cell.path[projectedField.areaIndex] !== Projected.FutureTotal && cellObj.cell.path[projectedField.areaIndex] !== Projected.PastTotal;
    }

    onCellClick(cellObj) {

        let isProjectedHeaderCell = this.isProjectedHeaderCell(cellObj);
        let isProjectedCellOfCurrentMonth = isProjectedHeaderCell ? this.isProjectedCellOfCurrentMonth(cellObj) : false;

        /** Disallow collapsing of total projected and historical fields */
        if (((isProjectedHeaderCell && !isProjectedCellOfCurrentMonth) || this.isHistoricalCell(cellObj)) && cellObj.event.isTrusted) {
            cellObj.cancel = true;
        }

        /** If user clicks on current projected field expand all current projected */
        if (isProjectedHeaderCell && isProjectedCellOfCurrentMonth && !cellObj.cell.expanded) {
            cellObj.cancel = true;
            this.expandCurrentMonthProjectedColumns(cellObj.cell.path.slice(0));
        }

        /** If user click to the month header - then sent new getStats request for this month to load data for that month */
        let isMonthHeaderCell = this.isMonthHeaderCell(cellObj);
        if (isMonthHeaderCell) {
            let requestFilter = this.getRequestFilterFromPath(cellObj.cell.path);
            let monthIsCurrent = requestFilter.startDate.format('MM.YYYY') === moment().format('MM.YYYY');
            let pathCopy = cellObj.cell.path.slice();
            if (!cellObj.cell.expanded) {
                let pathForMonth = isMonthHeaderCell ? cellObj.cell.path : cellObj.cell.path.slice(0, -1);
                if (!this.monthsDaysLoadedPathes.some(arr => arr.toString() === pathForMonth.toString())) {
                    abp.ui.setBusy();
                    /** Prevent default expanding */
                    this._cashflowServiceProxy
                        .getStats(InstanceType[this.instanceType], this.instanceId, requestFilter)
                        .pluck('transactionStats')
                        .subscribe((transactions: any) => {

                            /** Update cashflow data with the daily transactions */
                            this.handleDailyCashflowData(transactions, requestFilter.startDate, requestFilter.endDate);

                            /** Reload the cashflow */
                            this.pivotGrid.instance.getDataSource().reload();

                            /** Mark the month as already expanded to avoid double data loading */
                            this.monthsDaysLoadedPathes.push(pathForMonth);

                            /** If month is not current month - expand it into days instead of total */
                            if (!monthIsCurrent && this.projectedFieldIsVisible()) {
                                this.expandMonthProjectedChilds(cellObj);
                            }
                        });
                } else {
                    /** If month is not current month - expand it into days instead of total */
                    if (!monthIsCurrent && this.projectedFieldIsVisible()) {
                        this.expandMonthProjectedChilds(cellObj);
                    }
                }

            } else {
                /** If we collapse month - collapse projected columns of current month to show them after next expand of the month */
                if (monthIsCurrent) {
                    let projectedRow = cellObj.cellElement.closest('table').querySelector('.projectedRow');
                    if (projectedRow) {
                        let collapseMonth = !projectedRow.classList.contains('hidden');
                        if (!collapseMonth) {
                            cellObj.cancel = true;
                        }
                        this.collapseCurrentMonthProjectedColums(cellObj.cell.path.slice(), collapseMonth);
                    }
                }
            }
        }

        /** If user click to Reconciliation button - call reconcile method */
        if (cellObj.event.target.classList.contains('dx-link-discard')) {
            this.discardDiscrepancy(cellObj);
        }

        /** bind the collapse action on white space column */
        if (cellObj.cell.isWhiteSpace) {
            this.bindCollapseActionOnWhiteSpaceColumn(cellObj);
        }

        if (cellObj.area === 'data') {
            if (!cellObj.cellElement.classList.contains('selectedCell')) {
                $('.selectedCell').removeClass('selectedCell');
                this.hideModifyingNumberBox();
                cellObj.cellElement.classList.add('selectedCell');
            }

            if (this.isCopyable(cellObj)) {
                let crossMovingTriangle = this._cellsCopyingService.getCrossMovingTriangle();
                cellObj.cellElement.appendChild(crossMovingTriangle);
            } else if (this._cellsCopyingService.elem) {
                this._cellsCopyingService.elem.remove();
            }
            this.selectedCell = cellObj;
            this.handleDoubleSingleClick(cellObj, null, this.handleDataCellDoubleClick.bind(this));
        }
    }

    projectedFieldIsVisible() {
        return this.pivotGrid && this.pivotGrid.instance.getDataSource().field('Projected').visible;
    }

    handleCellsSelecting(cellsToCopy) {
        this.getElementRef().nativeElement.querySelectorAll('.selectedCell').forEach(cell => {
            if (cell !== this._cellsCopyingService.copiedCell) {
                cell.classList.remove('selectedCell');
            }
        });
        if (cellsToCopy && cellsToCopy.length) {
            cellsToCopy.forEach(cell => {
                let cellObj = this.getCellObjectFromCellElement(cell);
                if (this.cellCanBeTargetOfCopy(cellObj)) {
                    /** Add selected cell */
                    cell.classList.add('selectedCell');
                }
            });
        }
    }

    handleCellsCopying(sourceCell: any, targetCells: any[]) {
        if (targetCells && targetCells.length) {
            let sourceCellObject = sourceCell instanceof HTMLTableCellElement ? this.getCellObjectFromCellElement(sourceCell) : sourceCell;

            /** Create forecasts for the cell */
            let targetCellsObj = [];
            targetCells.forEach(cell => {
                let cellObj = cell instanceof HTMLTableCellElement ? this.getCellObjectFromCellElement(cell) : cell;
                if (this.cellCanBeTargetOfCopy(cellObj)) {
                    targetCellsObj.push(cellObj);
                }
            });

            let copyItemsModels;
            if (targetCellsObj.length) {
                let targetsData = targetCellsObj.map(cell => this.getCellInfo(cell));
                let sourceCellInfo = this.getCellInfo(sourceCellObject);
                const isHorizontalCopying = this.cashflowService.isHorizontalCopying(sourceCellObject, targetCellsObj);
                this.statsDetailFilter = this.getDetailFilterFromCell(sourceCellObject);
                this._cashflowServiceProxy
                    .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                    .map(transactions => {
                        copyItemsModels = transactions && transactions.length ? this.createCopyItemsModels(transactions, sourceCellInfo, targetsData, isHorizontalCopying) : null;
                        return copyItemsModels;
                    })
                    .mergeMap(forecastModels => this.copyForecasts(forecastModels))
                    .subscribe(
                        res => {
                            if (copyItemsModels && copyItemsModels.forecasts && copyItemsModels.forecasts.length) {
                                let localItems = this.getDataItemsByCell(sourceCellObject);
                                this.createForecastsFromCopiedItems(res, copyItemsModels.forecasts, sourceCellInfo);
                                this.updateDataSource()
                                    .then(() => {
                                        this.notify.success(this.l('Cell_pasted'));
                                    });
                            }
                        }
                    );
            }
        }
    }

    updateDataSource(): Promise<any> & JQueryPromise<any> {
        this.treePathes = {};
        this.cashflowData.forEach(item => this.updateTreePathes(item));
        this.getUserPreferencesForCell.cache = {};
        this.getCellOptionsFromCell.cache = {};
        this.getNewTextWidth.cache = {};
        return this.pivotGrid.instance.getDataSource().reload();
    }

    /**
     * Expands projected child columns of current month
     * @param {number[]} path
     */
    expandCurrentMonthProjectedColumns(path: number[]) {
        let monthPath = path.slice(0, path.length - 1);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Mtd]));
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Today]));
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Forecast]));
    }

    /**
     * Collapse projected child columns of current month
     * @param {number[]} path
     */
    collapseCurrentMonthProjectedColums(path: number[], collapseMonth: boolean) {
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Mtd]));
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Today]));
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Forecast]));
        if (collapseMonth) {
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path);
        }
    }

    expandMonthProjectedChilds(cellObj) {
        let pathCopy = cellObj.cell.path.slice();
        let projectedValue = cellObj.cellElement.className.indexOf('prev') !== -1 ? Projected.PastTotal : Projected.FutureTotal;
        /** Save expanding of month in state to expand it on content ready  */
        this.fieldPathsToClick.push(pathCopy.concat([projectedValue]));
    }

    onCopy(ev) {
        this.copiedCell = this.selectedCell;
        this.notify.info(this.l('Cell_Copied'));
    }

    onPaste() {
        this.handleCellsCopying(this.copiedCell, [this.selectedCell]);
    }

    onDelete(ev) {
        let cellObj = this.selectedCell;
        let clickedCellPrefix = cellObj.cell.rowPath.slice(-1)[0] ? cellObj.cell.rowPath.slice(-1)[0].slice(0, 2) : undefined;
        if (
            this.cellIsNotHistorical(cellObj) &&
            clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
            clickedCellPrefix !== CategorizationPrefixes.AccountingType &&
            clickedCellPrefix !== CategorizationPrefixes.AccountName
        ) {
            let columnFields = this.getColumnFields();
            let lowestCaption = this.getLowestFieldCaptionFromPath(cellObj.cell.columnPath, columnFields);
            this.statsDetailFilter = this.getDetailFilterFromCell(cellObj);
            this._cashflowServiceProxy
                .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                .subscribe(result => {
                    if (result.length !== 0) {
                        let forecastIds: number[] = [];
                        let forecastDates = [];
                        result.forEach((item, i) => {
                            if (item.forecastId) {
                                forecastIds.push(item.forecastId);
                                if (!underscore.contains(forecastDates, item.forecastDate))
                                    forecastDates.push(item.forecastDate);
                            }
                        });
                        if (forecastIds.length) {
                            this._cashFlowForecastServiceProxy
                                .deleteForecasts(InstanceType[this.instanceType], this.instanceId, forecastIds)
                                .subscribe(result => {
                                    let temp = {};
                                    for (let i = this.cashflowData.length - 1; i >= 0; i--) {
                                        let item = this.cashflowData[i];

                                        if (underscore.contains(forecastIds, item.forecastId)) {
                                            this.cashflowData.splice(i, 1);
                                            if (!temp[item.forecastId])
                                                temp[item.forecastId] = { 'affectedTransactions': [] };

                                            temp[item.forecastId]['affectedTransactions'].push(item);
                                        } else {
                                            let itemForRemoveIndex = 0;
                                            forecastDates.forEach((date, i) => {
                                                if (moment(date).utc().isSame(item.date)) {
                                                    itemForRemoveIndex = i;
                                                }
                                            });
                                            if (itemForRemoveIndex)
                                                forecastDates.splice(itemForRemoveIndex, 1);
                                        }
                                    }

                                    forecastDates.forEach((date, i) => {
                                        forecastIds.forEach((id, i) => {
                                            temp[id]['affectedTransactions'].forEach(item => {
                                                this.cashflowData.push(
                                                    this.createStubTransaction({
                                                        date: item.date,
                                                        initialDate: (<any>item).initialDate,
                                                        amount: 0,
                                                        cashflowTypeId: item.cashflowTypeId,
                                                        accountId: item.accountId
                                                    }));

                                                this.updateTreePathes(item, true);
                                            });
                                        });
                                    });

                                    this.updateDataSource()
                                        .then(() => {
                                            this.notify.success(this.l('Forecasts_deleted'));
                                        });
                                });
                        }
                    }
                });
        }
    }

    cellCanBeTargetOfCopy(cellObj): boolean {
        const cellDateInterval = this.formattingDate(cellObj.cell.columnPath);
        const futureForecastsYearsAmount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
        return (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE)
            && !this.isCashflowTypeRowTotal(cellObj.cell, cellObj.area)
            && !this.isAccountingRowTotal(cellObj.cell, cellObj.area)
            && this.cellIsNotHistorical(cellObj)
            && this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)
            && cellObj.cell.columnType !== Total;
    }

    /** check the date - if it is mtd date - disallow editing, if today or projected - welcome on board */
    cellIsNotHistorical(cellObj): boolean {
        let path = cellObj.cell.path || cellObj.cell.columnPath;
        let cellDateInterval = this.formattingDate(path);
        let currentDate = moment.tz(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY', 'utc');
        return  cellDateInterval.endDate.isAfter(currentDate, 'day') ||
                currentDate.isBetween(cellDateInterval.startDate, cellDateInterval.endDate, 'day') ||
                (currentDate.isSame(cellDateInterval.startDate, 'day') && currentDate.isSame(cellDateInterval.endDate, 'day'));
    }

    handleDataCellDoubleClick(cellObj) {
        this.statsDetailFilter = this.getDetailFilterFromCell(cellObj);
        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
            .subscribe(result => {
                /**
                 * If the cell is not historical
                 * If cell is current - if amount of results is 0 - add, >1 - show details
                 * If cell is forecast - if amount of results is 0 - add, >1 - show details
                 */
                let clickedCellPrefix = cellObj.cell.rowPath.slice(-1)[0] ? cellObj.cell.rowPath.slice(-1)[0].slice(0, 2) : undefined;
                let columnFields = this.getColumnFields();
                let lowestCaption = this.getLowestFieldCaptionFromPath(cellObj.cell.columnPath, columnFields);
                if (
                    /** disallow adding historical periods */
                    this.cellIsNotHistorical(cellObj) &&
                    /** allow adding only for empty cells */
                    result.length === 0 &&
                    /** disallow adding of these levels */
                    clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountingType &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountName &&
                    /** allow adding if checked active accounts */
                    this.allowChangingForecast
                ) {
                    const cellDateInterval = this.formattingDate(cellObj.cell.columnPath);
                    const futureForecastsYearsAmount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
                    if (futureForecastsYearsAmount && !this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)) {
                        this.notify.error(this.l('ForecastIsProjectedTooFarAhead'));
                    } else {
                        this.handleForecastAdding(cellObj, result);
                    }
                } else {
                    this.showTransactionDetail(result);
                }
            });
    }

    getDetailFilterFromCell(cellObj): StatsDetailFilter {
        const datePeriod = this.formattingDate(cellObj.cell.columnPath);

        /** if somehow user click on the cell that is not in the filter date range - return null */
        if (this.requestFilter.startDate && datePeriod.endDate < this.requestFilter.startDate ||
            this.requestFilter.endDate && datePeriod.startDate > this.requestFilter.endDate) {
            return;
        }

        const isAccountCell = [PSB, PR, PT].indexOf(cellObj.cell.rowPath[0]) !== -1;
        let accountsIds = isAccountCell && cellObj.cell.rowPath[1] ?
            [cellObj.cell.rowPath[1].slice(2)] :
            this.requestFilter.accountIds || [];

        let startDate = this.requestFilter.startDate && this.requestFilter.startDate > datePeriod.startDate ? this.requestFilter.startDate : datePeriod.startDate;
        let endDate = this.requestFilter.endDate && this.requestFilter.endDate < datePeriod.endDate ? this.requestFilter.endDate : datePeriod.endDate;
        let filterParams = {
            startDate: startDate,
            endDate: endDate,
            currencyId: this.currencyId,
            accountIds: accountsIds,
            businessEntityIds: this.requestFilter.businessEntityIds || [],
            searchTerm: '',
            forecastModelId: this.selectedForecastModel ? this.selectedForecastModel.id : undefined
        };
        this.showAllVisible = false;
        this.showAllDisable = false;
        cellObj.cell.rowPath.forEach(item => {
            if (item) {
                let [ key, prefix ] = [ item.slice(2), item.slice(0, 2) ];
                let property = this.getCategoryParams(prefix)['statsKeyName'];
                filterParams[property] = key;
            } else {
                filterParams['categoryId'] = -1;
            }
        });
        return StatsDetailFilter.fromJS(filterParams);
    }

    handleForecastAdding(cellObj, details) {
        let element: HTMLElement = cellObj.cellElement;
        /** if the modifying input has already exists */
        if (this.modifyingCellNumberBox) {
            this.removeModifyingCellNumberBox();
        }
        if (!element.querySelector('span'))
            $(element).wrapInner('<span></span>');
        $(element).children().hide();
        this.oldCellPadding = window.getComputedStyle(element).padding;
        element.style.padding = '0';
        if (details.length === 1) {
            this.clickedRowResult = details[0];
        }

        let wrapper = document.createElement('div');
        wrapper.onclick = function(ev) {
            ev.stopPropagation();
        };
        let wrapperButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };

        this.modifyingCellNumberBox = new NumberBox(wrapper, {
            value: cellObj.cell.value,
            height: element.clientHeight,
            format: this.currencySymbol + ' #,###.##',
            onEnterKey: this.saveForecast.bind(this, cellObj)
        });
        this.functionButton = new Button(wrapperButton, {
            iconSrc: 'assets/common/icons/fx.svg',
            onClick: this.toggelCalculator.bind(this, event),
            elementAttr: { 'class' : 'function-button'}
        });
        element.appendChild(this.functionButton.element());
        element.appendChild(this.modifyingCellNumberBox.element());
        this.modifyingCellNumberBox.element().querySelector('input.dx-texteditor-input')['style'].fontSize = this.cashflowGridSettings.visualPreferences.fontSize;
        this.modifyingCellNumberBox.focus();
        element = null;
        this.modifyingNumberBoxCellObj = cellObj;
        this.modifyingNumberBoxStatsDetailFilter = this.statsDetailFilter;
    }

    removeModifyingCellNumberBox() {
        let parent = this.modifyingCellNumberBox.element().parentElement;
        this.modifyingCellNumberBox.dispose();
        this.modifyingCellNumberBox = null;
        this.functionButton.dispose();
        this.functionButton = null;
        if (this.saveButton) {
            this.saveButton.dispose();
            this.saveButton = null;
        }
        $('.dx-editor-cell.calculator-number-box').removeClass('dx-editor-cell');
        $('.calculator-number-box').removeClass('calculator-number-box');
        $(parent).children().show();
        parent.style.padding = this.oldCellPadding;
        this.closeCalculator();
        this.modifyingNumberBoxCellObj = null;
        this.modifyingNumberBoxStatsDetailFilter = null;
        this.detailsModifyingNumberBoxCellObj = null;
    }

    showTransactionDetail(details) {
        this.statsDetailResult = details.map(detail => {
            this.removeLocalTimezoneOffset(detail.date);
            this.removeLocalTimezoneOffset(detail.forecastDate);
            return detail;
        });
        this.detailsContainsHistorical = this.statsDetailResult.some(item => !item.forecastId) ? 'always' : 'none';

        setTimeout(() => {
            let height = this._cacheService.get(this.cashflowDetailsGridSessionIdentifier);
            if (height) {
                let cashflowWrapElement = <HTMLElement>document.querySelector('.cashflow-wrap');
                cashflowWrapElement.style.height = height + 'px';
            }
            this.handleBottomHorizontalScrollPosition();
            this.handleVerticalScrollPosition();
        }, 0);
    }

    onTransactionDetailsResize($event) {
        this.cashFlowGrid.height = $event.height;
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    onTransactionDetailsResizeEnd($event) {
        this._cacheService.set(this.cashflowDetailsGridSessionIdentifier, $event.height);
    }

    saveForecast() {
        let [savedCellObj, event] = Array.from(arguments);
        savedCellObj = savedCellObj || this.modifyingNumberBoxCellObj;
        let newValue = event ? event.component.option('value') : this.modifyingCellNumberBox.option('value');

        if (+newValue !== 0) {
            abp.ui.setBusy();
            let forecastModel;
            let cashflowTypeId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.CashflowType);
            let categoryId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.Category);
            let subCategoryId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.SubCategory);
            let transactionDescriptor = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor);
            let currentDate = this.cashflowService.getUtcCurrentDate();
            let targetDate = this.modifyingNumberBoxStatsDetailFilter.startDate.isSameOrAfter(currentDate) ? moment(this.modifyingNumberBoxStatsDetailFilter.startDate).utc() : currentDate;
            let activeBankAccountsIds = this.cashflowService.getActiveAccountIds(this.bankAccounts, this.modifyingNumberBoxStatsDetailFilter.accountIds);
            let accountId = activeBankAccountsIds && activeBankAccountsIds.length ? activeBankAccountsIds[0] : (this.modifyingNumberBoxStatsDetailFilter.accountIds[0] || this.bankAccounts[0].id);
            forecastModel = new AddForecastInput({
                forecastModelId: this.selectedForecastModel.id,
                bankAccountId: accountId,
                date: targetDate,
                startDate: this.modifyingNumberBoxStatsDetailFilter.startDate,
                endDate: this.modifyingNumberBoxStatsDetailFilter.endDate,
                cashFlowTypeId: cashflowTypeId,
                categoryId: subCategoryId || categoryId,
                transactionDescriptor: transactionDescriptor,
                currencyId: this.currencyId,
                amount: newValue
            });

            this._cashFlowForecastServiceProxy.addForecast(
                InstanceType10[this.instanceType],
                this.instanceId,
                forecastModel
            ).subscribe(
                res => {
                    let dateWithOffset = moment(targetDate).add(new Date(<any>targetDate).getTimezoneOffset(), 'minutes');
                    /** Update data locally */
                    this.cashflowData.push(this.createStubTransaction({
                        accountId: accountId,
                        count: 1,
                        amount: newValue,
                        date: dateWithOffset,
                        initialDate: targetDate,
                        forecastId: res
                    }, savedCellObj.cell.rowPath));
                    this.getApiDataSource();
                    this.pivotGrid.instance.getDataSource().reload()
                        .then(() => {
                            this.notify.success(this.l('Forecasts_added'));
                            abp.ui.clearBusy();
                        });

                });
        }
        this.removeModifyingCellNumberBox();
    }

    /**
     * Return the date object from the cell
     * @param path
     * @param columnFields
     * @return {any}
     */
    getDateByPath(columnPath, columnFields, lowestCaption ?: string) {
        lowestCaption = lowestCaption || this.getLowestFieldCaptionFromPath(columnPath, columnFields);
        let date = moment.unix(0).tz('UTC');
        columnFields.every(dateField => {
            let areaIndex = this.getAreaIndexByCaption(dateField.caption, 'column');
            let fieldValue = columnPath[areaIndex];
            if (dateField.dataType === 'date') {
                let method = dateField.groupInterval === 'day' ? 'date' : dateField.groupInterval;
                if (fieldValue) {
                    fieldValue = dateField.groupInterval === 'month' ? fieldValue - 1 : fieldValue;
                    /** set the new interval to the moment */
                    date[method](fieldValue);
                }
            } else if (dateField.caption === 'Week') {
                let weekNumber = JSON.parse(fieldValue).weekNumber;
                date.isoWeek(weekNumber);
            } else if (dateField.caption === 'Projected') {
                let currentDate = moment().date();
                if (fieldValue) {
                    if (fieldValue === Projected.Today) {
                        date.date(currentDate);
                    } else if (fieldValue === Projected.Mtd || fieldValue === Projected.PastTotal) {
                        date.date(1);
                    } else if (fieldValue === Projected.Forecast || fieldValue === Projected.FutureTotal) {
                        date.date(currentDate + 1);
                    }
                }
            }
            return dateField.caption.toLowerCase() !== lowestCaption;
        });
        return date;
    }

    getDateFields(columnFields, lowestInterval) {
        let result = [];
        columnFields.every(field => {
            if (field.dataType === 'date') {
                result.push(field);
            }
            if (field.groupInterval === lowestInterval) {
                return false;
            }
            return true;
        });
        return result;
    }

    getLowestFieldCaptionFromPath(path, columnFields) {
        let lastOpenedColumnIndex = path.length - 1;
        let lastOpenedField = columnFields[lastOpenedColumnIndex];
        return lastOpenedField ? lastOpenedField.caption.toLowerCase() : null;
    }

    customCurrency = value => {
        return this.formatAsCurrencyWithLocale(value);
    }

    formattingDate(path): CellInterval {
        let columnFields = {};
        this.getColumnFields().forEach(item => {
            columnFields[item.caption.toLowerCase()] = item.areaIndex;
        });

        let startDate: moment.Moment = moment.utc('1970-01-01');
        let endDate: moment.Moment = moment.utc('1970-01-01');
        let year = path[columnFields['year']];
        let quarter = path[columnFields['quarter']];
        let month = path[columnFields['month']];
        let week = path[columnFields['week']];
        let day = path[columnFields['day']];
        let projected = path[columnFields['projected']];

        startDate.year(year);
        endDate.year(year).endOf('year');
        if (quarter) {
            startDate.quarter(quarter);
            endDate.quarter(quarter).endOf('quarter');
        }
        if (month) {
            startDate.month(month - 1);
            endDate.month(month - 1).endOf('month');
        }
        if (day) {
            startDate.date(day);
            endDate.date(day).endOf('day');
        } else {
            if (week) {
                let weekInfo = JSON.parse(week);
                startDate = moment(weekInfo.startDate).utc();
                endDate = moment(weekInfo.endDate).utc();
            } else if (projected) {
                let currentDate = moment().date();
                /** Exclude projected */
                if (projected === Projected.Forecast) {
                    startDate.date(currentDate + 1);
                    /** or mtd dates */
                } else if (projected === Projected.Mtd) {
                    endDate.date(currentDate - 1);
                } else if (projected === Projected.Today) {
                    startDate.date(currentDate);
                    endDate.date(currentDate);
                }
            }
        }

        return {startDate: startDate, endDate: endDate};
    }

    closeTransactionsDetail() {
        this.statsDetailResult = undefined;
        this.showAllVisible = false;
        this.showAllDisable = false;
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    reclassifyTransactions($event) {
        /** get only transactions, filter out forecasts and adjustments */
        let transactions = this.cashFlowGrid.instance.getSelectedRowKeys().filter(item => item.date && item.cashflowTypeId !== StartedBalance);
        if (transactions.length) {
            this.dialog.open(RuleDialogComponent, {
                panelClass: 'slider', data: {
                    instanceId: this.instanceId,
                    instanceType: this.instanceType,
                    transactions: transactions.map((obj) => {
                        return {
                            Date: obj.date,
                            Description: obj.description,
                            TypeName: '',
                            Amount: obj.credit || -obj.debit
                        };
                    }),
                    transactionIds: transactions
                        .map((obj) => {
                            return obj.id;
                        }),
                    refershParent: this.refreshDataGrid.bind(this)
                }
            }).afterClosed().subscribe(result => { });
        }
    }

    /**
     * Find if the group has childs by path and fields list
     * @param path - the array with the path
     * @param object - the tree with the data
     * @return {boolean}
     */
    hasChildsByPath(path): boolean {
        let cellPath = path.join(',');
        let keys = Object.keys(this.treePathes);
        return path.slice(-1)[0] && keys.some(path => {
            let currentPathIndex = path.indexOf(cellPath);
            return currentPathIndex !== -1 && path.split(',').length > cellPath.split(',').length;
        });
    }

    /**
     *  recalculates sum of the starting balance (including previous totals)
     *  and recalculates ending cash positions values (including previous totals)
     *  @param summaryCell
     *  @return {number}
     */
    calculateSummaryValue() {
        return (summaryCell: DevExpress.ui.dxPivotGridSummaryCell) => {

            if (!this.cashflowGridSettings.general.showBalanceDiscrepancy && this.isCellDiscrapencyCell(summaryCell)) {
                return null;
            }

            /** To hide rows that not correspond to the search */
            if (this.filterBy && summaryCell.field('row')) {
                if (!this.rowFitsToFilter(summaryCell, this.filterBy)) {
                    return null;
                }
            }

            let prevWithParent = this.getPrevWithParent(summaryCell);

            /** calculation for ending cash position value */
            if (prevWithParent !== null && this.isColumnGrandTotal(summaryCell)) {
                return this.modifyGrandTotalSummary(summaryCell);
            }

            /** if cell is starting balance account cell - then add account sum from previous period */
            if (prevWithParent !== null && (this.isStartingBalanceAccountCell(summaryCell))) {
                return this.modifyStartingBalanceAccountCell(summaryCell, prevWithParent);
            }

            /** If the column is starting balance column but without prev - calculate */
            if (this.isStartingBalanceAccountCell(summaryCell)) {
                return this.getCurrentValueForStartingBalanceCell(summaryCell);
            }

            /** For proper grand total calculation and proper sorting
             *  If the grand total is balance or ending cash position cell -
             *  get the previous value - not the total of every cell
             */
            if (this.isRowGrandTotal(summaryCell) && (this.isStartingBalanceAccountCell(summaryCell) || this.isEndingBalanceAccountCell(summaryCell))) {
                let cellAccount = this.initialData.bankAccountBalances.find(bankAccount => bankAccount.bankAccountId === summaryCell.value(summaryCell.field('row')));
                return cellAccount ? cellAccount.balance : 0;
            }

            /** if cell is ending cash position account summary cell */
            if (prevWithParent !== null && this.isEndingBalanceAccountCell(summaryCell)) {
                return this.modifyEndingBalanceAccountCell(summaryCell, prevWithParent);
            }

            /** if the value is a balance value -
             *  then get the prev columns grand total for the column and add */
            if (prevWithParent !== null && this.isCellIsStartingBalanceSummary(summaryCell)) {
                return this.modifyStartingBalanceSummaryCell(summaryCell, prevWithParent);
            }

            if (this.isCellIsStartingBalanceSummary(summaryCell)) {
                return this.getCurrentValueForStartingBalanceCell(summaryCell, false);
            }

            /** To hide rows that has empty header (except level1) */
            let value = this.cellRowIsNotEmpty(summaryCell) ?
                        summaryCell.value() || 0 :
                        null;

            return value;
        };
    }

    /**
     * Method that check if the cell of format CTI (Category Type Income) is fit to the filter
     * It looks all pathes where the cell value is presented and if any of the elements of these pathes
     * contains filter string - return true
     * @param rowInfo - info of format (CategoryPrefixes + Key)
     * @param filter - string for which to filter
     * @return {boolean}
     */
    rowFitsToFilter(summaryCell, filter: string) {
        let cellsToCheck = [];
        let rowInfo = summaryCell.value(summaryCell.field('row').dataField) || '';
        let result = false;
        /** add the rowInfo to cash to avoid checking for every cell */
        if (!this.cachedRowsFitsToFilter.has(rowInfo) || !rowInfo) {
            Object.keys(this.treePathes).forEach(strPath => {
                let arrPath = strPath.split(',');
                if (arrPath.indexOf(rowInfo) !== -1) {
                    /** Handle for uncategorized */
                    if (!rowInfo) {
                        let parent = summaryCell.parent('row');
                        let parentInfo = parent.value(parent.field('row').dataField);
                        if (arrPath.indexOf(parentInfo) !== -1) {
                            cellsToCheck = underscore.union(cellsToCheck, arrPath);
                        }
                    } else {
                        cellsToCheck = underscore.union(cellsToCheck, arrPath);
                    }
                }
            });
            result = cellsToCheck.some(value => {
                if (value) {
                    let [prefix, key] = [value.slice(0, 2), value.slice(2)];
                    let dataSource = this.getNamesSourceLink(prefix);
                    if (dataSource) {
                        let possibleIds = [];
                        for (let id of Object.keys(dataSource)) {
                            let cellInfo = {value: value};
                            let customizedFieldText = this.customizeFieldText(cellInfo);
                            if (customizedFieldText && customizedFieldText.toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
                                possibleIds.push(id);
                            }
                        }
                        if (possibleIds.indexOf(key) !== -1) {
                            return true;
                        }
                    } else {
                        if (key.toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
                            return true;
                        }
                    }
                } else {
                    if (this.l('Unclassified').toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
                        return true;
                    }
                }
                return false;
            });
            this.cachedRowsFitsToFilter.set(rowInfo, result);
        } else {
            result = this.cachedRowsFitsToFilter.get(rowInfo);
        }
        return result;
    }

    /**
     * Return whether cells are sequence in pivot grid
     * @param current - current cell
     * @param prev - prev cell (use summaryCell.prev('column', true))
     * @return {boolean}
     */
    cellsAreSequence(current, prev) {
        if (current.field('column') && current.field('column')['groupInterval'] === 'year') {
            return true;
        }
        let currentCellParent = current.parent('column');
        let prevCellParent = prev.parent('column');
        while (true) {
            if (
                underscore.isEqual(currentCellParent, prevCellParent) ||
                currentCellParent.prev() === prevCellParent ||
                (
                    currentCellParent.field('column') &&
                    currentCellParent.field('column')['groupInterval'] !== 'year' &&
                    currentCellParent.prev('column', true) === prevCellParent
                )
            ) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * Get real previous cell for the summaryCell (alternative for summaryCell.prev('column', true) and
     *  summaryCell.prev('column', false) )
     * @param summaryCell
     * @return {any}
     */
    getPrevWithParent(summaryCell) {
        let counter = this.getColumnFields().length - 1;
        let prev = summaryCell.prev('column', true);
        while (counter > 0) {
            if (prev === null || !this.cellsAreSequence(summaryCell, prev)) {
                let parent = summaryCell.parent('column');
                if (parent) {
                    prev = parent.prev('column', true);
                    summaryCell = parent;
                }
                counter--;
            } else {
                break;
            }
        }
        return prev;
    }

    getCurrentValueForStartingBalanceCell(summaryCell, getWholePeriod = false) {
        let cellData = <any>this.getCellData(summaryCell, summaryCell.value(summaryCell.field('row')).slice(2), StartedBalance);
        if (!getWholePeriod) {
            cellData.quarter = cellData.quarter || 1,
                cellData.month = cellData.month || 1,
                cellData.day = cellData.day || 1;
        }
        return this.calculateCellValue(cellData, this.adjustmentsList);
    }

    /**
     * Modify the value of the starting balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceAccountCell(summaryCell, prevWithParent) {
        let prevEndingAccountValue = this.getCellValue(prevWithParent, Total),
            prevIsFirstColumn = this.getPrevWithParent(prevWithParent) ? true : false,
            prevCellValue = prevWithParent ? prevWithParent.value(prevIsFirstColumn) || 0 : 0,
            prevReconciliation = this.getCellValue(prevWithParent, Reconciliation);
        return prevEndingAccountValue + prevCellValue + prevReconciliation;
    }

    /**
     * Modify the value of the starting balance summary cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceSummaryCell(summaryCell, prevWithParent) {
        let prevTotal = prevWithParent.slice(0, PT),
            currentCellValue = summaryCell.value() || 0,
            prevTotalValue = prevTotal ? prevTotal.value() || 0 : 0,
            prevIsFirstColumn = this.getPrevWithParent(prevWithParent) ? true : false,
            prevCellValue = prevWithParent ? prevWithParent.value(prevIsFirstColumn) || 0 : 0,
            prevReconciliation = prevWithParent.slice(0, PR),
            prevReconciliationValue = prevReconciliation ? prevReconciliation.value() || 0 : 0;
        return currentCellValue + prevTotalValue + prevCellValue + prevReconciliationValue;
    }

    /**
     * Modify the ending balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyEndingBalanceAccountCell(summaryCell, prevWithParent) {
        let prevEndingAccountValue = this.getCellValue(prevWithParent, Total, true),
            currentCellValue = summaryCell.value() || 0,
            reconciliationTotal = this.getCellValue(summaryCell, Reconciliation);
        return currentCellValue + prevEndingAccountValue + reconciliationTotal;
    }

    /**
     * Modify the total balance summary cell to have a proper calculation
     * @param summaryCell
     * @return {number}
     */
    modifyGrandTotalSummary(summaryCell) {
        let startedBalanceCell = summaryCell.slice(0, PSB),
            startedBalanceCellValue = startedBalanceCell ? (startedBalanceCell.value(true) || 0) : 0,
            currentCellValue = summaryCell.value() || 0,
            reconciliationTotal = summaryCell.slice(0, PR),
            reconciliationTotalValue = reconciliationTotal && reconciliationTotal.value() || 0;
        return currentCellValue + startedBalanceCellValue + reconciliationTotalValue;
    }

    /**
     * Gets the cell value from the specific cell
     * cellData - summaryCell object of devextreme
     * target - StartedBalance | Total | Reconciliation
     */
    getCellValue(summaryCell, target, isCalculatedValue = underscore.contains([StartedBalance, Reconciliation], target)) {

        let targetPeriodAccountCachedValue;
        const accountId = summaryCell.value(summaryCell.field('row'), true).slice(2),
              targetPeriodCell = summaryCell.parent('row') ? summaryCell.parent('row').slice(0, CategorizationPrefixes.CashflowType + target) : null,
              targetPeriodAccountCell = targetPeriodCell ? targetPeriodCell.child('row', CategorizationPrefixes.AccountName + accountId) : null,
              cellData = this.getCellData(summaryCell, accountId, target);

            /** if we haven't found the value from the another period -
             *  then it hasn't been expanded and we should find out whether the value is in cash */
            if (targetPeriodAccountCell === null) {
                let key = cellData.toString();
                /** if we haven't found the value in cash - then we should calculate the value in the cashflow data by ourselves */
                if (!this.anotherPeriodAccountsValues.has(key)) {
                    /** calculate the cell value using the cell data and cashflowData */
                    targetPeriodAccountCachedValue = this.calculateCellValue(cellData, this.cashflowData);
                    this.setAnotherPeriodAccountCachedValue(key, targetPeriodAccountCachedValue);
                } else {
                    targetPeriodAccountCachedValue = this.anotherPeriodAccountsValues.get(key);
                }
            }
            //else {
            //    /** add the prevEndingAccount value to the cash */
            //    this.setAnotherPeriodAccountCachedValue(cellData.toString(), targetPeriodAccountCell.value(isCalculatedValue));
            //}

        return targetPeriodAccountCachedValue ?
               targetPeriodAccountCachedValue :
               (targetPeriodAccountCell ? targetPeriodAccountCell.value(isCalculatedValue) || 0 : 0);
    }

    getCellData(summaryCell, accountId, cashflowTypeId) {
        const groupInterval = summaryCell.field('column') ? summaryCell.field('column').groupInterval || 'projected' : 'historical',
              columnValue = summaryCell.value(summaryCell.field('column')),
              /** object with cell data as the key for Map object cash */
              cellData = {
                  'cashflowTypeId': cashflowTypeId,
                  'accountId': accountId,
                  [groupInterval]: columnValue,
                  /** method for creating the key for cash from the object props and values */
                  toString() {
                      let str = '';
                      for (let prop in this) {
                          if (typeof this[prop] !== 'function') {
                              str += prop.charAt(0) + this[prop];
                          }
                      }
                      return str;
                  }
              };
        let parent = summaryCell ? summaryCell.parent() : null;
        /** add to the cell data other date intervals */
        if (parent) {
            while (parent.field('column')) {
                if (parent.field('column').dataType === 'date') {
                    let parentGroupInterval = parent.field('column').groupInterval,
                        parentColumnValue = parent.value(parent.field('column'));
                    cellData[parentGroupInterval] = parentColumnValue;
                }
                parent = parent.parent();
            }
        }
        return cellData;
    }

    /**
     * Calculates the value of the cell using the cell data and cashflowData array
     * @param cellData
     */
    calculateCellValue(cellData, dataArray) {
        let cellValuePerformance = performance.now();
        let currentDateDate = moment.tz(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY', 'utc').date();
        /** {cashflowTypeId: 'T', accountId: 10, quarter: 3, year: 2015, month: 5} */
        let value = dataArray.reduce((sum, cashflowData) => {
            let date = cashflowData.initialDate || cashflowData.date;
            if (
                cashflowData.cashflowTypeId === cellData.cashflowTypeId &&
                /** if account id is B - then we should get all accounts */
                (cellData.accountId === StartedBalance || cellData.accountId === Total || cashflowData.accountId == cellData.accountId) &&
                (!cellData.year || (cellData.year === date.year())) &&
                (!cellData.quarter || (cellData.quarter === date.quarter())) &&
                (!cellData.month || (cellData.month - 1 === date.month())) &&
                ((cellData.day && cellData.day === date.date()) ||
                (!cellData.day && !cellData.projected) ||
                (cellData.projected &&
                ((cellData.projected === Projected.Mtd && date.date() < currentDateDate) ||
                (cellData.projected === Projected.Today && date.date() === currentDateDate) ||
                (cellData.projected === Projected.Forecast && date.date() > currentDateDate))))
            ) {
                sum += cashflowData.amount;
            }
            return sum;
        }, 0);

        return value;
    }

    /** set the prev ending account value to the cash */
    setAnotherPeriodAccountCachedValue(key, value) {
        this.anotherPeriodAccountsValues.set(key, value);
    }

    isColumnGrandTotal(summaryCell) {
        return summaryCell.field('row') !== null &&
               summaryCell.value(summaryCell.field('row')) === PT;
    }

    isRowGrandTotal(summaryCell) {
        return summaryCell.field('column') === null;
    }

    isStartingBalanceAccountCell(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'level1' &&
            summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === PSB;
    }

    isCellIsStartingBalanceSummary(summaryCell): boolean {
        return summaryCell.field('row') !== null && summaryCell.value(summaryCell.field('row')) === (CategorizationPrefixes.CashflowType + StartedBalance);
    }

    isCellDiscrapencyCell(summaryCell): boolean {
        let parentCell = summaryCell.parent('row');
        return (summaryCell.field('row') !== null && summaryCell.value(summaryCell.field('row')) === (CategorizationPrefixes.CashflowType + Reconciliation)) ||
            (parentCell !== null && parentCell.value(parentCell.field('row')) === (CategorizationPrefixes.CashflowType + Reconciliation));
    }

    cellRowIsNotEmpty(summaryCell) {
        return summaryCell.field('row') &&
                (
                    summaryCell.value(summaryCell.field('row').dataField) !== undefined ||
                    summaryCell.field('row').dataField === 'level1'
                );
    }

    isEndingBalanceAccountCell(summaryCell) {
        return summaryCell.field('row') !== null &&
               summaryCell.field('row').dataField === 'level1' &&
               summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === PT;
    }

    /**
     * Change moment date to the offset of local timezone
     * @param date
     */
    removeLocalTimezoneOffset(date) {
        if (date) {
            let offset = new Date(date).getTimezoneOffset();
            date.add(offset, 'minutes');
        }
    }

    addLocalTimezoneOffset(date) {
        if (date) {
            let offset = new Date(date).getTimezoneOffset();
            date.add(-offset, 'minutes');
        }
    }

    showPreferencesDialog() {
        this.dialog.open(PreferencesDialogComponent, {
            panelClass: 'slider',
            data: {
                instanceId: this.instanceId,
                instanceType: this.instanceType,
                localization: this.localizationSourceName
            }
        }).afterClosed().subscribe(options => {
            if (options && options.update) {
                this.refreshDataGridWithPreferences(options);
            }
        });
    }

    /**
     * Method for sorting pivot grid
     * @param {string} name
     */
    resortPivotGrid(sortOptions: any, event: any) {
        sortOptions.sortOrder = event.itemElement.classList.contains('desc') ? 'asc' : 'desc';
        $(event.itemElement.parentElement).children().removeClass('asc desc');
        event.itemElement.classList.add(sortOptions.sortOrder);
        this.apiTableFields.filter(field => field.resortable).forEach(field => {
            this.resetFieldSortOptions(field.caption);
            this.pivotGrid.instance.getDataSource().field(field.caption, sortOptions);
        });
        this.pivotGrid.instance.getDataSource().load();
    }

    resetFieldSortOptions(filterName) {
        this.pivotGrid.instance.getDataSource().field(filterName, {
            'sortBy': null,
            'sortBySummaryField': null,
            'sortBySummaryPath': null
        });
    }

    /** Begin loading animation */
    startLoading() {
        abp.ui.setBusy();
        let pivotGridElement = document.querySelector('.pivot-grid');
        if (pivotGridElement) pivotGridElement.classList.add('invisible');
        pivotGridElement = null;
    }

    /** Finish loading animation */
    finishLoading() {
        abp.ui.clearBusy();
        let pivotGridElement = document.querySelector('.pivot-grid');
        if (pivotGridElement) pivotGridElement.classList.remove('invisible');
    }

    searchValueChange(value) {
        this.searchValue = value;

        if (this.searchValue) {
            this.showAllVisible = true;
            this.showAllDisable = true;
            let filterParams = {
                startDate: this.requestFilter.startDate,
                endDate: this.requestFilter.endDate,
                currencyId: this.currencyId,
                accountIds: this.requestFilter.accountIds || [],
                businessEntityIds: this.requestFilter.businessEntityIds || [],
                searchTerm: this.searchValue
            };
            this.statsDetailFilter = StatsDetailFilter.fromJS(filterParams);
            this._cashflowServiceProxy
                .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                .subscribe(result => {
                    this.showTransactionDetail(result);
                });
        } else {
            this.statsDetailResult = null;
            this.closeTransactionsDetail();
        }
    }

    refreshTransactionDetail(showAll = true) {
        this.showAllVisible = this.searchValue && !showAll ?  true : false;
        this.statsDetailFilter.searchTerm = showAll ? '' : this.searchValue;

        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
            .subscribe(result => {
                this.showTransactionDetail(result);
            });
    }

    detailsCellIsEditable(e) {
        return e.data && e.data.forecastId && ['forecastDate', 'description', 'debit', 'credit'].indexOf(e.column.dataField) !== -1;
    }

    onDetailsCellPrepared(e) {
        if (e.rowType === 'data') {
            if (this.detailsCellIsEditable(e)) {
                e.cellElement.classList.add('editable');
            }

            if (e.column.dataField === 'status') {
                e.cellElement.classList.add('statusField', e.data.status.toLowerCase());
            }

            if (e.column.dataField === 'cashflowTypeId') {
                let className;
                switch (e.data.cashflowTypeId) {
                    case Income: className = 'inflows'; break;
                    case Expense: className = 'outflows'; break;
                }
                if (className) {
                    e.cellElement.classList.add(className);
                }
            }
        }
    }

    onDetailsCellClick(e) {
        if (!e.cellElement.classList.contains('dx-focused'))
            this.hideModifyingNumberBox();

        this.handleDoubleSingleClick(e, this.onDetailsCellSingleClick.bind(this), this.onDetailsCellDoubleClick.bind(this));

        if (e.rowType === 'data') {
            if (!e.cellElement.classList.contains('selectedCell')) {
                $(e.element).find('.selectedCell').removeClass('selectedCell');
                e.cellElement.classList.add('selectedCell');
            }
        }
    }

    onDetailsCellSingleClick(e) {
        if (e.rowType === 'data' && e.column.dataField == 'description' && !e.key.forecastId) {
            this.transactionId = e.data.id;
            this.transactionInfo.targetDetailInfoTooltip = '#transactionDetailTarget-' + this.transactionId;
            this.transactionInfo.toggleTransactionDetailsInfo();
        }
    }

    onDetailsCellDoubleClick(e) {
        if (e.column.dataField == 'forecastDate' || e.column.dataField == 'description' || e.column.dataField == 'accountNumber')
            e.component.editCell(e.rowIndex, e.column.dataField);

        if (e.column.dataField == 'debit' || e.column.dataField == 'credit')
            this.onAmountCellEditStart(e);
    }

    /**
     * Editing only for forecasts
     * @param e
     */
    onDetailsEditingStart(e) {
        if (e.data.date) {
            e.cancel = true;
        }
    }

    /** If date is lower then the current date - return false */
    validateForecastDate = e => {
        let currentDate = this.cashflowService.getUtcCurrentDate();
        let timezoneOffset = e.value.getTimezoneOffset();
        let forecastDate = moment(e.value).utc().subtract(timezoneOffset, 'minutes');
        let dateIsValid = forecastDate.isSameOrAfter(currentDate);
        if (!dateIsValid) {
            this.notify.error(this.l('ForecastDateUpdating_validation_message'));
        }
        return dateIsValid;
    }

    onDetailsRowPrepared(e) {
        if (e.rowType === 'data' && !e.data.date) {
            e.rowElement.classList.add('forecastRow');
        }

        if (e.rowType === 'data' && e.data.status === CashFlowStatsDetailDtoStatus.Projected) {
            e.rowElement.classList.add('projected');
        }

        if (e.rowType === 'data' && e.data.cashflowTypeId === StartedBalance) {
            e.rowElement.classList.add('adjustmentRow');
        }
    }

    onDetailsRowUpdating(e) {
        /** Send request for updating the row */
        let paramName = Object.keys(e.newData)[0];
        /** add minus sign for debit values */
        let paramValue = paramName === 'debit' ? -e.newData[paramName] : e.newData[paramName];
        if (e.newData[paramName] !== null) {
            let paramNameForUpdateInput = this.mapParamNameToUpdateParam(paramName);
            let data = {
                id: e.key.id,
                [paramNameForUpdateInput]: paramValue
            };

            if (data['date']) {
                let momentDate = moment(data['date']);
                this.addLocalTimezoneOffset(momentDate);
                data['date'] = momentDate.toDate();
            }

            let forecastMethod: Observable<void>;
            if (data['amount'] === 0) {
                forecastMethod = this._cashFlowForecastServiceProxy
                    .deleteForecast(
                        InstanceType10[this.instanceType],
                        this.instanceId,
                        data.id
                    );

            } else {
                /* Set descriptor */
                if (paramName != 'description') {
                    data[this.mapParamNameToUpdateParam('description')] = e.oldData['description'];
                }
                /* Set forecast category */
                let forecastData = this.cashflowData.find(x => x.forecastId == e.key.id);
                data['categoryId'] = forecastData.subCategoryId || forecastData.categoryId;

                forecastMethod = this._cashFlowForecastServiceProxy
                    .updateForecast(
                        InstanceType10[this.instanceType],
                        this.instanceId,
                        UpdateForecastInput.fromJS(data)
                    );
            }

            let deferred = $.Deferred();
            e.cancel = deferred.promise();
            forecastMethod.subscribe(res => {
                /** Remove opposite cell */
                if (paramName === 'debit' || paramName === 'credit') {
                    let oppositeParamName = paramName === 'debit' ? 'credit' : 'debit';
                    if (e.oldData[oppositeParamName] !== null) {
                        let rowKey = this.cashFlowGrid.instance.getRowIndexByKey(e.key);
                        /** remove the value of opposite cell */
                        this.cashFlowGrid.instance.cellValue(rowKey, oppositeParamName, null);
                    }
                }

                let hideFromCashflow = paramNameForUpdateInput == 'accountId' && !underscore.contains(this.selectedBankAccounts, paramValue);
                this.deleteStatsFromCashflow(paramNameForUpdateInput, paramValue, e.key.id, e.oldData[paramName], hideFromCashflow);

                this.getCellOptionsFromCell.cache = {};
                this.pivotGrid.instance.getDataSource().reload();
                deferred.resolve().done(() => {
                    if (data['amount'] === 0) {
                        this.statsDetailResult.every((v, index) => {
                            if (v == e.key) {
                                this.statsDetailResult.splice(index, 1);
                                return false;
                            }
                            return true;
                        });
                    }
                });
            }, error => {
                deferred.resolve(true);
                e.component.cancelEditData();
            });
        }
    }

    deleteStatsFromCashflow(paramNameForUpdateInput, paramValue, key, oldDataDate, hideFromCashflow) {
        hideFromCashflow = hideFromCashflow || (paramNameForUpdateInput == 'amount' && paramValue == 0);

        let affectedTransactions: TransactionStatsDto[] = [];
        let sameDateTransactionExist = false;
        for (let i = this.cashflowData.length - 1; i >= 0; i--) {
            let item = this.cashflowData[i];

            if (item.forecastId == key) {
                if (hideFromCashflow) {
                    this.cashflowData.splice(i, 1);
                }
                affectedTransactions.push(item);
            } else if (paramNameForUpdateInput == 'date' && moment(oldDataDate).utc().isSame(item.date)) {
                sameDateTransactionExist = true;
            }
        }

        affectedTransactions.forEach(item => {
            if (!sameDateTransactionExist && (paramNameForUpdateInput == 'date' || hideFromCashflow)) {
                this.cashflowData.push(
                    this.createStubTransaction({
                        date: item.date,
                        initialDate: (<any>item).initialDate,
                        amount: 0,
                        cashflowTypeId: item.cashflowTypeId,
                        accountId: item.accountId
                    }));
                sameDateTransactionExist = true;
            }

            if (paramNameForUpdateInput == 'transactionDescriptor' || hideFromCashflow) {
                this.updateTreePathes(item, true);
            }

            if (paramNameForUpdateInput == 'date') {
                item[paramNameForUpdateInput] = moment(paramValue).utc();
                item['initialDate'] = moment(paramValue).utc().subtract((<Date>paramValue).getTimezoneOffset(), 'minutes');
            } else {
                item[paramNameForUpdateInput] = paramValue;
            }

            if (paramNameForUpdateInput == 'transactionDescriptor') {
                this.addCategorizationLevels(item);
            }
        });

    }
    mapParamNameToUpdateParam(paramName) {
        let detailsParamsToUpdateParams = {
            'forecastDate': 'date',
            'credit': 'amount',
            'debit': 'amount',
            'description': 'transactionDescriptor',
            'accountId': 'bankAccountId'
        };

        return detailsParamsToUpdateParams[paramName];
    }

    detailsDescriptionColumnWidth() {
        return window.innerWidth > 1920 ? '30%' : '20%';
    }

    detailsCommentsColumnWidth() {
        const buttonsWidthWithCommentsTitle = 340;
        let commentsWidth = window.innerWidth * 0.23;
        return commentsWidth > buttonsWidthWithCommentsTitle ? window.innerWidth > 1600 ? '33%' : '23%' : buttonsWidthWithCommentsTitle;
    }

    setReportPeriodFilter(period) {
        let dateFilter: FilterModel = underscore.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });

        if (period.start) {
            let from = new Date(period.start + '-01-01');
            from.setTime(from.getTime() + from.getTimezoneOffset() * 60 * 1000);
            dateFilter.items['from'].setValue(from, dateFilter);
        } else {
            dateFilter.items['from'].setValue('', dateFilter);
        }

        if (period.end) {
            let end = new Date(period.end + '-12-31');
            end.setTime(end.getTime() + end.getTimezoneOffset() * 60 * 1000);
            dateFilter.items['to'].setValue(end, dateFilter);
        } else {
            dateFilter.items['to'].setValue('', dateFilter);
        }

        this._filtersService.change(dateFilter);
    }

    setSliderReportPeriodFilterData(start, end) {
        let dateFilter: FilterModel = underscore.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });
        if (dateFilter) {
            if (!dateFilter.items['from'].value)
                this.sliderReportPeriod.start = start;
            if (!dateFilter.items['to'].value)
                this.sliderReportPeriod.end = end;
        }
    }

    setBankAccountsFilter(data) {
        let accountFilter: FilterModel = underscore.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'account'; });
        if (!accountFilter) {
            setTimeout(() => { this.setBankAccountsFilter(data); }, 300);
        } else {
            accountFilter = this._bankAccountsService.changeAndGetBankAccountFilter(accountFilter, data, this.operations.bankAccountSelector.initDataSource);
            this._filtersService.change(accountFilter);
        }
        this.allowChangingForecast = data.isActive;
    }

    discardDiscrepancy(cellObj) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.l('DiscardDiscrepancy_WarningHeader'),
                message: this.l('DiscardDiscrepancy_WarningMessage')
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();

                let filterDetails = this.statsDetailFilter;
                let discardDiscrepanciesInput = DiscardDiscrepanciesInput.fromJS({
                    bankAccountIds: filterDetails.accountIds,
                    currencyId: filterDetails.currencyId,
                    startDate: filterDetails.startDate,
                    endDate: filterDetails.endDate
                });

                this._bankAccountsServiceProxy.discardDiscrepancies(InstanceType[this.instanceType], this.instanceId, discardDiscrepanciesInput)
                    .subscribe((result) => { this.refreshDataGrid(); });
            }
            document.documentElement.scrollTop = 0;
        });
    }

    stateLoad = () => {
        let state = this._cacheService.get(this.stateStorageKey);
        if (state && String(state) !== 'undefined') {
            state = JSON.parse(state);
            if (state.headersAreCollapsed) {
                this.yearHeadersAreCollapsed = state.headersAreCollapsed.year;
                this.quarterHeadersAreCollapsed = state.headersAreCollapsed.quarter;
            }
        } else {
            /** Set default expanded columns */
            state = {};
            state.columnExpandedPaths = this.columnDefaultExpandedPaths;
            state.rowExpandedPaths = this.rowDefaultExpandedPaths;
            this.yearHeadersAreCollapsed = true;
            this.quarterHeadersAreCollapsed = true;
        }
        return state;
    }

    stateSave = state => {
        state.headersAreCollapsed = {'year': this.yearHeadersAreCollapsed, 'quarter': this.quarterHeadersAreCollapsed };
        this._cacheService.set(this.stateStorageKey, JSON.stringify(state));
    }

    @HostListener('window:click', ['$event']) toogleSearchInput(event) {
        if (!event.target.closest('#findInputBlock')) {
            const findInput = document.getElementById('findInputBlock');
            if (findInput) {
                findInput.style.display = 'none';
            }
        }
    }

    onCloseCalculator(e) {
        this.closeCalculator();
    }

    closeCalculator() {
        this.calculatorShowed = false;
        if (this.modifyingCellNumberBox) {
            this.modifyingCellNumberBox.focus();
        }
    }

    toggelCalculator(e) {
        if (this.calculatorShowed) {
            this.closeCalculator();
        } else {
            this.calculatorShowed = true;
            let val = this.modifyingCellNumberBox.option('value');
            this._calculatorService.valueChanged(val);
        }
    }

    onCalculatorValueChange(value) {
        this.modifyingCellNumberBox.option('value', value);
    }

    hideModifyingNumberBox() {
        if (this.modifyingNumberBoxCellObj) {
            this.saveForecast();
            this.closeCalculator();
        } else {
            if (this.modifyingCellNumberBox) {
                this.removeModifyingCellNumberBox();
            }
        }
    }

    onAmountCellEditStart(e) {
        if (this.detailsModifyingNumberBoxCellObj === e.key)
            return;
        else
            this.hideModifyingNumberBox();

        if (!(e.data && e.data.forecastId && ['debit', 'credit'].indexOf(e.column.dataField) !== -1)) {
            return;
        }

        let element = e.component.getCellElement(e.component.getRowIndexByKey(e.key), e.column.dataField);
        $(element).addClass('dx-editor-cell calculator-number-box');
        if (!element.querySelector('span'))
            $(element).wrapInner('<span></span>');
        $(element).children().hide();

        let wrapper = document.createElement('div');
        wrapper.onclick = function (ev) {
            ev.stopPropagation();
        };
        let wrapperButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };
        let wrapperSaveButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };
        this.modifyingCellNumberBox = new NumberBox(wrapper, {
            value: e.data[e.column.dataField],
            format: this.currencySymbol + ' #,###.##',
            width: '86%',
            onEnterKey: this.updateForecastCell.bind(this, e),
            onKeyDown: function(e) {
                if ((e.event as any).keyCode === 37 || (e.event as any).keyCode === 39) {
                    e.event.stopPropagation();
                }
            }
        });
        this.functionButton = new Button(wrapperButton, {
            iconSrc: 'assets/common/icons/fx.svg',
            onClick: this.toggelCalculator.bind(this, event),
            elementAttr: { 'class': 'function-button' }
        });

        this.saveButton = new Button(wrapperSaveButton, {
            iconSrc: 'assets/common/icons/check.svg',
            onClick: this.updateForecastCell.bind(this, e),
            elementAttr: { 'class': 'save-forecast-button' }
        });
        element.appendChild(this.functionButton.element());
        element.appendChild(this.modifyingCellNumberBox.element());
        element.appendChild(this.saveButton.element());
        this.modifyingCellNumberBox.focus();
        element = null;

        this.detailsModifyingNumberBoxCellObj = e.key;
    }

    getBankAccountId(cell) {
        let id = this.bankAccounts.find(account => account.accountNumber === cell.data.accountNumber)['id'];
        return id;
    }

    accountChanged(e, cell) {
        if (e.value !== e.previousValue) {

            let rowKey = this.cashFlowGrid.instance.getRowIndexByKey(cell.key);
            /** remove the value of opposite cell */
            this.cashFlowGrid.instance.cellValue(rowKey, "accountId", e.value);

            let newAccountNumber = this.bankAccounts.find(account => account.id === e.value)['accountNumber'];
            cell.setValue(newAccountNumber);
        }
    }

    updateForecastCell(e) {
        e.component.cellValue(e.rowIndex, e.columnIndex, this.modifyingCellNumberBox.option('value'));
        e.component.saveEditData();
        this.hideModifyingNumberBox();
    }

    onTransactionDetailContentReady(e) {
        this.hideModifyingNumberBox();
        /** To update width of selection column */
        if (e.component.shouldSkipNextReady) {
            e.component.shouldSkipNextReady = false;
        } else {
            e.component.shouldSkipNextReady = true;
            e.component.columnOption("command:select", "width", 28);
            e.component.updateDimensions();
        }
    }

    onDetailsRowDelete(e) {
        let selectedRecords = this.cashFlowGrid.instance.getSelectedRowKeys();
        if (selectedRecords && selectedRecords.length) {
            selectedRecords.forEach((record, i) => {
                if (record.forecastId) {
                    abp.ui.setBusy();
                    if (record.forecastDate) {
                        let momentDate = moment(record.forecastDate);
                        this.addLocalTimezoneOffset(momentDate);
                        record.forecastDate = momentDate.toDate();
                    }

                    this._cashFlowForecastServiceProxy
                        .deleteForecast(
                        InstanceType10[this.instanceType],
                        this.instanceId,
                        record.forecastId
                    ).subscribe(res => {
                        this.deleteStatsFromCashflow('amount', 0, record.forecastId, record.forecastDate, false);
                        this.getCellOptionsFromCell.cache = {};
                        this.pivotGrid.instance.getDataSource().reload()
                            .then(() => { abp.ui.clearBusy(); });
                        this.statsDetailResult.every((v, index) => {
                            if (v.forecastId == record.forecastId) {
                                this.statsDetailResult.splice(index, 1);
                                return false;
                            }
                            return true;
                        });
                    }, error => {
                        abp.ui.clearBusy();
                    });
                }
            });
        }
    }

    activate() {
        this._filtersService.localizationSourceName = this.localizationSourceName;
        this.operations.initToolbarConfig();
        this.setupFilters(this.filters);
        this.initFiltering();
        this.pivotGrid.instance.repaint();
        this.operations.bankAccountSelector.handleSelectedBankAccounts();
        this.synchProgressComponent.requestSyncAjax();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._appService.toolbarConfig = null;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
    }

    getBankAccountName(bankAccount) {
        return (bankAccount.accountName || "(no name)") + ": " + bankAccount.accountNumber;
    }
}
