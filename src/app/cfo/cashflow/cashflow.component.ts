import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { IGroupbyItem } from './models/groupbyItem';
import { IEventDescription } from './models/event-description';

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
    DiscardDiscrepancyInput,
    CreateForecastModelInput,
    CashFlowStatsDetailDto
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from './preferences-dialog/preferences.service';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { OperationsComponent } from './operations/operations.component';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';

import { DxPivotGridComponent, DxDataGridComponent } from 'devextreme-angular';
import TextBox from 'devextreme/ui/text_box';
import NumberBox from 'devextreme/ui/number_box';
import Tooltip from 'devextreme/ui/tooltip';
import SparkLine from 'devextreme/viz/sparkline';

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
import * as ModelEnums from './models/setting-enums';
import { IExpandLevel } from './models/expand-level';
import * as $ from 'jquery';

import { CacheService } from 'ng2-cache-service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/buffer';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from 'shared/filters/bank-account-filter/bank-account-filte.model';

class TransactionStatsDtoExtended extends TransactionStatsDto {
    initialDate: moment.Moment;
}

/** Constants */
const StartedBalance = 'B',
      Income         = 'I',
      Expense        = 'E',
      Reconciliation = 'D',
      NetChange      = 'NC',
      Total          = 'T',
      GrandTotal     = 'GT';

enum Periods {
    Historical,
    Current,
    Forecast
}

enum Projected {
    Total,
    Mtd,
    Today,
    Forecast
}

enum CategorizationPrefixes  {
    CashflowType            = 'CT',
    AccountName             = 'AN',
    AccountingType          = 'AT',
    Category                = 'CA',
    SubCategory             = 'SC',
    TransactionDescriptor   = 'TD'
}

const PSB = CategorizationPrefixes.CashflowType + StartedBalance,
      PI  = CategorizationPrefixes.CashflowType + Income,
      PE  = CategorizationPrefixes.CashflowType + Expense,
      PR  = CategorizationPrefixes.CashflowType + Reconciliation,
      PNC = CategorizationPrefixes.CashflowType + NetChange,
      PT  = CategorizationPrefixes.CashflowType + Total;

class CashflowCategorizationModel {
    prefix: CategorizationPrefixes;
    statsKeyName: string;
    namesSource?: string;
    childNamesSource?: string;
    childReferenceProperty?: string;
}

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashflowServiceProxy, CashFlowForecastServiceProxy, CacheService, ClassificationServiceProxy, UserPreferencesService, BankAccountsServiceProxy ]
})
export class CashflowComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    @ViewChild(DxDataGridComponent) cashFlowGrid: DxDataGridComponent;
    @ViewChild(OperationsComponent) operations: OperationsComponent;
    selectedBankAccounts = [];
    sliderReportPeriod = {
        start: null,
        end: null,
        minDate: moment().utc().subtract(10, 'year').year(),
        maxDate: moment().utc().add(10, 'year').year()
    };
    showAllDisabled = true;
    noRefreshedAfterSync: boolean;
    headlineConfig: any;
    categoryTree: GetCategoryTreeOutput;
    cashflowData = [];
    cashflowDataTree = {};
    treePathes = [];
    cashflowTypes: any;
    bankAccounts: BankAccountDto[];
    dataSource: any;
    groupInterval = 'year';
    momentFormats = {
        'year':     'Y',
        'quarter':  'Q',
        'month':    'M',
        'week':     'w',
        'day':      'D'
    };
    statsDetailFilter: StatsDetailFilter = new StatsDetailFilter();
    statsDetailResult: any;

    /** Filter by string */
    private filterBy: string;

    /**
     *  Categorization settings for creating categorization tree on cashflow
     */
    categorization: Array<CashflowCategorizationModel> = [
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
    groupbyItems: IGroupbyItem[] = [
        {
            'groupInterval': 'year',
            'optionText': this.l('Years').toUpperCase(),
            'historicalSelectionFunction': this.getYearHistoricalSelectorWithCurrent
        },
        {
            'groupInterval': 'quarter',
            'optionText': this.l('Quarters').toUpperCase(),
            'customizeTextFunction': this.getQuarterHeaderCustomizer,
            'historicalSelectionFunction': this.getYearHistoricalSelectorWithCurrent
        },
        {
            'groupInterval': 'month',
            'optionText': this.l('Months').toUpperCase(),
            'customizeTextFunction': this.getMonthHeaderCustomizer,
            'historicalSelectionFunction': this.getYearHistoricalSelectorWithCurrent
        }
    ];

    /** First categorization level items order */
    leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
        NetChange,
        Reconciliation,
        Total
    ];

    /** Pivot grid fields settings */
    apiTableFields: any = [
        {
            caption: 'Type',
            width: 120,
            area: 'row',
            areaIndex: 0,
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
            areaIndex: 1,
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
            areaIndex: 2,
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
            areaIndex: 3,
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
            areaIndex: 4,
            dataField: 'level4',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Amount',
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: (value) => {
                return this.formatAsCurrencyWithLocale(value, 'en-EN');
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
            selector: this.groupbyItems[0].historicalSelectionFunction(),
            customizeText: this.getHistoricalCustomizer.bind(this)(),
            expanded: true,
            allowExpand: false,
            wordWrapEnabled: true
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
            areaIndex: 3,
            width: 0.01,
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Projected',
            area: 'column',
            areaIndex: 4,
            showTotals: false,
            selector: function(dataItem) {
                let result: Projected;

                if (dataItem.initialDate.format('MM.YYYY') !== moment().format('MM.YYYY')) {
                    result = Projected.Total;
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
            },
            customizeText: cellInfo => {
                let projectedKey;
                switch (cellInfo.value) {
                    case Projected.Total:    projectedKey = 'CashflowFields_Total'; break;
                    case Projected.Forecast: projectedKey = 'CashflowFields_Projected'; break;
                    case Projected.Mtd:      projectedKey = 'CashflowFields_Mtd'; break;
                    case Projected.Today:    projectedKey = 'CashflowFields_Today'; break;
                }
                return this.l(projectedKey).toUpperCase();
            },
            expanded: false,
            allowExpand: false,
            visible: true
        },
        {
            caption: 'Day',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            areaIndex: 5,
            groupInterval: 'day',
            visible: true
        }
    ];

    /** Language keys for historical field texts*/
    historicalTextsKeys = [
        'Periods_Historical',
        'Periods_Current',
        'Periods_Forecast'
    ];

    /** Css classes for historical field columns */
    historicalClasses = [
        'historical',
        'current',
        'forecast'
    ];

    /** Paths that should be clicked in onContentReady */
    fieldPathsToClick = [];

    forecastModelsObj: { items: Array<any>, selectedItemIndex: number };
    selectedForecastModel;
    currencyId = 'USD';
    /** @todo create model */
    userPreferencesHandlers = {
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
                    handleMethod: this.showNegativeValuesInRed,
                },
                hideColumnsWithZeroActivity: {
                    areas: ['data', 'column'],
                    handleMethod: this.hideColumnsWithZeroActivity
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
    cellTypesCheckMethods = {
        [ModelEnums.GeneralScope.TransactionRows]: this.isTransactionRows,
        [ModelEnums.GeneralScope.TotalRows]: this.isIncomeOrExpensesDataCell,
        [ModelEnums.GeneralScope.BeginningBalances]: this.isStartingBalanceDataColumn,
        [ModelEnums.GeneralScope.EndingBalances]: this.isAllTotalBalanceCell
    };
    cashflowGridSettings: CashFlowGridSettingsDto;
    expandLevels: IExpandLevel[] = [
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
                                onValueChanged: e => {
                                    searchInputBlock.style.display = 'none';
                                    this.cachedRowsFitsToFilter.clear();
                                    this.filterBy = e.element.querySelector('input').value;
                                    this.pivotGrid.instance.getDataSource().reload();
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
    maxCategoriesWidth = 22;
    footerToolbarConfig = [];
    private initialData: CashFlowInitialData;
    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;
    private requestFilter: StatsFilter;
    private anotherPeriodAccountsValues: Map<object, number> = new Map();
    private cachedColumnActivity: Map<string, boolean> = new Map();
    private cachedRowsFitsToFilter: Map<string, boolean> = new Map();
    private cachedRowsSparkLines: Map<string, SparkLine> = new Map();

    /** Total amount of transactions */
    private transactionsTotal = 0;

    /** Amount of transactions */
    private transactionsAmount = 0;

    /** Avereage amount of all transcations */
    private transactionsAverage = 0;

    /** Marker that change its value after content is fully rendering on cashflow */
    private contentReady = false;

    /** List of adjustments on cashflow */
    private adjustmentsList = [];

    /** Text box for modifying of the cell*/
    private modifyingCelltextBox: HTMLElement;

    /** Type of operation with the cell */
    private currentCellOperationType: 'add' | 'update' | 'delete';

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
        /** Expand current quarter */
        [Periods.Current, moment().year(), moment().quarter()],
        /** Expand current month */
        [Periods.Current, moment().year(), moment().quarter(), moment().month() + 1],
    ];

    /** The width of the left pivot grid column (pixels) */
    private leftColumnWidth = 339;

    /** The height of the bottom toolbar (pixels) */
    private bottomToolbarHeight = 41;

    /** Tooltip instance to show adjustment info */
    private infoTooltip: Tooltip;

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
            handler: this.onMouseOver.bind(this)
        },
        {
            name: 'mouseout',
            handler: this.onMouseOut.bind(this)
        }
    ];

    /** Interval between state saving (ms) */
    public stateSavingTimeout = 1000;

    /** Whether the data started loading */
    public startDataLoading = false;

    /** Whether the loading of data was performed with filter */
    public filteredLoad = false;

    constructor(injector: Injector,
                private _cashflowServiceProxy: CashflowServiceProxy,
                private _filtersService: FiltersService,
                private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
                private _cacheService: CacheService,
                private _classificationServiceProxy: ClassificationServiceProxy,
                private _bankAccountsServiceProxy: BankAccountsServiceProxy,
                public dialog: MatDialog,
                public userPreferencesService: UserPreferencesService,
                private _appService: AppService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(0);
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        super.ngOnInit();
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = this.currencyId;
        this.requestFilter.groupByPeriod = StatsFilterGroupByPeriod.Monthly;
        /** Create parallel operations */
        let getCashFlowInitialDataObservable = this._cashflowServiceProxy.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId);
        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        let getCategoryTreeObservalble = this._classificationServiceProxy.getCategoryTree(InstanceType[this.instanceType], this.instanceId, false);
        let getCashflowGridSettings = this._cashflowServiceProxy.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
        let getBankAccountsObservable = this._bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD', null, true);
        Observable.forkJoin(getCashFlowInitialDataObservable, getForecastModelsObservable, getCategoryTreeObservalble, getCashflowGridSettings, getBankAccountsObservable)
            .subscribe(result => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(result[0], result[4]);

                /** Forecast models handling */
                this.handleForecastModelResult(result[1]);

                /** Handle the get categories response */
                this.handleGetCategoryTreeResult(result[2]);

                /** Handle the get cashflow grid settings response*/
                this.handleGetCashflowGridSettingsResult(result[3]);

                /** load cashflow data grid */
                this.loadGridDataSource();
            });

        this.initHeadlineConfig();
        this.initFiltering();
        this.overrideCashflowDataPushMethod();

        /** Add event listeners for cashflow component (delegation for cashflow cells mostly) */
        this.addEvents(this.getElementRef().nativeElement, this.cashflowEvents);
    }

    /**
     * Override the native array push method for the cashflow that will add the total and netChange objects before pushing the income or expense objects
     */
    overrideCashflowDataPushMethod() {
        if (this.cashflowData && this.cashflowData.push) {
            this.cashflowData.push = cashflowItem => {
                if (cashflowItem.cashflowTypeId === Income || cashflowItem.cashflowTypeId === Expense) {
                    let totalObject = Object.assign({}, cashflowItem);
                    totalObject.cashflowTypeId = Total;
                    Array.prototype.push.call(this.cashflowData, this.addCategorizationLevels(totalObject));
                    if (this.cashflowGridSettings.general.showNetChangeRow) {
                        let netChangeObject = Object.assign({}, cashflowItem);
                        netChangeObject.cashflowTypeId = NetChange;
                        Array.prototype.push.call(this.cashflowData, this.addCategorizationLevels(netChangeObject));
                    }
                }
                return Array.prototype.push.call(this.cashflowData, cashflowItem);
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

            /** Text customizing for acounts names  */
            if (prefix === CategorizationPrefixes.AccountName) {
                let account = this.bankAccounts.find(account => account.id == key );
                text = account ? account.accountName : cellInfo.valueText;
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
            iconSrc: 'assets/common/icons/chart-icon.svg',
            buttons: [
                {
                    enabled: this.noRefreshedAfterSync,
                    action: this.refreshDataGrid.bind(this),
                    lable: this.l('Refresh'),
                    icon: 'refresh',
                    class: 'btn-default back-button'
                }
            ]
        };
    }

    initFiltering() {
        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                /** Reset cached days months to apply the date filter again */
                /** @todo reset only for the month for which the filter changed */
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
        this.bankAccounts = this.initialData.banks.map(x => x.bankAccounts).reduce((x, y) => x.concat(y));
        this._filtersService.setup(
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
                            dataSource: initialDataResult.businessEntities,
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                    }
                })
            ]
        );
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
        super.ngOnDestroy();
    }

    loadGridDataSource() {
        this.startLoading();
        this.requestFilter.forecastModelId = this.selectedForecastModel.id;

        /** Clear cache of loaded days */
        this.monthsDaysLoadedPathes = [];

        /** Clear cache for rows sparklines */
        this.cachedRowsSparkLines.forEach(sparkLine => {
            sparkLine.dispose();
        });
        this.cachedRowsSparkLines.clear();

        let getStatsObservervables = [];

        /** Monthly cashflow data observer */
        let monthlyStatsObservers = [this._cashflowServiceProxy.getStats(InstanceType[this.instanceType], this.instanceId, this.requestFilter)];

        moment.tz.setDefault(undefined);

        /** If we have some expanded months in state - we should also load daily data */
        let dailyStatsObservers = [];
        let dailyStatsFilters = [];
        let state = this.pivotGrid ? this.pivotGrid.instance.getDataSource().state() : this.stateLoad();
        let monthIndex = this.getAreaIndexByCaption('month');
        if (state && state.columnExpandedPaths) {
            state.columnExpandedPaths.forEach((columnPath, index) => {
                if (columnPath.length === monthIndex + 1) {
                    this.monthsDaysLoadedPathes.push(columnPath);
                    let requestFilter = this.getRequestFilterFromPath(columnPath);
                    dailyStatsFilters.push(requestFilter);
                    dailyStatsObservers.push(this._cashflowServiceProxy.getStats(InstanceType[this.instanceType], this.instanceId, requestFilter));
                }
            });
        }

        getStatsObservervables = monthlyStatsObservers.concat(dailyStatsObservers);
        Observable.forkJoin(...getStatsObservervables)
            .subscribe((result: any)  => {
                this.startDataLoading = true;
                this.handleMonthlyCashflowData(result[0].transactionStats);
                for (let i = 1; i < result.length; i++) {
                    this.handleDailyCashflowData(result[i].transactionStats, dailyStatsFilters[i - 1].startDate, dailyStatsFilters[i - 1].endDate);
                }
            },
            e => {},
            () => {
                if (!this.cashflowData || !this.cashflowData.length) {
                    this._appService.toolbarIsHidden = true;
                } else {
                    this.dataSource = this.getApiDataSource();
                    /** Init footer toolbar with the gathered data from the previous requests */
                    this.initFooterToolbar();
                }
                this.finishLoading();
                moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
            });
    }

    handleMonthlyCashflowData(transactions) {
        if (transactions && transactions.length) {
            /** categories - object with categories */
            this.cashflowData = this.getCashflowDataFromTransactions(transactions);
            /** Make a copy of cashflow data to display it in custom total group on the top level */
            let stubCashflowDataForEndingCashPosition = this.getStubCashflowDataForEndingCashPosition(this.cashflowData);
            let stubCashflowDataForAllDays = this.getStubCashflowDataForAllPeriods(this.cashflowData);
            let cashflowWithStubForEndingPosition = this.cashflowData.concat(stubCashflowDataForEndingCashPosition);
            let stubCashflowDataForAccounts = this.getStubCashflowDataForAccounts(cashflowWithStubForEndingPosition);

            /** concat initial data and stubs from the different hacks */
            this.cashflowData = cashflowWithStubForEndingPosition.concat(
                stubCashflowDataForAccounts,
                stubCashflowDataForAllDays
            );

            let start = underscore.min(this.cashflowData, function(val) { return val.date; }).date.year();
            let end = underscore.max(this.cashflowData, function(val) { return val.date; }).date.year();
            this.setSliderReportPeriodFilterData(start, end);
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

        let stubCashflowDataForAllDays = this.createStubsForPeriod(startDate, endDate, 'day', existingPeriods);
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
     * @param {Array<TransactionStatsDto>} transactions
     */
    getStubCashflowDataForAccounts(transactions) {
        let stubCashflowDataForAccounts = [],
            allAccountsIds: Array<number> = [],
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
            'forecastId': null
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
        return this.addCategorizationLevels(Object.assign(stubTransaction, stubObj));
    }

    /**
     * Get the cashflow data from the transactions from the server
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {TransactionStatsDto[]}
     */
    /** @todo refactor */
    getCashflowDataFromTransactions(transactions, reset = true) {
        if (reset) {
            this.transactionsAmount = 0;
            this.transactionsTotal = 0;
            this.transactionsAverage = 0;
            this.adjustmentsList = [];
            this.cashflowDataTree = [];
            this.hasDiscrepancyInData = false;
        }

        const data = transactions.reduce((result, transactionObj) => {
            if (!this.hasDiscrepancyInData && transactionObj.cashflowTypeId == Reconciliation)
                this.hasDiscrepancyInData = true;
            transactionObj.categorization = {};
            transactionObj.initialDate = moment(transactionObj.date);
            transactionObj.date.add(transactionObj.date.toDate().getTimezoneOffset(), 'minutes');
            let isAccountTransaction = transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation;
            /** change the second level for started balance and reconciliations for the account id */
            if (isAccountTransaction) {
                /** @todo Remove adjustment list for the months and create another for days */
                if (transactionObj.cashflowTypeId === StartedBalance) {
                    this.adjustmentsList.push(Object.assign({}, transactionObj));
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
        this.categorization.every((level) => {
            if (transactionObj[level.statsKeyName]) {

                /** If user doens't want to show accounting type row - skip it */
                if (level.prefix === CategorizationPrefixes.AccountingType && !this.cashflowGridSettings.general.showAccountingTypeRow) {
                    return true;
                }

                /** Create categories levels */
                if (level.prefix === CategorizationPrefixes.AccountName) {
                    if (isAccountTransaction) {

                        /** @todo refactor to avoid doubles */
                        /** Create categorization tree to */
                        if (levelNumber !== 0) {
                            parentKey = key;
                        }
                        key = level.prefix + transactionObj[level.statsKeyName];
                        if (parentKey && !this.cashflowDataTree[parentKey]) {
                            this.cashflowDataTree[parentKey] = true;
                        }

                        transactionObj[`level${levelNumber++}`] = key;
                        return false;
                    } else {
                        return true;
                    }
                }

                /** @todo refactor to avoid doubles */
                /** Create categorization tree to */
                if (levelNumber !== 0) {
                    parentKey = key;
                }
                key = level.prefix + transactionObj[level.statsKeyName];
                if (parentKey && !this.cashflowDataTree[parentKey]) {
                    this.cashflowDataTree[parentKey] = true;
                }

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
    updateTreePathes(transactionObj) {
        let fullPath = [];
        for (let i = 0; i < 5; i++) {
            let levelValue = transactionObj[`level${i}`];
            if (levelValue || i === 1) {
                fullPath.push(levelValue);
            }
        }
        if (this.treePathes.indexOf(fullPath) === -1) {
            this.treePathes.push(fullPath);
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
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {Array<TransactionStatsDto>}
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

    getStubForNetChange(cashflowData: Array<TransactionStatsDto>) {
        let stubCashflowDataForEndingCashPosition: Array<TransactionStatsDto> = [];
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
     * @param {Array<TransactionStatsDtoExtended>} cashflowData
     * @return {TransactionStatsDtoExtended[]}
     */
    getStubCashflowDataForAllPeriods(cashflowData: Array<TransactionStatsDtoExtended>) {
        let allYears: Array<number> = [],
            existingPeriods: Array<string> = [],
            firstAccountId,
            minDate: moment.Moment,
            maxDate: moment.Moment,
            periodFormat = 'YYYY-MM';

        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let date = cashflowItem.initialDate;
            let transactionYear = date.year();
            let formattedDate = date.utc().format(periodFormat);
            if (allYears.indexOf(transactionYear) === -1) allYears.push(transactionYear);
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
            if (!minDate || cashflowItem.date < minDate)
                minDate = moment(date);
            if (!maxDate || cashflowItem.date > maxDate)
                maxDate = moment(date);
            if (!firstAccountId && cashflowItem.accountId) firstAccountId = cashflowItem.accountId;
        });
        allYears = allYears.sort();

        /** consider the fitler */
        if (this.requestFilter.startDate && (!minDate || moment(this.requestFilter.startDate).utc().isAfter(minDate))) minDate = this.requestFilter.startDate;
        if (this.requestFilter.endDate && (!maxDate || moment(this.requestFilter.endDate).utc().isAfter(maxDate))) maxDate = this.requestFilter.endDate;

        let startDate = moment.utc(minDate);
        let endDate = moment.utc(maxDate);

        /** cycle from started date to ended date */
        /** added fake data for each date that is not already exists in cashflow data */
        let stubCashflowData = this.createStubsForPeriod(startDate, endDate, 'month', existingPeriods);

        /** Add stub for current period */
        /** if we have no current period */
        if (
            (!this.requestFilter.startDate || this.requestFilter.startDate < moment()) &&
            (!this.requestFilter.endDate || this.requestFilter.endDate > moment()) &&
            !cashflowData.concat(stubCashflowData).some(item => item.initialDate.format(periodFormat) === moment().format(periodFormat))
        ) {
            /** then we add current stub day */
            stubCashflowData.push(
                /** @todo check dates in debugger */
                this.createStubTransaction({
                    'cashflowTypeId': StartedBalance,
                    'accountId': firstAccountId,
                    'date': moment(),
                    'initialDate': moment()
                })
            );
        }

        return stubCashflowData;
    }

    createStubsForPeriod(startDate, endDate, period, existingPeriods = []) {
        let stubs = [];
        moment.tz.setDefault(undefined);
        let startDateCopy = moment(startDate),
            endDateCopy = moment(endDate);
        while (startDateCopy.isSameOrBefore(endDateCopy)) {
            let date = moment(startDateCopy, 'YYYY-MM-DD');
            if (existingPeriods.indexOf(date.format('YYYY-MM-DD')) === -1) {
                stubs.push(
                    this.createStubTransaction({
                        'cashflowTypeId': StartedBalance,
                        'accountId': this.bankAccounts[0].id,
                        'date': moment(date).add(date.toDate().getTimezoneOffset(), 'minutes'),
                        'initialDate': date
                    })
                );
            }
            startDateCopy.add(1, period);
        }
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
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
        this.initHeadlineConfig();
        this.closeTransactionsDetail();
        this.loadGridDataSource();
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
            let updateWithNetChange = result.general.showNetChangeRow !== this.cashflowGridSettings.general.showNetChangeRow;
            let updateAfterAccountingTypeShowingChange = result.general.showAccountingTypeRow !== this.cashflowGridSettings.general.showAccountingTypeRow;
            let updateWithDiscrepancyChange = result.general.showBalanceDiscrepancy !== this.cashflowGridSettings.general.showBalanceDiscrepancy;
            this.handleGetCashflowGridSettingsResult(result);
            this.closeTransactionsDetail();
            this.startLoading();
            /** @todo refactor - move to the showNetChangeRow and call here all
             *  appliedTo data methods before reloading the cashflow
             */
            /** @todo move to the userPreferencesHandlers to avoid if else structure */
            if (updateWithDiscrepancyChange) {
                this.pivotGrid.instance.getDataSource().reload();
            }
            if (!updateWithNetChange && !updateAfterAccountingTypeShowingChange && !updateWithDiscrepancyChange) {
                this.pivotGrid.instance.repaint();
            } else {
                if (!updateWithNetChange && !updateAfterAccountingTypeShowingChange) {
                    this.pivotGrid.instance.getDataSource().reload();
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

        this.contentReady = true;

        /** Get the groupBy element and append the dx-area-description-cell with it */
        let areaDescription = event.element.querySelector('.dx-area-description-cell');
        if (areaDescription) areaDescription.appendChild(document.querySelector('.sort-options'));

        /** Calculate the amount current cells to cut the current period current cell to change current from
         *  current for year to current for the grouping period */
        let lowestOpenedCurrentInterval = this.getLowestOpenedCurrentInterval();
        $('.lowestOpenedCurrent').removeClass('lowestOpenedCurrent');
        $(`.current${_.capitalize(lowestOpenedCurrentInterval)}`).addClass('lowestOpenedCurrent');

        let lowestOpenedInterval = this.getLowestOpenedInterval();
        this.changeHistoricalColspans(lowestOpenedCurrentInterval);

        if (this.pivotGrid.instance != undefined && !this.pivotGrid.instance.getDataSource().isLoading()) {
            this.finishLoading();
        }

        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();

        /** Clear cache with columns activity */
        this.cachedColumnActivity.clear();
        this.applyUserPreferencesForAreas();

        $('.dx-pivotgrid-area-data').off('keydown').on('keydown', e => {
            if (this.selectedCell) {
                let nextElement;
                switch (e.keyCode) {
                    case 37: //left
                        nextElement = this.selectedCell.cellElement.previousElementSibling;
                        break;
                    case 38: //up
                        let prevSibling = this.selectedCell.cellElement.parentElement.previousElementSibling;
                            nextElement = prevSibling ? prevSibling .querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                        break;
                    case 39: //right
                        nextElement = this.selectedCell.cellElement.nextElementSibling;
                        break;
                    case 40: //down
                        let nextSibling = this.selectedCell.cellElement.parentElement.nextElementSibling;
                        nextElement = nextSibling ? nextSibling.querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                        break;
                }

                if (nextElement) {
                    this.pivotGrid.instance['clickCount'] = 0;
                    nextElement.click();
                    this.pivotGrid.instance['clickCount'] = 0;
                }
                nextElement = null;
            }
        });
        //this.hideProjectedFields();
    }

    onScroll(e) {
        this.handleHeaderPosition(e);
        this.handleBottomHorizontalScrollPosition();
    }

    handleHeaderPosition(e) {
        let toolbar = <HTMLElement>document.querySelector('.page-content-wrapper app-toolbar');
        let dxToolbar = <HTMLElement>toolbar.children[0];
        let topIntend = toolbar.offsetTop + dxToolbar.offsetHeight;
        $('.cashflow table.dx-pivotgrid-border > tr:nth-child(3)').offset().top = Math.floor(topIntend);
        let scrollElement = <HTMLElement>document.querySelector('.dx-pivotgrid-area-data .dx-scrollable-scrollbar');
        scrollElement.style.top = e.scrollOffset + e.element.clientHeight;
        scrollElement = null;
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
        if (cashflowWrapper && cashflowWrapper.getBoundingClientRect().bottom > window.innerHeight) {
            scrollElement.addClass('fixedScrollbar');
            let minusValue = scrollElement.height();
            if (this.cashflowGridSettings.visualPreferences.showFooterBar) {
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

    @HostListener('window:resize', ['$event']) onResize() {
        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();
    }

    getDataItemsByCell(cellObj) {
        return this.cashflowData.filter(cashflowItem => {
            let rowPathPropertyName = cellObj.area === 'data' ? 'rowPath' : 'path';
            let columnPathPropertyName = cellObj.area === 'data' ? 'columnPath' : 'path';
            return (cellObj.area === 'column' || cellObj.cell[rowPathPropertyName].every((fieldValue, index) => fieldValue === cashflowItem[`level${index}`])) &&
                    (cellObj.area === 'row' || cellObj.cell[columnPathPropertyName].every((fieldValue, index) => {
                        let field = this.pivotGrid.instance.getDataSource().getAreaFields('column', true)[index];
                        let dateMethod = field.groupInterval === 'day' ? 'date' : field.groupInterval ;
                        return field.dataType !== 'date' || (field.groupInterval === 'month' ? cashflowItem.initialDate[dateMethod]() + 1 : cashflowItem.initialDate[dateMethod]()) === cellObj.cell[columnPathPropertyName][index];
                    }));
        });
    }

    /**
     * Changes historical colspans depend on current, previous and forecast periods using jquery dates columns colspans
     * and historical classes that added in onCellPrepared to the dates that belongs to the current periods like
     * currentYear, currentQuarter, currentMonth or currentDay
     */
    changeHistoricalColspans(lowestOpenedInterval) {
        /** Get the colspans values for the prev, current and forecast historical td that should be counted to
         * correctly display different historical periods */
        let colspanAmountForPrevious = this.getIntervalColspansAmount(lowestOpenedInterval, 'prev');
        let colspanAmountForCurrent =  this.getIntervalColspansAmountForCurrent(lowestOpenedInterval);
        let colspanAmountForForecast = this.getIntervalColspansAmount(lowestOpenedInterval, 'next');

        /** Hide current cell if there is no current opened lowest period and change the colspan */
        if (colspanAmountForCurrent === 0) {
            $('.historicalRow .current').hide();
        }
        /** If historical cell is absent - create it */
        if (!$('.historicalRow .historical').length && colspanAmountForPrevious) {
            this.createHistoricalCell('historical');
        }
        /** If forecast cell is absent - create it */
        if (!$('.historicalRow .forecast').length && colspanAmountForForecast) {
            this.createHistoricalCell('forecast');
        }
        /** Change the colspan for the historical period */
        $('.historicalRow .historical').attr('colspan', (colspanAmountForPrevious));
        $('.historicalRow .current').attr('colspan', colspanAmountForCurrent);
        /** Change colspan for forecast cell */
        $('.historicalRow .forecast').attr('colspan', (colspanAmountForForecast));
    }

    /**
     * Creates historical cell in historical row
     * @param period
     */
    createHistoricalCell(period) {
        let positionMethod = period === 'forecast' ? 'after' : 'before',
            textKey = period === 'forecast' ? this.historicalTextsKeys[2] : this.historicalTextsKeys[0],
            text = this.l(textKey);
        $('.historicalRow .current')
            [positionMethod](function () {
            return `<td class="dx-pivotgrid-expanded historicalField ${period}">
                    ${text.toUpperCase()}</td>`;
        }).click(function (event) {
            event.stopImmediatePropagation();
        });
    }

    getIntervalColspansAmountForCurrent(lowestColumnCaption) {
        let colspanAmount = 0;
        while (lowestColumnCaption) {
            let currentElement = $(`.dx-pivotgrid-horizontal-headers .lowestOpenedCurrent.current${_.capitalize(lowestColumnCaption)}`);
            if (currentElement.length) {
                colspanAmount = +currentElement.attr('colspan');
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
    getLowestOpenedCurrentInterval() {
        let lowestIndex = Math.max.apply(null, Object.keys(this.pivotGrid.instance.getDataSource().getData().columns._cacheByPath)
            .map(path => {
                let pathArr = path.split('.');
                let pathLowestInterval = this.getLowestIntervalFromPath(pathArr, this.getColumnFields());
                let date = this.getDateByPath(pathArr, this.getColumnFields(), pathLowestInterval);
                let format;
                switch (pathLowestInterval) {
                    case 'year'    : format = 'YYYY'; break;
                    case 'quarter' : format = 'QQ.YYYY'; break;
                    case 'month'   : format = 'MM.YYYY'; break;
                    case 'day'     : format = 'DD.MM.YYYY'; break;
                }
                if (date.format(format) === moment().format(format)) {
                    return pathArr.length - 1;
                } else {
                    return 0;
                }
            }));

        let lowestOpenedField = this.apiTableFields.find(item => item.area === 'column' && item.areaIndex === lowestIndex);
        return lowestOpenedField.caption.toLowerCase();
    }

    getLowestOpenedInterval() {
        let lowestIndex = Math.max.apply(null, Object.keys(this.pivotGrid.instance.getDataSource().getData().columns._cacheByPath).map(path => path.split('.').length)) - 1;
        let lowestOpenedField = this.apiTableFields.find(item => item.area === 'column' && item.areaIndex === lowestIndex);
        return lowestOpenedField.caption.toLowerCase();
    }

    getIntervalColspansAmount(groupInterval, period) {
        let currentElement = $('.dx-area-data-cell .current' + _.capitalize(groupInterval)),
            method = period === 'next' ? 'nextAll' : 'prevAll';
        if (!currentElement.length) {
            let elementPosition = period === 'prev' ? 'last' : 'first';
            return $('.dx-area-data-cell .' + period + _.capitalize(groupInterval))[elementPosition]()[method]().length + 1;
        }
        let length = currentElement.first()[method]().length;
        currentElement = null;
        return length;
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
            let currentYear = new Date().getFullYear(),
                itemYear = new Date(data.date).getFullYear(),
                result = Periods.Historical;
            if (currentYear < itemYear) {
                result = Periods.Forecast;
            } else if (currentYear === itemYear) {
                result = Periods.Current;
            }
            return result;
        };
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
        return this.apiTableFields.filter(field => field.area === 'column');
    }

    changeGroupBy(event) {
        this.startLoading();
        let itemIndex = event.itemData.itemIndex !== undefined ? event.itemData.itemIndex : event.itemIndex,
            value = this.groupbyItems[itemIndex],
            startedGroupInterval = value.groupInterval;
        this.groupInterval = startedGroupInterval;
        //this.updateDateFields(startedGroupInterval);
        /** Change historical field for different date intervals */
        let historicalField = this.getHistoricField();
        historicalField['selector'] = value.historicalSelectionFunction();
        this.closeTransactionsDetail();
        this.getColumnFields().forEach(item => {
            /** exclude historical field */
            if (item.dataType === 'date') {
                if (item.areaIndex <= itemIndex) {
                    this.pivotGrid.instance.getDataSource().expandAll(item.index);
                } else {
                    this.pivotGrid.instance.getDataSource().collapseAll(item.index);
                }
            }
        });
        this.pivotGrid.instance.repaint();
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
                this.pivotGrid.instance.getDataSource().expandHeaderItem('row', childPath);
                if (currentDepth != stopDepth)
                    this.expandRows(child, stopDepth, childPath, currentDepth + 1);
            }
        }
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
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === PSB;
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === PSB &&
            (cellObj.cell.rowType === PT || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.type === Total &&
            cellObj.cell.path.length === 1 &&
            (cellObj.cell.path[0] === PI || cellObj.cell.path[0] === PE);
    }

    /**
     * whether or not the cell is net change header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isNetChangeTotalCell(cellObj) {
        let pathProperty = cellObj.area === 'row' ? 'path' : 'rowPath';
        return cellObj.cell[pathProperty] && !cellObj.cell.isWhiteSpace && cellObj.cell[pathProperty].length === 1 && cellObj.cell[pathProperty][0] === PNC;
    }

    isAccountHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.path && cellObj.cell.path[1] && cellObj.cell.path[1].slice(0, 2) === CategorizationPrefixes.AccountName;
    }

    isCopyable(cellObj) {
        return cellObj.area === 'data' && (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE);
    }

    isDayCell(cellObj) {
        let result = false;
        if (this.pivotGrid) {
            let dayIndex = this.getAreaIndexByCaption('day');
            let path = cellObj.cell.path || cellObj.cell.columnPath;
            result = path.length === (dayIndex + 1);
        }
        return result;
    }

    isMonthHeaderCell(cellObj): boolean {
        let isMonthHeaderCell = false;
        if (this.pivotGrid) {
            let monthIndex = this.getAreaIndexByCaption('month');
            isMonthHeaderCell = cellObj.area === 'column' && cellObj.cell.path && cellObj.cell.path.length === (monthIndex + 1);
        }
        return isMonthHeaderCell;
    }

    isEmptyProjectedField(cellObj) {
        return this.isProjectedHeaderCell(cellObj) && cellObj.cell.path.slice(-1)[0] === Projected.Total;
    }

    isProjectedHeaderCell(cellObj) {
        let projectedIndex = this.getAreaIndexByCaption('projected');
        return cellObj.area === 'column' && cellObj.cell.path && cellObj.cell.path.length === projectedIndex + 1;
    }

    /**
     * Return index in path for field for a row or column areas
     * @param {string} caption
     * @param {"row" | "column"} area
     * @return {any}
     */
    getAreaIndexByCaption(caption: string) {
        return this.apiTableFields.find(item => item.caption.toLowerCase() === caption.toLowerCase())['areaIndex'];
    }

    isTransactionDetailHeader(cellObj) {
        let result = false;
        if (cellObj.area === 'row' && !cellObj.cell.isWhiteSpace && cellObj.cell.path) {
            let prefix = this.getPrefixFromPath(cellObj.cell.path);
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

    cellCanBeDragged(cellObj) {
        return cellObj.area === 'data' && (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE) &&
               !(cellObj.cell.rowPath.length && cellObj.cell.rowPath.length === 2 && (!cellObj.cell.rowPath[1] || cellObj.cell.rowPath[1].slice(0, 2) !== CategorizationPrefixes.Category)) &&
               cellObj.cell.rowPath.length !== 1;
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
    isIncomeOrExpensesDataCell(cellObj) {
        return cellObj.area === 'data' &&
            cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE);
    }

    /**
     * whether or not the cell is income or expenses total cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesTotalHeaderCell(cellObj) {
        return cellObj.area === 'row' && !cellObj.cell.isWhiteSpace && cellObj.cell.path !== undefined &&
            (cellObj.cell.path[0] === PI || cellObj.cell.path[0] === (PE));
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
               cellObj.cell.path.length === 1 &&
               cellObj.cell.path[0] === PT &&
               !cellObj.cell.isWhiteSpace;
    }

    isIncomeOrExpenseWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
               cellObj.cell.path.length === 1 &&
               (cellObj.cell.path[0] === PI || cellObj.cell.path[0] === PE);
    }

    isStartingBalanceWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === PSB;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === PT);
    }

    isAllTotalBalanceCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               (cellObj.cell.rowPath[0] === PT || cellObj.cell.rowPath[0] === PNC);
    }

    isTotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               cellObj.cell.type === 'Total';
    }

    /** @todo check */
    isSubtotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined && cellObj.cell.type === 'Total';
    }

    isTransactionRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               cellObj.cell.rowPath.length !== 1 &&
               (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE);
    }

    /** Whether the cell is the reconciliation header cell */
    isReconciliationHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === PR &&
            !cellObj.cell.isWhiteSpace;
    }

    /** Whether the cell is the reconciliation data cell */
    isReconciliationDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === CategorizationPrefixes.CashflowType + Reconciliation);
    }

    isReconciliationRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            (cellObj.cell.rowPath[0] === (PR));
    }

    /**
     * whether or not the cell is data cell
     * @param cellObj
     * @returns {boolean}
     */
    isDataCell(cellObj) {
        return cellObj.area === 'data';
    }

    /**
     * whether the cell is the historical cell
     * @param cellObj
     * @returns {boolean}
     */
    isHistoricalCell(cellObj) {
        return cellObj.area === 'column' && cellObj.rowIndex === 0;
    }

    addActionButton(name, container: HTMLElement, attributes: object = {}) {
        let a = document.createElement('a');
        a.className = 'dx-link dx-link-' + name;
        a.innerText = this.l(this.capitalize(name));
        if (attributes) {
            for (let key in attributes) {
                a.setAttribute(key, attributes[key]);
            }
        }
        container.appendChild(a);
    }

    /**
     * Event that runs before rendering of every cell of the pivot grid
     * @param e - the object with the cell info
     * https://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxPivotGrid/Events/#cellPrepared
     */
    onCellPrepared(e) {
        let maxCategoryWidth = this.maxCategoriesWidth;

        /** Get cell date from path and add it to the cell object for using */
        if ((e.area === 'column' || e.area === 'data') && e.cell.text !== undefined) {
            let path = e.cell.path || e.cell.columnPath;
            let date = this.getDateByPath(path, this.getColumnFields(), 'day');
            e.date = date;
        }

        /** Add day (monday, tuesday etc) to the day cells */
        if ((e.area === 'column' || e.area === 'data') && e.cell.text !== undefined && this.isDayCell(e)) {
            this.addWeekendAttribute(e);
        }

        /** added charts near row titles */
        if (e.area === 'row' && e.cell.type === 'D' && e.cell.path.length > 1 && !e.cell.expanded && !e.cell.isWhiteSpace) {
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
                    e.cellElement.append(spanChart);
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

        /** added css class to start balance row */
        if (this.isStartingBalanceHeaderColumn(e) || this.isStartingBalanceTotalDataColumn(e)) {
            e.cellElement.parentElement.classList.add('startedBalance');
        }

        /** added css class to ending position row */
        if (this.isTotalEndingHeaderCell(e) || this.isTotalEndingDataCell(e)) {
            e.cellElement.parentElement.classList.add('endingCashPosition');
        }

        if (this.isStartingBalanceWhiteSpace(e)) {
            e.cellElement.classList.add('startedBalanceWhiteSpace');
        }

        /** added css class to the income and outcomes columns */
        if (this.isIncomeOrExpensesHeaderCell(e) ||
            this.isIncomeOrExpensesDataCell(e) ||
            this.isIncomeOrExpensesTotalHeaderCell(e)
        ) {
            let isDataCell = this.isIncomeOrExpensesDataCell(e);
            let level = e.cell.path && e.cell.path.length - 1;
            let pathProp = isDataCell ? 'rowPath' : 'path';
            let cssClass = (e.cell[pathProp] !== undefined &&
            e.cell[pathProp][0] === PI ? 'income' : 'expenses')  + (level ? 'Child' : '');
            e.cellElement.classList.add(cssClass);
            e.cellElement.parentElement.classList.add(cssClass + 'Row');
            /** disable collapsing for income and expenses columns */
            if (this.isIncomeOrExpensesHeaderCell(e) && !level) {
                e.cellElement.classList.add('uppercase');
            }
        }

        /** add css classes to net change rows */
        if (this.isNetChangeTotalCell(e)) {
            e.cellElement.classList.add('netChange');
            e.cellElement.parentElement.classList.add('netChangeRow');
        }

        /** add account number to the cell */
        if (this.isAccountHeaderCell(e)) {
            let accountId = e.cell.path[1].slice(2);
            let account = this.bankAccounts.find(account => account.id == accountId);
            if (account && account.accountNumber) {
                maxCategoryWidth -= 7;
                e.cellElement.insertAdjacentHTML('beforeEnd', `<span class="accountNumber">${account.accountNumber}</span>`);
            }
        }

        /** headers manipulation (adding css classes and appending 'Totals text') */
        if (e.area === 'column' && e.cell.type !== GrandTotal) {
            this.prepareColumnCell(e);
        }

        /** add current classes for the cells that belongs to the current periods */
        if (e.area === 'data' || (e.area === 'column' || e.rowIndex >= 1)) {
            this.addCurrentPeriodsClasses(e);
        }

        /** add zeroValue class for the data cells that have zero values to style them with grey color */
        if (e.area === 'data' && e.cell.value === 0) {
            e.cellElement.classList.add('zeroValue');
        }

        /** disable expanding and hide the plus button of the elements that has no children */
        if (e.area === 'row' && e.cell.path && e.cell.path.length !== e.component.getDataSource().getAreaFields('row').length) {
            if (!this.hasChildsByPath(e.cell.path)) {
                this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', e.cell.path);
                e.cellElement.classList.add('emptyChildren');
                e.cellElement.querySelector('.dx-expand-icon-container').remove();
                e.cellElement.onclick = function(event) {
                    event.stopImmediatePropagation();
                };
            }
        }

        /** If there are some cells to click - click it! */
        if (e.area === 'column' && e.cell.path) {
            if (this.fieldPathsToClick.length) {
                let index;
                this.fieldPathsToClick.forEach((path, arrIndex) => { if (path.toString() === e.cell.path.toString()) index = arrIndex; });
                if (index !== undefined) {
                    delete this.fieldPathsToClick[index];
                    if (!e.cell.expanded) {
                        e.cellElement.click();
                    }
                }
            }
        }

        /** hide long text for row headers and show '...' instead with the hover and long text*/
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path && e.cell.path.length !== 1 && e.cell.text && e.cell.text.length > maxCategoryWidth) {
            e.cellElement.setAttribute('title', e.cell.text.toUpperCase());
            $(e.cellElement).find('> span:first-of-type').text(_.truncate(e.cell.text, maxCategoryWidth));
        }

        /** Show descriptors in Italic */
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path) {
            /** get last row - it is opened */
            let row = e.cell.path.slice(-1);
            let prefix = row[0] ? row[0].slice(0, 2) : undefined;
            if (prefix && prefix === CategorizationPrefixes.TransactionDescriptor) {
                e.cellElement.classList.add('descriptor');
            }
        }

        /** Hide the empty rows */
        if (this.isTransactionDetailHeader(e)) {
            e.cellElement.classList.add('descriptor');
        }

        /** add draggable and droppable attribute to the cells that can be dragged */
        if (this.cellCanBeDragged(e)) {
            e.cellElement.setAttribute('draggable', 'true');
            e.cellElement.setAttribute('droppable', 'false');
        }

        /** Apply user preferences to the data showing */
        this.applyUserPreferencesForCells(e);

        if (this.isReconciliationRows(e) && e.cell.value !== 0) {
            this.addActionButton('discard', e.cellElement);
        }

        if (this.isStartingBalanceDataColumn(e) && e.cell.value == 0) {
            let elements = this.adjustmentsList.filter(cashflowItem => {
                return (e.cell.rowPath[1] === CategorizationPrefixes.AccountName + cashflowItem.accountId || e.cell.rowType == 'T') &&
                    e.cell.columnPath.every((fieldValue, index) => {
                        let field = this.pivotGrid.instance.getDataSource().getAreaFields('column', true)[index];
                        let dateMethod = field.groupInterval === 'day' ? 'date' : field.groupInterval;
                        return field.dataType !== 'date' || (field.groupInterval === 'month' ? cashflowItem.initialDate[dateMethod]() + 1 : cashflowItem.initialDate[dateMethod]()) === e.cell.columnPath[index];
                    });
            });
            if (elements.length) {
                let sum = elements.reduce((x, y) => x + y.amount, 0);
                e.cellElement.classList.add('containsInfo');
                let icon = this.addActionButton('info', e.cellElement, {
                    'data-sum': sum
                });
            }
        }
    }

    /**
     * Return whehter element is cell of cashflow table
     * @param {HTMLElement} element
     * @return {boolean}
     */
    elementIsDataCell(element: HTMLElement): boolean {
        return Boolean(element.closest('.dx-area-data-cell'));
    }

    elementIsStartingBalanceCell(element: HTMLElement): boolean {
        return Boolean(element.closest('.startedBalance'));
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
            /** check the target and if target is cashflow cell and could be moved - highlight all cell where this one could be moved */
            if (cellObj.cell.value) {

                /** add selected class */
                $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
                targetCell.classList.add('chosenFilterForCashFlow');

                let dragImg = new Image();
                dragImg.src = 'assets/common/icons/drag-icon.svg';

                /** set the draggable image */
                e.dataTransfer.setDragImage(dragImg, -10, -10);
                e.dropEffect = 'none';

                $('[droppable]').attr('droppable', 'false');
                /** find the dropable area depend on period */
                /** @todo uncomment to handle moving of historical transactions */
                /* if ($(targetElement).attr('class').indexOf('prev') !== -1) {
                        $(`[droppable]:nth-child(${cellIndex + 1}):not(.chosenFilterForCashFlow)`).attr('droppable', 'true');
                    } else*/
                if (targetCell.getAttribute('class').indexOf('next') !== -1) {
                    $(`[droppable][class*="next"]:not(.chosenFilterForCashFlow)`).attr('droppable', 'true');
                    $(`[droppable]:not(.chosenFilterForCashFlow) > span`).attr('droppable', 'true');
                }
            }
        }
        targetCell = null;
    }

    onDragEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell)) {
            targetCell.classList.remove('dragged');
            $('[droppable]').removeClass('currentDroppable');
            $('[droppable]').attr('droppable', 'false');
        }
        targetCell = null;
    }

    onDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell) && !targetCell.classList.contains('chosenFilterForCashFlow')) {
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
        if (targetCell && this.elementIsDataCell(targetCell) && !targetCell.classList.contains('chosenFilterForCashFlow')) {
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
            let cellObj = this.getCellObjectFromCellElement(targetCell);
            let cellWhereToMove = cellObj;
            let movedCell = this.selectedCell;

            /** Get the transaction of moved cell */
            let itemsToMove = this.getDataItemsByCell(movedCell);

            /** Handle moving of historical transactions */
            /** @todo implement */
            if (targetCell.getAttribute('class').indexOf('prev') !== -1) {
                //let itemsToMovesIds = itemsToMove.map(item => item.id);
            }

            /** Handle moving of forecasts */
            if (targetCell.className.indexOf('next') !== -1) {
                this.moveOrCopyForecasts(itemsToMove, cellWhereToMove, 'move');
            }
        }
        targetCell = null;
    }

    onMouseOver(e) {
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.elementIsDataCell(targetCell) && e.target !== e.relateTarget) {
            let infoButton = targetCell.getElementsByClassName('dx-link-info');
            if (infoButton.length) {
                let sum = parseInt(infoButton[0].getAttribute('data-sum'));
                let infoTooltip = document.createElement('div');
                infoTooltip.className = 'tootipWrapper';
                this.infoTooltip = new Tooltip(infoTooltip, {
                    target: targetCell,
                    contentTemplate: `<div>New account added: ${this.formatAsCurrencyWithLocale(sum, 'en-EN')}</div>`,
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

    moveOrCopyForecasts(forecasts, targetCell, operation: 'copy' | 'move' = 'copy') {
        let targetLowestInterval = this.getLowestIntervalFromPath(targetCell.cell.columnPath, this.getColumnFields());
        let targetCellDate = this.getDateByPath(targetCell.cell.columnPath, this.getColumnFields(), targetLowestInterval);
        let startDate = moment(targetCellDate).startOf(targetLowestInterval);
        let endDate = moment(targetCellDate).endOf(targetLowestInterval);
        let forecastModels = {'forecasts': []};
        let date;
        let categoryId = this.getCategoryValueByPrefix(targetCell.cell.rowPath, CategorizationPrefixes.Category);
        let subCategoryId = this.getCategoryValueByPrefix(targetCell.cell.rowPath, CategorizationPrefixes.SubCategory);
        let transactionDescriptor = this.getCategoryValueByPrefix(targetCell.cell.rowPath, CategorizationPrefixes
.TransactionDescriptor);

        moment.tz.setDefault(undefined);
        forecasts.forEach(forecast => {
            if (forecast.forecastId) {
                date = moment(targetCellDate);
                /** if targetCellDate doesn't have certain month or day - get them from the copied transactions */
                if (['year', 'quarter', 'month'].indexOf(targetLowestInterval) !== -1) {
                    let dayNumber = forecast.initialDate.date() < date.daysInMonth() ? forecast.initialDate.date() : date.daysInMonth();
                    date.date(dayNumber);
                    if (targetLowestInterval === 'year') {
                        targetCellDate.month(forecast.initialDate.month());
                    }
                }

                let forecastModel;
                if (operation === 'copy') {
                    forecastModel = new AddForecastInput({
                        forecastModelId: this.selectedForecastModel.id,
                        bankAccountId: forecast.accountId,
                        date: date,
                        startDate: startDate,
                        endDate: endDate,
                        cashFlowTypeId: forecast.cashflowTypeId,
                        categoryId: subCategoryId || categoryId || -1,
                        transactionDescriptor: transactionDescriptor,
                        currencyId: this.currencyId,
                        amount: forecast.amount
                    });
                } else if (operation === 'move') {
                    /** @todo check moving of transaction to different date range then current one */
                    forecastModel = UpdateForecastInput.fromJS({
                        id: forecast.forecastId,
                        date: date,
                        amount: forecast.amount,
                        categoryId: subCategoryId || categoryId || -1,
                        transactionDescriptor: transactionDescriptor
                    });
                }
                forecastModels.forecasts.push(forecastModel);
            }
        });
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        let method = operation === 'copy' ? 'createForecasts' : 'updateForecasts';
        this._cashFlowForecastServiceProxy[method](
            InstanceType10[this.instanceType],
            this.instanceId,
            forecastModels
        ).subscribe(
            result => {
                /** Get ids from the server in a case of creation or from the local in a case of update */
                let updatedForecastsIds = result || forecastModels.forecasts.map(forecast => forecast.id);

                /** if the operation is update - then also remove the old objects (income or expense, net change and total balance) */
                if (operation === 'move') {
                    forecastModels.forecasts.forEach(forecastModel => {
                        let forecastsInCashflow = this.cashflowData.filter(item => item.forecastId === forecastModel.id);
                        let timezoneOffset = new Date(<any>targetCellDate).getTimezoneOffset();
                        forecastsInCashflow.forEach((forecastInCashflow, index) => {

                            /** Add stub to avoid hiding of old period from cashflow */
                            let stubCopy = this.createStubTransaction(forecastInCashflow);
                            stubCopy.amount = 0;
                            stubCopy.forecastId = null;
                            this.cashflowData.push(stubCopy);

                            /** Change forecast locally */
                            forecastInCashflow.date = moment(targetCellDate).add(timezoneOffset, 'minutes');
                            forecastInCashflow.initialDate = targetCellDate;
                            forecastInCashflow.categoryId = categoryId || subCategoryId || -1;
                            forecastInCashflow.subCategoryId = subCategoryId;
                            forecastInCashflow.transactionDescriptor = transactionDescriptor;
                            forecastsInCashflow[index] = this.addCategorizationLevels(forecastInCashflow);
                        });
                    });
                } else if (operation === 'copy') {
                    forecastModels.forecasts.forEach((forecastModel, index) => {
                        let timezoneOffset = new Date(<any>targetCellDate).getTimezoneOffset();
                        this.cashflowData.push(this.createStubTransaction({
                            accountId: forecastModel.bankAccountId,
                            count: 1,
                            amount: forecastModel.amount,
                            date: moment(targetCellDate).add(timezoneOffset, 'minutes'),
                            initialDate: targetCellDate,
                            forecastId: updatedForecastsIds[index]
                        }, targetCell.cell.rowPath));
                    });
                }
            },
            e => { console.log(e); this.notify.error(e); },
            () => {
                //this.dataSource = this.getApiDataSource();
                this.pivotGrid.instance.getDataSource().reload();
                this.notify.success(this.l('Cell_pasted'));
            }
        );
    }

    applyUserPreferencesForCells(e) {
        let userPreferences = this.getUserPreferencesAppliedTo('cells');
        userPreferences.forEach(preference => {
            if (preference['sourceValue'] !== null && (!preference.areas.length || preference.areas.indexOf(e.area) !== -1)) {
                preference['handleMethod'].call(this, e, preference);
            }
        });
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
    showAmountsWithDecimals(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (!isCellMarked) {
                cellObj.cellElement.innerText = this.formatAsCurrencyWithLocale(Math.round(cellObj.cell.value), 'en-EN', 0);
                /** add title to the cells that has too little value and showen as 0 to show the real value on hover */
                if (cellObj.cell.value > -1 && cellObj.cell.value < 1 && cellObj.cell.value !== 0 && Math.abs(cellObj.cell.value) >= 0.01) {
                    cellObj.cellElement.setAttribute('title', this.formatAsCurrencyWithLocale(cellObj.cell.value, 'en-EN', 2));
                }
            }
        }
    }

    hideZeroValuesInCells(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && (cellObj.cell.value > -0.01 && cellObj.cell.value <= 0)) {
                cellObj.cellElement.innerText = '';
                cellObj.cellElement.classList.add('hideZeroValues');
            }
        }
    }

    showNegativeValuesInRed(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && (cellObj.cell.value > -0.01 && cellObj.cell.value < 0)) {
                cellObj.cellElement.classList.add('red');
            }
        }
    }

    hideColumnsWithZeroActivity(cellObj, preference) {
        //let path = cellObj.cell.columnPath || cellObj.cell.path;
        //if (path) {
        //    let cellPeriod = this.getLowestIntervalFromPath(path, this.getColumnFields());
        //    let isCellMarked = this.userPreferencesService.isCellMarked(
        //        preference['sourceValue'],
        //        ModelEnums.PeriodScope[this.capitalize(cellPeriod)]
        //    );
        //    if (isCellMarked) {
        //        let activity = this.columnHasActivity(cellObj, cellPeriod);
        //        if (!activity) {
        //            cellObj.cellElement.classList.add('hideZeroActivity');
        //            cellObj.cellElement.click(function(event) {
        //                event.stopImmediatePropagation();
        //            });
        //            cellObj.cellElement.innerText = '';
        //        }
        //    }
        //}
    }

    addPreferenceClass(preference) {
        let setting = preference['sourceName'];
        const className = setting + preference['sourceValue'].replace(/ /g, '');
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).removeClass((index, classes) => {
                /** remove old setting class */
                const start = classes.indexOf(setting),
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

    reformatCell(cellObj, preference) {
        const locale = preference.sourceValue.indexOf('.') <= 3 ? 'en-EN' : 'tr';
        if (!cellObj.cellElement.classList.contains('hideZeroActivity') &&
            !cellObj.cellElement.classList.contains('hideZeroValues') &&
            cellObj.cell.value) {
            cellObj.cellElement.innerText = this.formatAsCurrencyWithLocale(cellObj.cell.value, locale);
        }
    }

    formatAsCurrencyWithLocale(value: number, locale: string, fractionDigits = 2) {
        value = value > -0.01 && value <= 0 ? 0 : value;
        return value.toLocaleString(locale, {
            style: 'currency',
            currency: this.currencyId,
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

    /** Get column activity */
    columnHasActivity(cellObj, lowestPeriod) {
        let columnHasActivity = false;
        let path = cellObj.cell.columnPath || cellObj.cell.path;
        let cellDate = this.getDateByPath(path, this.getColumnFields(), lowestPeriod);
        if (cellDate) {
            let dateKey = this.formatToLowest(cellDate, lowestPeriod);
            /** if we have the activity value in cache - get it from there */
            if (this.cachedColumnActivity.get(dateKey)) {
                columnHasActivity = this.cachedColumnActivity.get(dateKey);
            /** else calculate the activity using cashflow data and save it in cache to avoid
             *  a lot of calculations */
            } else {
                columnHasActivity = this.cashflowData.some((cashflowItem) => {
                    return (dateKey === this.formatToLowest(cashflowItem.date, lowestPeriod) &&
                            cashflowItem.amount);
                });
                this.cachedColumnActivity.set(dateKey, columnHasActivity);
            }
        }
        return columnHasActivity;
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
    getCellType(cellObj) {
        let cellType;
        if (this.cellTypesCheckMethods) {
            for (let type of Object.keys(this.cellTypesCheckMethods)) {
                let method = <any>this.cellTypesCheckMethods[type];
                if (method(cellObj)) {
                    cellType = type;
                    break;
                }
            }
        }
        return cellType;
    }

    /**
     * remove css from the cell text, add css as a class, and add the totals text for the fields
     * if it is year or quarter cells
     * @param cellObj
     */
    prepareColumnCell(cellObj) {
        if (cellObj.cell.path) {
            let fieldName, columnFields = this.pivotGrid.instance.getDataSource().getAreaFields('column', false);
            let columnNumber = cellObj.cell.path.length ? cellObj.cell.path.length  - 1 : 0;
            let fieldObj = columnFields.find(field => field.areaIndex === columnNumber);
            let fieldGroup = fieldObj.groupInterval ? 'dateField' : fieldObj.caption.toLowerCase() + 'Field';
            if (fieldGroup === 'dateField') {
                fieldName = fieldObj.groupInterval;
                /** Added 'Total' text to the year and quarter headers */
                if (fieldName === 'year' || fieldName === 'quarter') {
                    let hideHead = (cellObj.cellElement.classList.contains('dx-pivotgrid-expanded') &&
                        (fieldName === 'quarter' || cellObj.cellElement.parentElement.children.length >= 6)) ||
                        (fieldName === 'quarter' && this.quarterHeadersAreCollapsed) ||
                        (fieldName === 'year' && this.yearHeadersAreCollapsed);
                    cellObj.cellElement.onclick = this.headerExpanderClickHandler;
                    cellObj.cellElement.innerHTML = this.getMarkupForExtendedHeaderCell(cellObj, hideHead, fieldName);
                }
                if (fieldName === 'day') {
                    let dayNumber = cellObj.cell.path.slice(-1)[0],
                        dayEnding = [, 'st', 'nd', 'rd'][ dayNumber % 100 >> 3 ^ 1 && dayNumber % 10] || 'th';
                    cellObj.cellElement.insertAdjacentHTML('beforeEnd', `<span class="dayEnding">${dayEnding}</span>`);
                    /** Add day name */
                    cellObj.cellElement.insertAdjacentHTML('beforeEnd', `<span class="dayName">${cellObj.date.format('ddd').toUpperCase()}</span>`);
                }
            } else if (fieldGroup === 'historicalField') {
                fieldName = this.historicalClasses[cellObj.cell.path.slice(-1)[0]];
            } else if (fieldGroup === 'projectedField') {
                fieldName = cellObj.cell.value === 1 ? 'projected' : 'mtd';
            }

            /** add class to the cell */
            cellObj.cellElement.classList.add(fieldGroup, fieldName);

            /** hide projected field for not current months for mdk and projected */
            if (fieldGroup === 'projectedField') {
                /** hide the projected fields if the group interval is */
                if (this.groupInterval === 'day') {
                    cellObj.cellElement.style.display = 'none';
                }
                fieldName = 'projected';
            }

            /** add class to the whole row */
            cellObj.cellElement.parentElement.classList.add(`${fieldName}Row`);
        }
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
     * Add the classes for the current cells such as currentYear, currentQuarter and currentMonth
     */
    addCurrentPeriodsClasses(cellObj) {
        let path = cellObj.cell.path ? cellObj.cell.path : cellObj.cell.columnPath;
        if (path) {
            let fieldIndex = path.length - 1;
            let cellField = this.getColumnFields()[fieldIndex];
            let fieldCaption = cellField.caption.toLowerCase();
            let cellValue = path[fieldIndex];
            let className;
            if (cellField.dataType === 'date') {
                let currentDate = moment();
                let method = fieldCaption === 'day' ? 'date' : fieldCaption;
                let periodFormat;
                switch (fieldCaption) {
                    case 'year'    : periodFormat = 'YYYY'; break;
                    case 'quarter' : periodFormat = 'YYYY.QQ'; break;
                    case 'month'   : periodFormat = 'YYYY.MM'; break;
                    case 'day'     : periodFormat = 'YYYY.MM.DD'; break;
                }
                let cellDate = this.getDateByPath(path, this.getColumnFields(), fieldCaption);
                let cellDateFormated = cellDate.format(periodFormat);
                let currentDateFormated = currentDate.format(periodFormat);
                if (cellDateFormated === currentDateFormated) {
                    className = `current${_.capitalize(fieldCaption)}`;
                } else if (cellDateFormated < currentDateFormated) {
                    className = `prev${_.capitalize(fieldCaption)}`;
                } else if (cellDateFormated > currentDateFormated) {
                    className = `next${_.capitalize(fieldCaption)}`;
                }
            } else if (fieldCaption === 'projected') {
                if (cellValue === Projected.Today) {
                    className = `current${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Mtd) {
                    className = `prev${_.capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Forecast) {
                    className = `next${_.capitalize(fieldCaption)}`;
                }
            }
            if (className) {
                cellObj.cellElement.classList.add(className);
            }
        }
    }

    /**
     * Add day names to the cell
     * @param cellObj
     */
    addWeekendAttribute(cellObj) {
        /** if day number is 0 (sunday) or 6 (saturday) */
        let isWeekend = cellObj.date.day() === 0 || cellObj.date.day() === 6;
        cellObj.cellElement.setAttribute('data-is-weekend', isWeekend);
    }

    /**
     * Gets the mtd or projected 0 or 1 from the path
     * @param projected
     */
    getProjectedValueByPath(path) {
        let projectedFieldIndex = this.getAreaIndexByCaption('projected');
        return projectedFieldIndex ? path[projectedFieldIndex] : undefined;
    }

    /**
     * Hide projected field if they all are expanded
     * @param cellObj
     */
    hideProjectedFields() {
        let projectedFields = this.getElementRef().nativeElement.querySelectorAll('.projectedField');
        if (projectedFields && projectedFields.length) {

            let projectedFieldsAreAllExpanded = Array.prototype.every.call(projectedFields, projectedCell => {
                return projectedCell.classList.contains('dx-pivotgrid-expanded');
            });

            if (projectedFieldsAreAllExpanded) {
                /** if current month and year are not corresponding to the year and month of projected field - then add hide class */
                Array.prototype.forEach.call(projectedFields, projectedCell => {
                    projectedCell.classList.add('projectedHidden');
                    projectedCell.innerHTML = '';
                });
            }
        }
    }

    /**
     * initialize the click trigger for the cell column if user click for the left empty cell
     * @param cellObj
     */
    bindCollapseActionOnWhiteSpaceColumn(cellObj) {
        let totalCell = $(cellObj.cellElement).parent().nextAll('.dx-expand-border').first().find('td.dx-total');
        totalCell.trigger('click');
    }

    getRequestFilterFromPath(path) {
        let requestFilter = Object.assign({}, this.requestFilter);
        const datePeriod = this.formattingDate(path);
        /** if somehow user click on the cell that is not in the filter date range - return */
        if (this.requestFilter.startDate && datePeriod.endDate < this.requestFilter.startDate ||
            this.requestFilter.endDate && datePeriod.startDate > this.requestFilter.endDate) {
            return;
        }
        requestFilter.groupByPeriod = StatsFilterGroupByPeriod.Daily;
        requestFilter.startDate = this.requestFilter.startDate && this.requestFilter.startDate > datePeriod.startDate ? this.requestFilter.startDate : datePeriod.startDate;
        requestFilter.endDate = this.requestFilter.endDate && this.requestFilter.endDate < datePeriod.endDate ? this.requestFilter.endDate : datePeriod.endDate;
        requestFilter.calculateStartingBalance = false;
        return requestFilter;
    }

    onCellClick(cellObj) {

        /** Dissallow collapsing of empty projected field and historical fields */
        if (/*(this.isEmptyProjectedField(cellObj) && cellObj.cellElement.classList.contains('dx-pivotgrid-expanded')) || */this.isHistoricalCell(cellObj)) {
            cellObj.cancel = true;
        }

        /** If user click to the month header - then sent new getStats request for this month to load data for that month */
        let isMonthHeaderCell = this.isMonthHeaderCell(cellObj);
        if (isMonthHeaderCell && !cellObj.cell.expanded) {
            let pathForMonth = isMonthHeaderCell ? cellObj.cell.path : cellObj.cell.path.slice(0, -1);
            if (!this.monthsDaysLoadedPathes.some(arr => arr.toString() === pathForMonth.toString())) {
                moment.tz.setDefault(undefined);
                abp.ui.setBusy();
                /** Prevent default expanding */
                cellObj.cancel = true;
                let requestFilter = this.getRequestFilterFromPath(cellObj.cell.path);
                this._cashflowServiceProxy
                    .getStats(InstanceType[this.instanceType], this.instanceId, requestFilter)
                    .pluck('transactionStats')
                    .subscribe( (transactions: any) => {

                        /** Update cashflow data with the daily transactions */
                        this.handleDailyCashflowData(transactions, requestFilter.startDate, requestFilter.endDate);

                        /** Reload the cashflow */
                        this.pivotGrid.instance.getDataSource().reload();

                        /** Mark the month as already expanded to avoid double data loading */
                        this.monthsDaysLoadedPathes.push(pathForMonth);

                        /** Expand month into days */
                        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', cellObj.cell.path);

                        /** If month is not current month or the month has only mtd days - then expand it into days instead of projected or mtd */
                        let monthIsCurrent = requestFilter.startDate.format('MM.YYYY') === moment().format('MM.YYYY');
                        let todayIsLastDayOfTheMonth = this.isLastDayOfMonth(moment());
                        if (!monthIsCurrent || todayIsLastDayOfTheMonth) {
                            let pathCopy = cellObj.cell.path.slice();
                            let projectedValue = monthIsCurrent && todayIsLastDayOfTheMonth ? Projected.Mtd : Projected.Total;
                            pathCopy.push(projectedValue);
                            this.fieldPathsToClick.push(pathCopy);
                        }

                        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                    });
            }
        }

        /** Add copy event to the cells */
        if (this.isCopyable(cellObj)) {
            $(cellObj.element).off('copy paste')
                .on('copy', ev => {
                    this.copiedCell = this.selectedCell;
                    this.notify.info(this.l('Cell_Copied'));
                })
                .on('paste', ev => {
                    let targetCell = this.selectedCell;
                    /** If user copy to the accounting type - show popup with message that he should select the category */
                    /** @todo implement */
                    /** Allow copy paste only for the same cashflowTypeId and to the current or forecast periods */
                    if (this.selectedCell.cell.rowPath[0] === targetCell.cell.rowPath[0] &&
                        targetCell.cell.columnPath[0] !== Periods.Historical) {
                        let forecastsItems = this.getDataItemsByCell(this.copiedCell);
                        this.moveOrCopyForecasts(forecastsItems, targetCell, 'copy', );
                    }
                });
        } else {
            $(cellObj.element).off('copy paste');
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
            this.statsDetailFilter = this.getDetailFilterFromCell(cellObj);

            $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
            cellObj.cellElement.classList.add('chosenFilterForCashFlow');
            this.selectedCell = cellObj;

            this.handleDoubleSingleClick(cellObj, null, this.handleDataCellDoubleClick.bind(this));
        }

    }

    handleDataCellDoubleClick(cellObj) {
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
                let cellDate = this.getDateByPath(cellObj.cell.columnPath, columnFields, 'day');
                if (
                    /** disallow adding historical periods */
                    (
                        /** If column of cell is date column */
                        columnFields.find(field => field.areaIndex === cellObj.cell.columnPath.length - 1)['caption'] === 'Day' &&
                        /** check the date - if it is mtd date - disallow editing, if projected - welcome on board */
                        cellDate.format('YYYY.MM.DD') > moment().format('YYYY.MM.DD')
                    ) &&
                    /** allow adding only for empty cells */
                    result.length === 0 &&
                    /** disallow adding unclassified category, but allow change or add (no descriptor) */
                    (clickedCellPrefix || cellObj.cell.rowPath.length !== 2) &&
                    /** disallow adding of these levels */
                    clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountingType &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountName
                    // check feature
                    && this.isEnableForecastAdding()
                ) {
                    this.handleAddOrEdit(cellObj, result);
                } else {
                    this.showTransactionDetail(result);
                }
            });
    }

    isLastDayOfMonth(date: moment.Moment): boolean {
        return date.date() === date.daysInMonth();
    }

    getDetailFilterFromCell(cellObj) {
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
            bankIds: this.requestFilter.bankIds || [],
            accountIds: accountsIds,
            businessEntityIds: this.requestFilter.businessEntityIds || [],
            searchTerm: this.searchValue,
            forecastModelId: this.selectedForecastModel ? this.selectedForecastModel.id : undefined
        };
        if (this.searchValue)
            this.showAllDisabled = false;

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

    isEnableForecastAdding() {
        if (!abp.session.tenantId)
            return true;

        let futureForecastsYearCount = parseInt(this.feature.getValue('CFO.FutureForecastsYearCount'));
        if (!futureForecastsYearCount)
            return false;

        let possibleStartDate = moment().startOf('day');
        let possibleEndDate = moment().add('day', -1).add('year', futureForecastsYearCount).endOf('day');
        let date = this.statsDetailFilter.startDate > moment() ? this.statsDetailFilter.startDate : moment();

        return (date >= possibleStartDate && date <= possibleEndDate);
    }

    handleAddOrEdit(cellObj, details) {
        let element: HTMLElement = cellObj.cellElement;
        this.currentCellOperationType = details.length === 0 ? 'add' : 'update';
        if (this.modifyingCelltextBox) {
            let parent = this.modifyingCelltextBox.parentElement;
            this.modifyingCelltextBox.remove();
            this.modifyingCelltextBox = null;
            $(parent).children().show();
            parent.style.padding = window.getComputedStyle(cellObj.cellElement).padding;
        }
        /** @todo uncommment */
        if (!element.querySelector('span'))
            $(element).wrapInner('<span></span>');
        $(element).children().hide();
        this.oldCellPadding = window.getComputedStyle(element).padding;
        element.style.padding = '0';
        if (details.length === 1) {
            this.clickedRowResult = details[0];
        }

        this.modifyingCelltextBox = document.createElement('div');
        this.modifyingCelltextBox.onclick = function(ev) {
            ev.stopPropagation();
        };

        let numberBoxInstance = new NumberBox(this.modifyingCelltextBox, {
            value: cellObj.cell.value,
            height: element.clientHeight,
            onEnterKey: this.saveForecast.bind(this, cellObj),
            onFocusOut: this.saveForecast.bind(this, cellObj)
        });

        element.appendChild(this.modifyingCelltextBox);
        element = null;
        document.getSelection().removeAllRanges();
    }

    showTransactionDetail(details) {
        this.statsDetailResult = details.map(detail => {
            this.removeLocalTimezoneOffset(detail.date);
            this.removeLocalTimezoneOffset(detail.forecastDate);
            return detail;
        });

        setTimeout(() => {
            let height = this._cacheService.get(this.cashflowDetailsGridSessionIdentifier);
            if (height) {
                let cashflowWrapElement = <HTMLElement>document.querySelector('.cashflow-wrap');
                cashflowWrapElement.style.height = height + "px";
            }
        }, 0);
    }

    onTransactionDetailsResize($event) {
        this.cashFlowGrid.height = $event.height;
    }

    onTransactionDetailsResizeEnd($event) {
        this._cacheService.set(this.cashflowDetailsGridSessionIdentifier, $event.height);
    }

    saveForecast() {
        let event = arguments[1];
        let numberInputBlock: HTMLElement = event.component.element();
        let savedCellObj = arguments[0];
        let newValue = event.component.option('value');
        let parentTd = numberInputBlock.parentElement;
        event.component.dispose();
        this.modifyingCelltextBox = null;
        $(parentTd).css('padding', this.oldCellPadding);
        $(parentTd).children().show();
        if (+newValue !== savedCellObj.cell.value) {
            if (+newValue === 0) {
                this.currentCellOperationType = 'delete';
            }
            let forecastModel;
            let cashflowTypeId = this.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.CashflowType);
            let categoryId = this.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.Category);
            let subCategoryId = this.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.SubCategory);
            let transactionDescriptor = this.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor);
            if (this.currentCellOperationType === 'add') {
                /** @todo fix bug with wrong date */
                let forecastedDate = this.statsDetailFilter.startDate > moment() ? this.statsDetailFilter.startDate : moment();
                forecastModel = new AddForecastInput({
                    forecastModelId: this.selectedForecastModel.id,
                    bankAccountId: this.bankAccounts[0].id,
                    date: forecastedDate,
                    startDate: this.statsDetailFilter.startDate,
                    endDate: this.statsDetailFilter.endDate,
                    cashFlowTypeId: cashflowTypeId,
                    categoryId: subCategoryId || categoryId || -1,
                    transactionDescriptor: transactionDescriptor,
                    currencyId: this.currencyId,
                    amount: newValue
                });
            } else if (this.currentCellOperationType === 'update') {
                forecastModel = UpdateForecastInput.fromJS({
                    id: this.clickedRowResult.forecastId,
                    amount: newValue
                });
            } else if (this.currentCellOperationType === 'delete') {
                forecastModel = this.clickedRowResult.forecastId;
            }

            this._cashFlowForecastServiceProxy[`${this.currentCellOperationType}Forecast`](
                InstanceType10[this.instanceType],
                this.instanceId,
                forecastModel
            ).subscribe(
                res => {
                    let cellDate = this.formattingDate(savedCellObj.cell.columnPath);
                    let date = cellDate.startDate > moment() ? moment(cellDate.startDate).add(new Date(<any>cellDate.startDate).getTimezoneOffset(), 'minutes') : moment().add(new Date().getTimezoneOffset());
                    let initialDate = cellDate.startDate > moment() ? cellDate.startDate : moment();
                    /** Update data locally */
                    if (this.currentCellOperationType === 'add') {
                        this.cashflowData.push(this.createStubTransaction({
                            accountId: this.bankAccounts[0].id,
                            count: 1,
                            amount: newValue,
                            date: date,
                            initialDate: initialDate,
                            forecastId: res
                        }, savedCellObj.cell.rowPath));
                    } else {
                        /** Find an item and its total and edit it */
                        this.cashflowData.forEach(item => {
                            if (item.forecastId === this.clickedRowResult.forecastId) {
                                item.amount = newValue;
                            }
                        });
                    }
                    this.getApiDataSource();
                    this.pivotGrid.instance.getDataSource().reload();
                });
        }
    }

    getCategoryValueByPrefix(path, prefix: CategorizationPrefixes) {
        let value;
        path.some(pathItem => {
            if (pathItem) {
                if (pathItem.slice(0, 2) === prefix) {
                    value = pathItem.slice(2);
                    return true;
                }
            }
            return false;
        });
        return value;
    }

    cellHasForecasts(cellObj) {
        let path = cellObj.cell.columnPath || cellObj.cell.path;
        let columnFieds = this.getColumnFields();
        let lastPeriod = this.getLowestIntervalFromPath(path, columnFieds);
        let cellDate = this.getDateByPath(path, columnFieds, lastPeriod);
        return cellDate.endOf(lastPeriod).isAfter(moment());
    }

    /**
     * Return the date object from the cell
     * @param path
     * @param columnFields
     * @return {any}
     */
    getDateByPath(path, columnFields, lowestInterval ?: string) {
        lowestInterval = lowestInterval || this.getLowestIntervalFromPath(path, columnFields);
        let date = moment.unix(0).tz('UTC');
        let dateFields = this.getDateFields(columnFields, lowestInterval);
        dateFields.forEach(dateField => {
            let method = dateField.groupInterval === 'day' ? 'date' : dateField.groupInterval,
                fieldValue = path[dateField.areaIndex];
            if (fieldValue) {
                fieldValue = dateField.groupInterval === 'month' ? fieldValue - 1 : fieldValue;
                /** set the new interval to the moment */
                date[method](fieldValue);
            }
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

    getLowestIntervalFromPath(path, columnFields) {
        let lastOpenedColumnIndex = path.length - 1;
        let lastOpenedField = columnFields[lastOpenedColumnIndex];
        while (lastOpenedField && lastOpenedField.dataField !== 'date') {
            lastOpenedField = columnFields[--lastOpenedColumnIndex];
        }
        return lastOpenedField ? lastOpenedField.groupInterval : null;
    }

    customCurrency(value) {
        return (value).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    formattingDate(path) {
        let columnFields = {};
        this.getColumnFields().forEach(item => {
            columnFields[item.caption.toLowerCase()] = item.areaIndex;
        });

        let startDate: moment.Moment = moment.utc('1970-01-01');
        let endDate: moment.Moment = moment.utc('1970-01-01');
        let year = path[columnFields['year']];
        let quarter = path[columnFields['quarter']];
        let month = path[columnFields['month']];
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
            /** Exclude projected */
            if (projected === Projected.Forecast) {
                endDate.date(moment().date());
                /** or mtd dates */
            } else if (projected === Projected.Mtd) {
                startDate.date(moment().date() + 1);
            }
        }

        return {startDate: startDate, endDate: endDate};
    }

    closeTransactionsDetail() {
        this.statsDetailResult = undefined;
        this.showAllDisabled = true;
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
    hasChildsByPath(path) {
        let lastLevel = path.slice(-1);
        if (lastLevel && lastLevel[0]) {
            return this.cashflowDataTree[lastLevel[0]];
        }
        return false;
    }

    /**
     *  recalculates sum of the starting balance (including previous totals)
     *  and recalculates ending cash positions values (including previous totals)
     *  @param summaryCell
     *  @return {number}
     */
    calculateSummaryValue() {
        return summaryCell => {

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
        let rowInfo = summaryCell.value(summaryCell.field('row').dataField);
        let result = false;
        /** add the rowInfo to cash to avoid checking for every cell */
        if (!this.cachedRowsFitsToFilter.has(rowInfo) || !rowInfo) {
            this.treePathes.forEach(path => {
                if (path.indexOf(rowInfo) !== -1) {
                    /** Handle for uncategorized */
                    if (!rowInfo) {
                        let parent = summaryCell.parent('row');
                        let parentInfo = parent.value(parent.field('row').dataField);
                        if (path.indexOf(parentInfo) !== -1) {
                            cellsToCheck = underscore.union(cellsToCheck, path);
                        }
                    } else {
                        cellsToCheck = underscore.union(cellsToCheck, path);
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
                targetPeriodAccountCachedValue = this.getAnotherPeriodAccountCachedValue(cellData.toString());
                /** if we haven't found the value in cash - then we should calculate the value in the cashflow data by ourselves */
                if (!targetPeriodAccountCachedValue) {
                    /** calculate the cell value using the cell data and cashflowData */
                    targetPeriodAccountCachedValue = this.calculateCellValue(cellData, this.cashflowData);
                    this.setAnotherPeriodAccountCachedValue(cellData.toString(), targetPeriodAccountCachedValue);
                }
            } else {
                /** add the prevEndingAccount value to the cash */
                this.setAnotherPeriodAccountCachedValue(cellData.toString(), targetPeriodAccountCell.value(isCalculatedValue));
            }

        return targetPeriodAccountCachedValue ?
               targetPeriodAccountCachedValue :
               (targetPeriodAccountCell ? targetPeriodAccountCell.value(isCalculatedValue) || 0 : 0);
    }

    getCellData(summaryCell, accountId, cashflowTypeId) {
        const groupInterval = summaryCell.field('column') ? summaryCell.field('column').groupInterval : 'historical',
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
        /** {cashflowTypeId: 'T', accountId: 10, quarter: 3, year: 2015, month: 5} */
        let value = dataArray.reduce((sum, cashflowData) => {
            let date = cashflowData.initialDate || cashflowData.date;
            if (
                cashflowData.cashflowTypeId === cellData.cashflowTypeId &&
                /** if account id is B - then we should get all accounts */
                (cellData.accountId === StartedBalance || cellData.accountId === Total || cashflowData.accountId == cellData.accountId) &&
                (!cellData.year || (cellData.year === date.year())) &&
                (!cellData.quarter || (cellData.quarter === date.quarter())) &&
                (!cellData.month || ( cellData.month - 1 === date.month())) &&
                (!cellData.day || (cellData.day === date.date()))
            ) {
                sum += cashflowData.amount;
            }
            return sum;
        }, 0);
        return value;
    }

    /** get the prev ending account from the cash */
    getAnotherPeriodAccountCachedValue(key) {
        return this.anotherPeriodAccountsValues.get(key);
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
        return this.checkCellType(summaryCell, StartedBalance);
    }

    isCellDiscrapencyCell(summaryCell): boolean {
        return this.checkCellType(summaryCell, Reconciliation);
    }

    checkCellType(summaryCell, type): boolean {
        return summaryCell.field('row') !== null &&
            summaryCell.value(summaryCell.field('row')) === (CategorizationPrefixes.CashflowType + type);
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

    searchValueChange(e) {
        this.searchValue = e['value'];

        if (this.searchValue) {
            this.showAllDisabled = true;
            let filterParams = {
                startDate: this.requestFilter.startDate,
                endDate: this.requestFilter.endDate,
                currencyId: this.currencyId,
                bankIds: this.requestFilter.bankIds || [],
                accountIds: this.requestFilter.accountIds || [],
                businessEntityIds: this.requestFilter.businessEntityIds || [],
                searchTerm: this.searchValue
            };
            this.statsDetailFilter = StatsDetailFilter.fromJS(filterParams);
            this._cashflowServiceProxy
                .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                .subscribe(result => {
                    this.statsDetailResult = result.map(detail => {
                        this.removeLocalTimezoneOffset(detail.date);
                        this.removeLocalTimezoneOffset(detail.forecastDate);
                        return detail;
                    });
                });
        } else {
            this.statsDetailResult = null;
            this.closeTransactionsDetail();
        }
    }

    showAll(e) {
        this.showAllDisabled = true;
        this.statsDetailFilter.searchTerm = '';
        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
            .subscribe(result => {
                this.statsDetailResult = result.map(detail => {
                    this.removeLocalTimezoneOffset(detail.date);
                    this.removeLocalTimezoneOffset(detail.forecastDate);
                    return detail;
                });
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
        if (this.detailsCellIsEditable(e)) {

        }
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
    validateForecastDate(e) {
        return e.value.toLocaleDateString() >= new Date().toLocaleDateString();
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
            this._cashFlowForecastServiceProxy
                .updateForecast(
                    InstanceType10[this.instanceType],
                    this.instanceId,
                    UpdateForecastInput.fromJS(data)
                )
                .subscribe();

            /** Remove opposite cell */
            if (paramName === 'debit' || paramName === 'credit') {
                let oppositeParamName = paramName === 'debit' ? 'credit' : 'debit';
                if (e.oldData[oppositeParamName] !== null) {
                    let rowKey = this.cashFlowGrid.instance.getRowIndexByKey(e.key);
                    /** remove the value of opposite cell */
                    this.cashFlowGrid.instance.cellValue(rowKey, oppositeParamName, null);
                }
            }
        }
    }

    mapParamNameToUpdateParam(paramName) {
        let detailsParamsToUpdateParams = {
            'forecastDate': 'date',
            'credit': 'amount',
            'debit': 'amount',
            'description': 'transactionDescriptor'
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

        if (data.bankAccountIds) {
            accountFilter.items['element'].setValue(data.bankAccountIds, accountFilter);
        } else {
            accountFilter.items['element'].setValue([], accountFilter);
        }
        this._filtersService.change(accountFilter);
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
                let discardDiscrepancyInput = DiscardDiscrepancyInput.fromJS({
                    bankIds: filterDetails.bankIds,
                    bankAccountIds: filterDetails.accountIds,
                    currencyId: filterDetails.currencyId,
                    startDate: filterDetails.startDate,
                    endDate: filterDetails.endDate
                });

                this._bankAccountsServiceProxy.discardDiscrepancy(InstanceType[this.instanceType], this.instanceId, discardDiscrepancyInput)
                    .subscribe((result) => { this.refreshDataGrid(); });
            }
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
}
