import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { GroupbyItem } from './models/groupbyItem';

import {
    CashflowServiceProxy,
    StatsFilter,
    CashFlowInitialData,
    StatsDetailFilter,
    TransactionStatsDto,
    CashFlowForecastServiceProxy,
    ClassificationServiceProxy,
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
    TransactionStatsDtoAdjustmentType
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from './preferences-dialog/preferences.service';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { OperationsComponent } from './operations/operations.component';
import { DxPivotGridComponent, DxDataGridComponent } from 'devextreme-angular';
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

import { SortState } from '@app/cfo/shared/common/sorting/sort-state';
import { SortingItemModel } from '@app/cfo/shared/common/sorting/sorting-item.model';

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

enum CategorizationPrefixes  {
    CashflowType            = 'CT',
    AccountName             = 'AN',
    AccountType             = 'AT',
    Category                = 'CA',
    SubCategory             = 'SC',
    TransactionDescriptor   = 'TD'
}

class CashflowCategorizationModel {
    prefix: string;
    statsKeyName: string;
    namesSource?: string;
    childNamesSource?: string;
    childReferenceProperty?: string;
}

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashflowServiceProxy, CashFlowForecastServiceProxy, CacheService, ClassificationServiceProxy, UserPreferencesService ]
})
export class CashflowComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    @ViewChild(DxDataGridComponent) cashFlowGrid: DxDataGridComponent;
    @ViewChild(OperationsComponent) operations: OperationsComponent;
    selectedBankAccounts = [];
    reportPeriod = {};
    defaultReportPeriod = {};
    showAllDisabled = true;
    noRefreshedAfterSync: boolean;
    headlineConfig: any;
    categoryTree: GetCategoryTreeOutput;
    cashflowData: any;
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
    filterBy;
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
            'prefix'                 : CategorizationPrefixes.AccountType,
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
    groupbyItems: GroupbyItem[] = [
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
    expandedIncomeExpense = false;
    leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
        NetChange,
        Total,
        Reconciliation
    ];
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
            areaIndex: 2,
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
            areaIndex: 3,
            dataField: 'level4',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Amount',
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: {
                type: 'currency',
                precision: 2
            },
            area: 'data',
            showColumnTotals: true,
            calculateSummaryValue: this.calculateSummaryValue(),
            summaryDisplayMode: 'percentOfColumnTotal'
        },
        {
            caption: 'Historical',
            area: 'column',
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
            groupInterval: 'year',
            showTotals: false,
            visible: true,
            summaryDisplayMode: 'percentVariation'
        },
        {
            caption: 'Quarter',
            dataField: 'date',
            dataType: 'date',
            width: 0.01,
            area: 'column',
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
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        // {
        //     caption: 'Projected',
        //     area: 'column',
        //     showTotals: false,
        //     selector: function(dataItem) {
        //         return dataItem.forecastId ? 1 : 0;
        //     },
        //     customizeText: cellInfo => {
        //         let projectedKey = cellInfo.value === 1 ? 'Projected' : 'Mtd';
        //         return this.l(projectedKey).toUpperCase();
        //     },
        //     expanded: false,
        //     allowExpand: false
        // },
        {
            caption: 'Day',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            groupInterval: 'day',
            visible: true
        }
    ];
    historicalTextsKeys = [
        'Periods_Historical',
        'Periods_Current',
        'Periods_Forecast'
    ];
    historicalClasses = [
        'historical',
        'current',
        'forecast'
    ];
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
    categoryToolbarConfig = [
        {
            location: 'center', items: [
                {
                    name: 'find',
                    action: (event) => {
                        event.jQueryEvent.stopPropagation();
                        event.jQueryEvent.preventDefault();
                        let toolbarElement = event.element.closest('.dx-area-description-cell');
                        if (!toolbarElement.find('#findInputBlock').length) {
                            let searchInputBlock = $('<div id="findInputBlock"><div></div></div>');
                            searchInputBlock.find('div')
                                .dxTextBox({
                                    showClearButton: true,
                                    mode: 'search',
                                    onValueChanged: e => {
                                        searchInputBlock.hide();
                                        this.cashedRowsFitsToFilter.clear();
                                        this.filterBy = e.element.find('input').val()
                                        this.pivotGrid.instance.getDataSource().reload();
                                    }
                                });
                            searchInputBlock.appendTo(toolbarElement);
                        } else {
                            toolbarElement.find('#findInputBlock').show();
                        }
                        toolbarElement.find('input').focus();
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
                        items: [{
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
                        ]
                    }
                }
            ]
        }
    ];
    maxCategoriesWidth = 25;
    footerToolbarConfig = [];
    private initialData: CashFlowInitialData;
    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;
    private requestFilter: StatsFilter;
    private anotherPeriodAccountsValues: Map<object, number> = new Map();
    private cashedColumnActivity: Map<string, boolean> = new Map();
    private cashedRowsFitsToFilter: Map<string, boolean> = new Map();
    transactionsTotal = 0;
    transactionsAmount = 0;
    transactionsAverage = 0;
    startDataLoading = false;
    filteredLoad = false;
    contentReady = false;
    adjustmentsList = [];
    modifyingCelltextBox;
    currentCellOperationType: string;
    oldCellPadding: string;
    clickedRowResult;
    clickedCellObj;
    quarterHeadersAreCollapsed = false;
    yearHeadersAreCollapsed = false;
    selectedCell;
    copiedCell;
    monthsDaysLoadedPathes = [];
    cashflowDetailsGridSessionIdentifier: string = `cashflow_forecastModel_${abp.session.tenantId}_${abp.session.userId}`;

    constructor(injector: Injector,
                private _cashflowServiceProxy: CashflowServiceProxy,
                private _filtersService: FiltersService,
                private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
                private _cacheService: CacheService,
                private _classificationServiceProxy: ClassificationServiceProxy,
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
        let getCategoryTreeObservalble = this._classificationServiceProxy.getCategoryTree(InstanceType[this.instanceType], this.instanceId);
        let getCashflowGridSettings = this._cashflowServiceProxy.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
        Observable.forkJoin(getCashFlowInitialDataObservable, getForecastModelsObservable, getCategoryTreeObservalble, getCashflowGridSettings)
            .subscribe(result => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(result[0]);

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
        this.addHeaderExpandClickHandling();
    }

    @HostListener('window:resize') onResize() {
        this.handleBottomHorizontalScrollPosition();
    }

    customizeFieldText(cellInfo, emptyText = null) {

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
                text = account ? account.accountNumber + (account.accountName ? ': ' + account.accountName : '') : cellInfo.valueText;
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
                /** Reset cashed days months to apply the date filter again */
                /** @todo reset only for the month for which the filter changed */
                if (filter.caption.toLowerCase() === 'date') {
                    this.monthsDaysLoadedPathes = [];
                    if (filter.items.from.value)
                        this.reportPeriod['start'] = filter.items.from.value.getFullYear();
                    else
                        this.reportPeriod['start'] = this.defaultReportPeriod['start'];

                    if (filter.items.to.value)
                        this.reportPeriod['end'] = filter.items.to.value.getFullYear();
                    else
                        this.reportPeriod['end'] = this.defaultReportPeriod['end'];
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
    }

    /**
     * Add the handling of the click on the date header cells in pivot grid
     */
    addHeaderExpandClickHandling() {
        window['onHeaderExpanderClick'] = $event => {
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
                this.synchronizeCashflowHeaders();
            }
        };
    }

    /**
     * Handle the subscription result from getInitialData Observable
     * @param initialDataResult
     */
    handleCashFlowInitialResult(initialDataResult) {
        this.initialData = initialDataResult;
        this.cashflowTypes = this.initialData.cashflowTypes;
        this.addCashflowType(Total, this.l('Ending Cash Balance'));
        this.addCashflowType(NetChange, this.l('Net Change'));
        this.bankAccounts = this.initialData.banks.map(x => x.bankAccounts).reduce((x, y) => x.concat(y));
        this._filtersService.setup(
            this.filters = [
                new FilterModel({
                    field: 'accountIds',
                    component: FilterCheckBoxesComponent,
                    caption: 'Account',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: FilterHelpers.ConvertBanksToTreeSource(initialDataResult.banks),
                                nameField: 'name',
                                parentExpr: 'parentId',
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
                            iconSrc: 'assets/common/icons/close.svg'
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

    handleForecastModelDoubleClick(e) {
        e.itemElement.append(`<div class="editModel">
                                <input value="${e.itemData.text}">
                             </div>`);
        let thisComponent = this;
        e.itemElement.find('.editModel').focusout(function() {
            let newName = $(this).find('input').val();
            /** Rename forecast model if the name changed */
            if (e.itemData.text !== newName) {
                thisComponent.renameForecastModel({
                    id: e.itemData.id,
                    newName: newName
                }).subscribe(result => {
                    e.itemElement.find('.dx-tab-text').text(newName);
                    thisComponent.forecastModelsObj.items[e.itemIndex].text = newName;
                }, error => {
                    console.log('unable to rename forecast model');
                });
            }
            $(this).remove();
        });
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
        e.element.append(`<div class="addModel">
                            <input value="">
                          </div>`);
        let thisComponent = this;
        e.itemElement.find('.addModel').focusout(function() {
            let modelName = $(this).find('input').val();
            /** Add forecast model */
            if (modelName) {
                thisComponent.addForecastModel(modelName)
                    .subscribe(result => {

                    }, error => {
                        console.log('unable to add forecast model');
                    });
            }
            $(this).remove();
        });
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
            this.expandedIncomeExpense = false;
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

        super.ngOnDestroy();
    }

    loadGridDataSource() {
        this.startLoading();
        this.requestFilter.forecastModelId = this.selectedForecastModel.id;
        /** @todo refactor - completely rewrite with using rxjs operators */
        this._cashflowServiceProxy
            .getStats(InstanceType[this.instanceType], this.instanceId, this.requestFilter)
            .pluck('transactionStats')
            .subscribe((transactions: any) => {
                this.startDataLoading = true;
                if (transactions && transactions.length) {
                    /** categories - object with categories */
                    this.cashflowData = this.getCashflowDataFromTransactions(transactions);
                    /** Make a copy of cashflow data to display it in custom total group on the top level */
                    let stubCashflowDataForEndingCashPosition = this.getStubCashflowDataForEndingCashPosition(this.cashflowData);
                    let stubCashflowDataForAllDays = this.getStubCashflowDataForAllPeriods(this.cashflowData, 'month');
                    let cashflowWithStubForEndingPosition = this.cashflowData.concat(stubCashflowDataForEndingCashPosition);
                    let stubCashflowDataForAccounts = this.getStubCashflowDataForAccounts(cashflowWithStubForEndingPosition);
                    /** concat initial data and stubs from the different hacks */
                    this.cashflowData = cashflowWithStubForEndingPosition.concat(
                        stubCashflowDataForAccounts,
                        stubCashflowDataForAllDays
                    );

                    this.defaultReportPeriod['start'] = underscore.min(this.cashflowData, function (val) { return val.date; }).date.year();
                    this.defaultReportPeriod['end'] = underscore.max(this.cashflowData, function (val) { return val.date; }).date.year();
                    if (!this.reportPeriod['start'] )
                        this.reportPeriod['start'] = this.defaultReportPeriod['start'];
                    if (!this.reportPeriod['end'])
                        this.reportPeriod['end'] = this.defaultReportPeriod['end'];
                    /**
                     * Override the native array push method for the cashflow that will add the total and netChange objects before pushing the income or expense objects
                     * @type {Object}
                     */
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
                } else {
                    this.cashflowData = null;
                    this._appService.toolbarIsHidden = true;
                    this.finishLoading();
                }
                this.dataSource = this.getApiDataSource();

                /** Init footer toolbar with the gathered data from the previous requests */
                this.initFooterToolbar();
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
                [Total]: [],
                [Reconciliation]: []
            },
            firstDate, firstInitialDate;
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
        }

        const data = transactions.reduce((result, transactionObj) => {
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
                if (level.prefix === CategorizationPrefixes.AccountType && !this.cashflowGridSettings.general.showAccountingTypeRow) {
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
    getStubCashflowDataForAllPeriods(cashflowData: Array<TransactionStatsDtoExtended>, period: 'month' | 'day') {
        let stubCashflowData = Array<TransactionStatsDtoExtended>(),
            allYears: Array<number> = [],
            existingPeriods: Array<string> = [],
            firstAccountId,
            minDate: moment.Moment,
            maxDate: moment.Moment,
            periodFormat = period === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let date = cashflowItem.initialDate;
            let transactionYear = date.year();
            let formattedDate = date.utc().format(periodFormat);
            if (allYears.indexOf(transactionYear) === -1) allYears.push(transactionYear);
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
            if (!minDate || cashflowItem.date < minDate)
                minDate = date;
            if (!maxDate || cashflowItem.date > maxDate)
                maxDate = date;
            if (!firstAccountId && cashflowItem.accountId) firstAccountId = cashflowItem.accountId;
        });
        allYears = allYears.sort();

        if (period === 'day' ) {
            maxDate = maxDate ? maxDate.utc().endOf('month') : undefined;
            minDate = minDate ? minDate.utc().startOf('month') : undefined;
        }

        /** consider the fitler */
        if (this.requestFilter.startDate && (moment(this.requestFilter.startDate).utc().format(periodFormat) > minDate.format(periodFormat) || !minDate)) minDate = this.requestFilter.startDate;
        if (this.requestFilter.endDate && (moment(this.requestFilter.startDate).utc().format(periodFormat) < maxDate.format(periodFormat) || !maxDate)) maxDate = this.requestFilter.endDate;

        /** cycle from started date to ended date */
        /** added fake data for each date that is not already exists in cashflow data */

        moment.tz.setDefault(undefined);
        let startDate = moment.utc(minDate);
        let endDate = moment.utc(maxDate);
        while (startDate.isSameOrBefore(endDate)) {
            let date = moment(startDate, 'YYYY-MM-DD');
            if (existingPeriods.indexOf(date.format('YYYY-MM-DD')) === -1) {
                stubCashflowData.push(
                    this.createStubTransaction({
                        'cashflowTypeId': StartedBalance,
                        'accountId': firstAccountId,
                        'date': date.add(date.toDate().getTimezoneOffset(), 'minutes'),
                        'initialDate': date
                    })
                );
            }
            startDate.add(1, period);
        }
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        /** Add stub for current period */
        /** if we have no current period */
        if (
            (!this.requestFilter.startDate || this.requestFilter.startDate < moment()) &&
            (!this.requestFilter.endDate || this.requestFilter.endDate > moment()) &&
            !cashflowData.concat(stubCashflowData).some(item => item.initialDate.format(periodFormat) === moment().format('DD.MM.YYYY'))
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

    /** @todo move to some helper */
    getDescendantPropValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    showRefreshButton() {
        this.noRefreshedAfterSync = true;
        this.initHeadlineConfig();
    }

    refreshDataGrid() {
        this.expandedIncomeExpense = false;

        this.noRefreshedAfterSync = false;
        this.initHeadlineConfig();

        this.closeTransactionsDetail();
        this.loadGridDataSource();
    }

    repaintDataGrid() {
        this.pivotGrid.instance.updateDimensions();
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
        preferencesObservable.subscribe(result => {
            let updateWithNetChange = result.general.showNetChangeRow !== this.cashflowGridSettings.general.showNetChangeRow;
            let updateAfterAccountingTypeShowingChange = result.general.showAccountingTypeRow !== this.cashflowGridSettings.general.showAccountingTypeRow;
            this.handleGetCashflowGridSettingsResult(result);
            this.expandedIncomeExpense = false;
            this.closeTransactionsDetail();
            this.startLoading();
            /** @todo refactor - move to the showNetChangeRow and call here all
             *  appliedTo data methods before reloading the cashflow
             */
            /** @todo move to the userPreferencesHandlers to avoid if else structure */
            if (!updateWithNetChange && !updateAfterAccountingTypeShowingChange) {
                this.pivotGrid.instance.repaint();
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

        /** Collapse starting and ending balances rows */
        if (!this.expandedIncomeExpense) {
            this.expandIncomeAndExpense();
        }

        /** Get the groupBy element and append the dx-area-description-cell with it */
        $('.sort-options').appendTo(event.element.find('.dx-area-description-cell'));

        /** Calculate the amount current cells to cut the current period current cell to change current from
         *  current for year to current for the grouping period */
        let lowestOpenedInterval = this.getLowestOpenedCurrentInterval();
        $(`.current${_.capitalize(lowestOpenedInterval)}`).addClass('lowestOpenedCurrent');
        this.changeHistoricalColspans(lowestOpenedInterval);

        if (this.pivotGrid.instance != undefined && !this.pivotGrid.instance.getDataSource().isLoading()) {
            this.finishLoading();
        }

        this.synchronizeCashflowHeaders();
        this.handleBottomHorizontalScrollPosition();

        /** Clear cache with columns activity */
        this.cashedColumnActivity.clear();
        this.applyUserPreferencesForAreas();
    }

    handleBottomHorizontalScrollPosition() {
        let scrollElement = <HTMLElement>document.querySelector('.dx-pivotgrid-area-data .dx-scrollable-scrollbar');
        let pivotGridElement = <HTMLElement>document.getElementsByClassName('pivot-grid')[0];
        let toolbarElement = <HTMLElement>document.querySelector('app-toolbar .dx-toolbar ');
        let headlineElement = <HTMLElement>document.getElementsByClassName('headline-row')[0];
        let topBarElement = <HTMLElement>document.getElementsByTagName('top-bar')[0];
        let viewSize = window.innerHeight - toolbarElement.offsetHeight - headlineElement.offsetHeight - topBarElement.offsetHeight;
        if (pivotGridElement.clientHeight > viewSize) {
            scrollElement.classList.add('fixedScrollbar');
            if (this.cashflowGridSettings.visualPreferences.showFooterBar) {
                scrollElement.classList.add('withFooterToolbar');
            } else {
                scrollElement.classList.remove('withFooterToolbar');
            }
        } else {
            scrollElement.classList.remove('fixedScrollbar', 'withFooterToolbar');
        }
    }

    /**
     * Method that makes the headers in cashflow the same height (one of them has fixed position)
     */
    synchronizeCashflowHeaders() {
        let descriptionHeader = <HTMLElement>document.getElementsByClassName('dx-area-description-cell')[0];
        let columnsHeader = <HTMLElement>document.getElementsByClassName('dx-area-column-cell')[0];
        if (descriptionHeader && columnsHeader && descriptionHeader.parentElement.clientHeight !== columnsHeader.clientHeight) {
            descriptionHeader.parentElement.style.height = columnsHeader.clientHeight + 'px';
        }
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

    expandIncomeAndExpense() {
        if (this.pivotGrid.instance) {
            this.pivotGrid.instance.getDataSource().expandHeaderItem('row', [CategorizationPrefixes.CashflowType + Income]);
            this.pivotGrid.instance.getDataSource().expandHeaderItem('row', [CategorizationPrefixes.CashflowType + Expense]);
            this.expandedIncomeExpense = true;
        }
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

    getIntervalColspansAmountForCurrent(lowestInterval) {
        let colspanAmount = 0;
        while (lowestInterval) {
            let currentElement = $(`.dx-pivotgrid-horizontal-headers .lowestOpenedCurrent.current${_.capitalize(lowestInterval)}:not(.projectedField)`);
            if (currentElement.length) {
                colspanAmount = +currentElement.attr('colspan');
                break;
            } else {
                lowestInterval = this.getPrevGroupInterval(lowestInterval);
            }
        }
        return colspanAmount;
    }

    /**
     * Get lowest opened interval
     */
    getLowestOpenedCurrentInterval() {
        let allIntervals = this.groupbyItems.map(item => item.groupInterval).filter(item => item !== 'day');
        let lowestInterval = allIntervals[0];
        allIntervals.every(interval => {
            let currentElement = $('.current' + _.capitalize(interval));
            lowestInterval = interval;
            if (currentElement.length && (!currentElement.attr('colspan') ||
               (interval === 'month' && currentElement.hasClass('projectedField') &&
                !$(`.current${_.capitalize(interval)}.projectedField`).attr('colspan'))) ) {
                return false;
            }
            return true;
        });
        return lowestInterval;
    }

    getIntervalColspansAmount(groupInterval, period) {
        let currentElement = $('.dx-area-data-cell .current' + _.capitalize(groupInterval)),
            method = period === 'next' ? 'nextAll' : 'prevAll';
        if (!currentElement.length) {
            let elementPosition = period === 'prev' ? 'last' : 'first';
            return $('.dx-area-data-cell .' + period + _.capitalize(groupInterval))[elementPosition]()[method]().length + 1;
        }
        return currentElement.first()[method]().length;
    }

    getPrevGroupInterval(groupInterval) {
        let currentIndex = this.groupbyItems.map(item => item.groupInterval).indexOf(groupInterval);
        return currentIndex > 0 ? this.groupbyItems[currentIndex - 1].groupInterval : null;
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
        historicalField ['selector'] = value.historicalSelectionFunction();
        this.expandedIncomeExpense = false;
        this.closeTransactionsDetail();
        let columns = this.pivotGrid.instance.getDataSource().getAreaFields('column', true);
        columns.forEach(item => {
            /** exclude historical field */
            if (item.dataType === 'date') {
                if (item.areaIndex <= itemIndex) {
                    this.pivotGrid.instance.getDataSource().expandAll(item.index);
                } else {
                    this.pivotGrid.instance.getDataSource().collapseAll(item.index);
                }
            }
        });
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
        for (let child of rows ){
            let childPath = path.slice();
            childPath.push(child.value);
            if (this.hasChildsByPath(childPath)) {
                this.pivotGrid.instance.getDataSource().expandHeaderItem('row', childPath);
                if (currentDepth != stopDepth)
                    this.expandRows(child, stopDepth, childPath, currentDepth + 1);
            }
        }
    }

    toggleFilters(event) {
        this._filtersService.toggle();
    }

    clearAllFilters(event) {
        this._filtersService.clearAllFilters();
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
            cellObj.cell.path[0] === CategorizationPrefixes.CashflowType + StartedBalance &&
            !cellObj.cell.isWhiteSpace;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === CategorizationPrefixes.CashflowType + StartedBalance;
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === CategorizationPrefixes.CashflowType + StartedBalance &&
            (cellObj.cell.rowType === (CategorizationPrefixes.CashflowType + Total) || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.type === Total &&
            cellObj.cell.path.length === 1 &&
            (cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Income) || cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Expense));
    }

    /**
     * whether or not the cell is net change header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isNetChangeTotalCell(cellObj) {
        let pathProperty = cellObj.area === 'row' ? 'path' : 'rowPath';
        return cellObj.cell[pathProperty] && !cellObj.cell.isWhiteSpace && cellObj.cell[pathProperty].length === 1 && cellObj.cell[pathProperty][0] === (CategorizationPrefixes.CashflowType + NetChange);
    }

    isCopyable(cellObj) {
        return cellObj.area === 'data' && (cellObj.cell.rowPath[0].slice(2) === Income || cellObj.cell.rowPath[0].slice(2) === Expense);
    }

    isMonthHeaderCell(cellObj) {
        let monthIndex = this.pivotGrid.instance.getDataSource().getAreaFields('column', true).find(item => item.dataType === 'date' && item.groupInterval === 'month')['areaIndex'];
        return cellObj.area === 'column' && cellObj.cell.path && cellObj.cell.path[monthIndex] !== undefined;
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

    cellIsDraggable(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowType === 'D' && (cellObj.cell.rowPath[0].slice(2) === Income || cellObj.cell.rowPath[0].slice(2) === Expense);
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
            (cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Income) || cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Expense));
    }

    /**
     * whether or not the cell is income or expenses total cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesTotalHeaderCell(cellObj) {
        return cellObj.area === 'row' && !cellObj.cell.isWhiteSpace && cellObj.cell.path !== undefined &&
            (cellObj.cell.path[0] === CategorizationPrefixes.CashflowType + Income || cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Expense));
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
               cellObj.cell.path.length === 1 &&
               cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Total) &&
               !cellObj.cell.isWhiteSpace;
    }

    isIncomeOrExpenseWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
               cellObj.cell.path.length === 1 &&
               (cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Income) || cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Expense));
    }

    isStartingBalanceWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === CategorizationPrefixes.CashflowType + StartedBalance;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Total));
    }

    isAllTotalBalanceCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               (cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Total) || cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + NetChange));
    }

    isTotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               cellObj.cell.type === 'Total';
    }

    /** @todo check */
    isSubtotalRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.type === 'Total';
    }

    isTransactionRows(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               cellObj.cell.rowPath.length !== 1 &&
               (cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Income) || cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Expense));
    }

    /** Whether the cell is the reconciliation header cell */
    isReconciliationHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === (CategorizationPrefixes.CashflowType + Reconciliation) &&
            !cellObj.cell.isWhiteSpace;
    }

    /** Whether the cell is the reconciliation data cell */
    isReconciliationDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === (CategorizationPrefixes.CashflowType + Reconciliation));
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
        return cellObj.rowIndex === 0;
    }

    /**
     * Event that runs before rendering of every cell of the pivot grid
     * @param e - the object with the cell info
     * https://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxPivotGrid/Events/#cellPrepared
     */
    onCellPrepared(e) {
        /** added css class to start balance row */
        if (this.isStartingBalanceHeaderColumn(e) || this.isStartingBalanceTotalDataColumn(e)) {
            e.cellElement.parent().addClass('startedBalance');
        }

        /** added css class to ending position row */
        if (this.isTotalEndingHeaderCell(e) || this.isTotalEndingDataCell(e)) {
            e.cellElement.parent().addClass('endingCashPosition');
        }

        if (this.isStartingBalanceWhiteSpace(e)) {
            e.cellElement.addClass('startedBalanceWhiteSpace');
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
                e.cell[pathProp][0] === CategorizationPrefixes.CashflowType + Income
                    ? 'income' : 'expenses')  + (level ? 'Child': '');
            e.cellElement.addClass(cssClass);
            e.cellElement.parent().addClass(cssClass + 'Row');
            /** disable collapsing for income and expenses columns */
            if (this.isIncomeOrExpensesHeaderCell(e) && !level) {
                e.cellElement.addClass('uppercase');
            }
        }

        if (this.isNetChangeTotalCell(e)) {
            e.cellElement.addClass('netChange');
            e.cellElement.parent().addClass('netChangeRow');
        }

        /** headers manipulation (adding css classes and appending 'Totals text') */
        if (e.area === 'column' && e.cell.type !== GrandTotal) {
            this.prepareColumnCell(e);

            /** Historical horizontal header columns */
            /** @todo exclude disabling for current month (in future) */
            if (this.isHistoricalCell(e)) {
                /** disable collapsing for historical columns */
                e.cellElement.click(function (event) {
                    event.stopImmediatePropagation();
                });
            }
        }

        /** headers manipulation (adding css classes and appending 'Totals text') */
        if (e.area === 'data' || (e.area === 'column' || e.rowIndex >= 1)) {
            /** add current classes for the cells that belongs to the current periods */
            this.addCurrentPeriodsClasses(e);
        }

        /** add zeroValue class for the data cells that have zero values to style them with grey color */
        if (e.area === 'data' && e.cell.value === 0) {
            e.cellElement.addClass('zeroValue');
        }

        /** disable expanding and hide the plus button of the elements that has no children */
        if (e.area === 'row' && e.cell.path && e.cell.path.length !== e.component.getDataSource().getAreaFields('row').length) {
            if (!this.hasChildsByPath(e.cell.path)) {
                this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', e.cell.path);
                e.cellElement.addClass('emptyChildren');
                e.cellElement.find('.dx-expand-icon-container').remove();
                e.cellElement.click(function(event) {
                    event.stopImmediatePropagation();
                });
            }
        }

        /** If there are some cells to click - click it! */
        if (e.area === 'column') {
            if (this.fieldPathsToClick.length) {
                if (underscore.isEqual(e.cell.path.slice(0, e.cell.path.length - 1), this.fieldPathsToClick[0])) {
                    if (!e.cell.expanded) {
                        e.cellElement.trigger('click');
                    }
                    this.fieldPathsToClick = [];
                }
            }
        }

        /** hide long text for row headers and show '...' instead with the hover and long text*/
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path && e.cell.path.length !== 1 && e.cell.text && e.cell.text.length > this.maxCategoriesWidth) {
            e.cellElement.attr('title', e.cell.text);
            e.cellElement.find('> span').text(_.prune(e.cell.text, this.maxCategoriesWidth));
        }

        /** Show descriptors in Italic */
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path) {
            /** get last row - it is opened */
            let row = e.cell.path.slice(-1);
            let prefix = row[0] ? row[0].slice(0, 2) : undefined;
            if (prefix && prefix === CategorizationPrefixes.TransactionDescriptor) {
                e.cellElement.addClass('descriptor');
            }
        }

        /** Hide the empty rows */
        if (this.isTransactionDetailHeader(e)) {
            e.cellElement.addClass('descriptor');
        }

        /** add draggable attribute to the cells that can be dragged */
        if (this.cellIsDraggable(e)) {
            e.cellElement.attr('droppable', 'false');
            let img = new Image();
            img.src = 'assets/common/icons/drag-icon.svg';
            e.cellElement.off('dragstart dragend dragenter dragover drop')
                .on('mousedown', ev => {
                    e.cellElement.attr('draggable', Boolean(e.cell.value));
                    this.selectedCell = e;
                })
                .on('mouseup', ev => {
                    e.cellElement.removeAttr('draggable');
                })
                .on('dragstart', ev => {
                    if (e.cell.value) {
                        let targetElement = ev.target;
                        /** add selected class */
                        $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
                        $(targetElement).addClass('chosenFilterForCashFlow');

                        let cellIndex = $(targetElement).index();

                        /** set the draggable image */
                        ev.originalEvent.dataTransfer.setDragImage(img, -10, -10);
                        ev.originalEvent.dataTransfer.setData('Text', cellIndex);
                        ev.originalEvent.dropEffect = 'none';

                        $('[droppable]').attr('droppable', 'false');
                        /** find the dropable area depend on period */
                        /** @todo uncomment to handle moving of historical transactions */
                        /* if ($(targetElement).attr('class').indexOf('prev') !== -1) {
                            $(`[droppable]:nth-child(${cellIndex + 1}):not(.chosenFilterForCashFlow)`).attr('droppable', 'true');
                        } else*/ if ($(targetElement).attr('class').indexOf('next') !== -1) {
                            $(`[droppable][class*="next"]:not(.chosenFilterForCashFlow)`).attr('droppable', 'true');
                        }
                    }
                })
                .on('dragend', ev => {
                    ev.originalEvent.preventDefault();
                    ev.originalEvent.stopPropagation();
                    $(ev.target).removeClass('dragged');
                    $('[droppable]').removeClass('currentDroppable');
                    $('[droppable]').attr('droppable', 'false');
                })
                .on('dragenter', (ev) => {
                    ev.originalEvent.preventDefault();
                    ev.originalEvent.stopPropagation();
                    if (!$(ev.target).hasClass('chosenFilterForCashFlow')) {
                        /** change the class for the target cell */
                        if ($(ev.target).attr('droppable') === 'true') {
                            $('[droppable]').removeClass('currentDroppable');
                            $(ev.target).addClass('currentDroppable');
                        }
                    }
                })
                .on('dragover', (ev) => {
                    ev.originalEvent.preventDefault();
                    ev.originalEvent.stopPropagation();
                    if (!$(ev.target).hasClass('chosenFilterForCashFlow')) {
                        /** change the class for the target cell */
                        if ($(ev.target).attr('droppable') === 'true') {
                            $('[droppable]').removeClass('currentDroppable');
                            $(ev.target).addClass('currentDroppable');
                        } else {
                            ev.originalEvent.dataTransfer.dropEffect = 'none';
                        }
                    } else {
                        ev.originalEvent.dataTransfer.dropEffect = 'none';
                    }
                })
                .on('drop', (ev) => {
                    ev.originalEvent.preventDefault();
                    ev.originalEvent.stopPropagation();
                    let cellWhereToMove = e;
                    let movedCell = this.selectedCell;

                    /** Get the transaction of moved cell */
                    let itemsToMove = this.getDataItemsByCell(movedCell);

                    /** Handle moving of historical transactions */
                    /** @todo implement */
                    if ($(ev.target).attr('class').indexOf('prev') !== -1) {
                        let itemsToMovesIds = itemsToMove.map(item => item.id);
                    }

                    /** Handle moving of forecasts */
                    if ($(ev.target).attr('class').indexOf('next') !== -1) {
                        this.moveOrCopyForecasts(itemsToMove, cellWhereToMove, 'move');
                    }
                });
        }

        /** Apply user preferences to the data showing */
        this.applyUserPreferencesForCells(e);
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

        forecasts.forEach((forecast) => {
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
        });

        let method = operation === 'copy' ? 'createForecasts' : 'updateForecasts';
        this._cashFlowForecastServiceProxy[method](
            InstanceType10[this.instanceType],
            this.instanceId,
            forecastModels
        ).subscribe(
            result => {
                /** Get ids from the server in a case of creation or from the local in a case of update */
                let udpatedForecastsIds = result || forecastModels.forecasts.map(forecast => forecast.id);

                /** if the operation is update - then also remove the old objects (income or expense, net change and total balance) */
                if (operation === 'move') {
                    forecastModels.forecasts.forEach(forecastModel => {
                        let forecastsInCashflow = this.cashflowData.filter(item => item.forecastId === forecastModel.id);
                        let timezoneOffset = new Date(<any>targetCellDate).getTimezoneOffset();
                        forecastsInCashflow.forEach((forecastInCashflow, index) => {
                            forecastInCashflow.date = moment(targetCellDate).add(timezoneOffset, 'minutes');
                            forecastInCashflow.initialDate = targetCellDate;
                            forecastInCashflow.categoryId = categoryId || subCategoryId || -1;
                            forecastInCashflow.subCategoryId = subCategoryId;
                            forecastInCashflow.transactionDescriptor = transactionDescriptor;
                            forecastsInCashflow[index] = this.addCategorizationLevels(forecastInCashflow);
                        });
                    });
                } else {
                    forecastModels.forecasts.forEach((forecastModel, index) => {
                        let timezoneOffset = new Date(<any>targetCellDate).getTimezoneOffset();
                        this.cashflowData.push(this.createStubTransaction({
                            accountId: forecastModel.bankAccountId,
                            count: 1,
                            amount: forecastModel.amount,
                            date: moment(targetCellDate).add(timezoneOffset, 'minutes'),
                            initialDate: targetCellDate,
                            forecastId: udpatedForecastsIds[index]
                        }, targetCell.cell.rowPath));
                    });
                }
            },
            e => { console.log(e); this.notify.error(e); },
            () => {
                //this.dataSource = this.getApiDataSource();
                this.pivotGrid.instance.getDataSource().reload();
                this.notify.success('Cell_pasted');
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
        for (let preferencesType in this.userPreferencesHandlers) {
            let preferences = this.userPreferencesHandlers[preferencesType]['preferences'];
            for (let preferenceName in preferences) {
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
                let valueWithDecimals = cellObj.cellElement.text();
                cellObj.cellElement.text(valueWithDecimals.slice(0, valueWithDecimals.length - 3));
            }
        }
    }

    hideZeroValuesInCells(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cellObj.cell.value === 0) {
                cellObj.cellElement.text('');
                cellObj.cellElement.addClass('hideZeroValues');
            }
        }
    }

    showNegativeValuesInRed(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cellObj.cell.value < 0) {
                cellObj.cellElement.addClass('red');
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
        //            cellObj.cellElement.addClass('hideZeroActivity');
        //            cellObj.cellElement.click(function(event) {
        //                event.stopImmediatePropagation();
        //            });
        //            cellObj.cellElement.text('');
        //        }
        //    }
        //}
    }

    showAccountingTypeRow(cellObj, preference) {
        this.pivotGrid.instance.getDataSource().reload();
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
        const locale = preference.sourceValue.indexOf('.') <= 3 ? 'es-BO' : 'en-EN';
        if (!cellObj.cellElement.hasClass('hideZeroActivity') &&
            !cellObj.cellElement.hasClass('hideZeroValues') &&
            cellObj.cell.value) {
            cellObj.cellElement.text(cellObj.cell.value.toLocaleString(locale, {
                style: 'currency',
                currency: this.currencyId
            }));
        }
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
            if (this.cashedColumnActivity.get(dateKey)) {
                columnHasActivity = this.cashedColumnActivity.get(dateKey);
            /** else calculate the activity using cashflow data and save it in cache to avoid
             *  a lot of calculations */
            } else {
                columnHasActivity = this.cashflowData.some((cashflowItem) => {
                    return (dateKey === this.formatToLowest(cashflowItem.date, lowestPeriod) &&
                            cashflowItem.amount);
                });
                this.cashedColumnActivity.set(dateKey, columnHasActivity);
            }
        }
        return columnHasActivity;
    }

    /** Format moment js object to the lowest interval */
    formatToLowest(date, lowestPeriod): string {
        let formatAbbr = '';
        for (let format in this.momentFormats) {
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
            for (let type in this.cellTypesCheckMethods) {
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
                    let hideHead = (cellObj.cellElement.hasClass('dx-pivotgrid-expanded') &&
                        (fieldName === 'quarter' || cellObj.cellElement.parent().parent().children().length >= 6)) ||
                        (fieldName === 'quarter' && this.quarterHeadersAreCollapsed) ||
                        (fieldName === 'year' && this.yearHeadersAreCollapsed);
                    cellObj.cellElement.attr('onclick', 'onHeaderExpanderClick(event)');
                    cellObj.cellElement.html(this.getMarkupForExtendedHeaderCell(cellObj, hideHead, fieldName));
                }
                if (fieldName === 'day') {
                    let dayNumber = cellObj.cell.path.slice(-1)[0],
                        dayEnding = [, 'st', 'nd', 'rd'][ dayNumber % 100 >> 3 ^ 1 && dayNumber % 10] || 'th';
                    cellObj.cellElement.append(`<span class="dayEnding">${dayEnding}</span>`);
                }
            } else if (fieldGroup === 'historicalField') {
                fieldName = this.historicalClasses[cellObj.cell.path.slice(-1)[0]];
            } else if (fieldGroup === 'projected') {
                fieldName = cellObj.cell.value === 1 ? 'projected' : 'mtd';
            }
            cellObj.cellElement.addClass(`${fieldGroup} ${fieldName}`);
            if (!cellObj.cellElement.parent().hasClass(`${fieldName}Row`)) {
                cellObj.cellElement.parent().addClass(`${fieldName}Row`);
            }
        }
    }

    getMarkupForExtendedHeaderCell(cellObj, hideHead, fieldName) {
        let value = cellObj.cell.path[cellObj.cell.path.length - 1];
        value = fieldName === 'quarter' ? 'Q' + value : value;
        return `<div class="head-cell-expand ${hideHead ? 'closed' : ''}">
                    <div class="main-head-cell">
                        ${cellObj.cellElement.html()}
                        <div class="totals">${this.l('Totals').toUpperCase()}</div>
                    </div>
                    <div class="closed-head-cell" title="${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}">
                        ${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}
                    </div>
                </div>`;
    }

    /**
     * Added the classes for the current cells such as currentYear, currentQuarter and currentMonth
     */
    addCurrentPeriodsClasses(cellObj) {
        this.getColumnFields().every( (field, index) => {
            if (field.dataType === 'date') {
                let currentDate = moment(),
                    fieldInterval = field.groupInterval,
                    method = fieldInterval === 'day' ? 'date' : fieldInterval,
                    currentPeriodValue = fieldInterval === 'month' ? currentDate[method]() + 1 : currentDate[method]();
                let path = cellObj.cell.path ? cellObj.cell.path : cellObj.cell.columnPath;
                if (path && path[index] === currentPeriodValue) {
                    cellObj.cellElement.addClass(`current${_.capitalize(fieldInterval)}`);
                    if (fieldInterval === 'month') {
                        let projected = this.getProjectedValueByPath(path);
                        if (projected !== undefined) {
                            let projectedClass = projected === 1 ? 'projectedCell' : 'mtdCell';
                            cellObj.cellElement.addClass(`${projectedClass}`);
                        }
                    }
                } else if (path && path[index] < currentPeriodValue) {
                    cellObj.cellElement.addClass(`prev${_.capitalize(fieldInterval)}`);
                    return false;
                } else if (path && path[index] > currentPeriodValue) {
                    cellObj.cellElement.addClass(`next${_.capitalize(fieldInterval)}`);
                    return false;
                } else {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Gets the mtd or projected 0 or 1 from the path
     * @param projected
     */
    getProjectedValueByPath(path) {
        let projectedField = this.getColumnFields().filter(field => field.caption === 'Projected');
        let projectedFieldIndex = projectedField.length ? projectedField[0].areaIndex : null;
        return projectedFieldIndex ? path[projectedFieldIndex] : undefined;
    }

    /**
     * Disable the extending of not current months
     * @param cellObj
     */
    hideProjectedFieldForNotCurrentMonths(cellObj) {
        /** if current month and year not corresponde the year and month of projected field - then add hide class */
        let today = new Date(),
            currentMonth = today.getMonth() + 1;
        if (cellObj.cell.path[1] !== today.getFullYear() || cellObj.cell.path[3] !== (currentMonth)) {
            cellObj.cellElement.addClass('projectedHidden');
            cellObj.cellElement.text('');
        }
    }

    /**
     * initialize the click trigger for the cell column if user click for the left empty cell
     * @param cellObj
     */
    bindCollapseActionOnWhiteSpaceColumn(cellObj) {
        let totalCell = cellObj.cellElement.parent().nextAll('.dx-expand-border').first().find('td.dx-total');
        totalCell.trigger('click');
    }

    customSave(state) {
        console.log('save state', state);
    }

    customLoad(state) {
        console.log('load state', state);
    }

    onCellClick(cellObj) {
        /** If user click to the month header - then send new getStats request for this month to load data for that month */
        if (this.isMonthHeaderCell(cellObj) && !cellObj.cell.expanded) {
            if (!this.monthsDaysLoadedPathes.some(arr => arr.toString() === cellObj.cell.path.toString())) {
                abp.ui.setBusy();
                /** Prevent default expanding */
                cellObj.cancel = true;

                /** @todo refactor - move to separate method */
                let columnFields = {};
                cellObj.columnFields.forEach(function(item) {
                    columnFields[item.groupInterval] = item.areaIndex;
                });
                const datePeriod = this.formattingDate(cellObj.cell.path, columnFields);
                /** if somehow user click on the cell that is not in the filter date range - return null */
                if (this.requestFilter.startDate && datePeriod.endDate < this.requestFilter.startDate ||
                    this.requestFilter.endDate && datePeriod.startDate > this.requestFilter.endDate) {
                    return;
                }

                let requestFilter = Object.assign({}, this.requestFilter);
                requestFilter.groupByPeriod = StatsFilterGroupByPeriod.Daily;
                requestFilter.startDate = this.requestFilter.startDate && this.requestFilter.startDate > datePeriod.startDate ? this.requestFilter.startDate : datePeriod.startDate;
                requestFilter.endDate = this.requestFilter.endDate && this.requestFilter.endDate < datePeriod.endDate ? this.requestFilter.endDate : datePeriod.endDate;
                requestFilter.calculateStartingBalance = false;

                this._cashflowServiceProxy
                    .getStats(InstanceType[this.instanceType], this.instanceId, requestFilter)
                    .pluck('transactionStats')
                    .subscribe( (transactions: any) => {
                            moment.tz.setDefault(undefined);
                            /** Remove old month transactions */
                            let date = this.getDateByPath(cellObj.cell.path, this.getColumnFields(), 'month');
                            let dateFormatted = date.format('MM.YYYY');
                            this.cashflowData.slice().forEach(item => {
                                if (item.initialDate.utc().format('MM.YYYY') === dateFormatted &&
                                    item.adjustmentStartingBalanceTotal !== TransactionStatsDtoAdjustmentType._2) {
                                    this.cashflowData.splice(this.cashflowData.indexOf(item), 1);
                                }
                            });
                            this.adjustmentsList.slice().forEach(item => {
                                if (item.initialDate.utc().format('MM.YYYY') === dateFormatted &&
                                    item.adjustmentStartingBalanceTotal !== TransactionStatsDtoAdjustmentType._2) {
                                    this.adjustmentsList.splice(this.cashflowData.indexOf(item), 1);
                                }
                            });
                            moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

                            /** Update cashflow data with the daily transactions */
                            transactions = this.getCashflowDataFromTransactions(transactions, false);
                            let stubCashflowDataForAllDays = this.getStubCashflowDataForAllPeriods(transactions, 'day');
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

                            /** Reload the cashflow */
                            this.pivotGrid.instance.getDataSource().reload();

                            /** Mark the month as already expanded to avoid double data loading */
                            this.monthsDaysLoadedPathes.push(cellObj.cell.path);

                            /** Expand the month into days */
                            this.pivotGrid.instance.getDataSource().expandHeaderItem('column', cellObj.cell.path);
                        });
            }
        }

        /** Add copy event to the cells */
        if (this.isCopyable(cellObj)) {
            cellObj.element.off('copy paste')
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
                        targetCell.cell.columnPath[0] != Periods.Historical) {
                        let forecastsItems = this.getDataItemsByCell(this.copiedCell);
                        this.moveOrCopyForecasts(forecastsItems, targetCell, 'copy', );
                    }
                });
        } else {
            cellObj.element.off('copy paste');
        }

        /** bind the collapse action on white space column */
        if (cellObj.cell.isWhiteSpace) {
            this.bindCollapseActionOnWhiteSpaceColumn(cellObj);
        }
        if (cellObj.area === 'data') {
            this.statsDetailFilter = this.getDetailFilterFromCell(cellObj);

            $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
            $(cellObj.cellElement).addClass('chosenFilterForCashFlow');
            this.selectedCell = cellObj;

            this.handleDoubleSingleClick(cellObj, null, (cellObj) => {
                this._cashflowServiceProxy
                    .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                    .subscribe(result => {
                        /**
                         * If the cell is not historical
                         * If cell is current - if amount of results is 0 - add, 1 and it is forecast - update, >1 - show details
                         * If cell is forecast - if amount of results is 0 - add, 1 - update, >1 - show details
                         */
                        let clickedCellPrefix = cellObj.cell.rowPath.slice(-1)[0] ? cellObj.cell.rowPath.slice(-1)[0].slice(0, 2) : undefined;
                        if (
                            /** disallow adding or editing historical periods */
                            cellObj.cell.columnPath[0] !== Periods.Historical &&
                            /** allow adding for empty cells or the cells that has only one transaction and this is
                             * forecast transaction */
                            (result.length === 0 || (result.length === 1 && result[0].forecastId)) &&
                            /** disallow adding or editing unclassified category, but allow change or add (no descriptor) */
                        (clickedCellPrefix || cellObj.cell.rowPath.length !== 2) &&
                            /** disallow adding or editing of these levels */
                            clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
                            clickedCellPrefix !== CategorizationPrefixes.AccountType &&
                            clickedCellPrefix !== CategorizationPrefixes.AccountName
                            // check feature
                            && this.IsEnableForecastAdding()
                        ) {
                            this.handleAddOrEdit(cellObj, result);
                        } else {
                            this.showTransactionDetail(result);
                        }
                    });
            });
        }

        /** If month cell has only one child (mtd or projected) - then click on it
         *  to expand/collapse days */
        // if (cellObj.area === 'column' && cellObj.cell) {
        //     if (cellObj.rowIndex === cellObj.columnFields.filter(field => field.groupInterval === 'month')[0].areaIndex && !this.monthHasForecast(cellObj) && !cellObj.cell.expanded) {
        //         this.addFieldToClicking(cellObj.cell.path);
        //     }
        // }
    }

    getDetailFilterFromCell(cellObj) {
        let columnFields = {};
        cellObj.columnFields.forEach(function(item) {
            columnFields[item.groupInterval] = item.areaIndex;
        });

        const datePeriod = this.formattingDate(cellObj.cell.columnPath, columnFields);

        /** if somehow user click on the cell that is not in the filter date range - return null */
        if (this.requestFilter.startDate && datePeriod.endDate < this.requestFilter.startDate ||
            this.requestFilter.endDate && datePeriod.startDate > this.requestFilter.endDate) {
            return;
        }

        const isAccountCell = [CategorizationPrefixes.CashflowType + StartedBalance, (CategorizationPrefixes.CashflowType + Reconciliation), (CategorizationPrefixes.CashflowType + Total)].indexOf(cellObj.cell.rowPath[0]) !== -1;
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

    IsEnableForecastAdding() {
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
        this.currentCellOperationType = details.length === 0 ? 'add' : 'update';
        if (this.modifyingCelltextBox) {
            let parent = this.modifyingCelltextBox.element().parent();
            this.modifyingCelltextBox.element().remove();
            this.modifyingCelltextBox = null;
            parent.children().show();
            parent.css('padding', cellObj.cellElement.css('padding'));
        }
        if (!cellObj.cellElement.find('span').length)
            cellObj.cellElement.wrapInner('<span></span>');
        cellObj.cellElement.children().hide();
        this.oldCellPadding = cellObj.cellElement.css('padding');
        cellObj.cellElement.css('padding', 0);
        if (details.length === 1) {
            this.clickedRowResult = details[0];
        }
        this.clickedCellObj = cellObj;
        this.modifyingCelltextBox = $('<div>')
            .appendTo(cellObj.cellElement)
            .on('click', function(ev) {
                ev.stopPropagation();
            })
            .dxNumberBox({
                value: cellObj.cell.value,
                height: cellObj.cellElement.height(),
                onEnterKey: this.saveForecast.bind(this),
                onFocusOut: this.saveForecast.bind(this)
            })
            .dxNumberBox('instance')
            .focus();
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
            if (height)
                $('.cashflow-wrap').css('height', height);
        }, 0);
    }

    onTransactionDetailsResize($event) {
        this.cashFlowGrid.height = $event.height;
    }

    onTransactionDetailsResizeEnd($event) {
        this._cacheService.set(this.cashflowDetailsGridSessionIdentifier, $event.height);
    }

    saveForecast = (arg: any): void  => {
        let newValue = arg.component.option('value');
        let parent = arg.component.element().parent();
        arg.component.element().remove();
        this.modifyingCelltextBox = null;
        parent.css('padding', this.oldCellPadding);
        parent.children().show();
        if (+newValue !== this.clickedCellObj.cell.value) {
            if (+newValue === 0) {
                this.currentCellOperationType = 'delete';
            }
            let forecastModel;
            let cashflowTypeId = this.getCategoryValueByPrefix(this.clickedCellObj.cell.rowPath, CategorizationPrefixes.CashflowType);
            let categoryId = this.getCategoryValueByPrefix(this.clickedCellObj.cell.rowPath, CategorizationPrefixes.Category);
            let subCategoryId = this.getCategoryValueByPrefix(this.clickedCellObj.cell.rowPath, CategorizationPrefixes.SubCategory);
            let transactionDescriptor = this.getCategoryValueByPrefix(this.clickedCellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor);
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
                    let date = this.statsDetailFilter.startDate > moment() ? this.statsDetailFilter.startDate.add(new Date(<any>this.statsDetailFilter.startDate).getTimezoneOffset(), 'minutes') : moment().add(new Date().getTimezoneOffset());
                    let initialDate = this.statsDetailFilter.startDate > moment() ? this.statsDetailFilter.startDate : moment();
                    /** Update data locally */
                    if (this.currentCellOperationType === 'add') {
                        this.cashflowData.push(this.createStubTransaction({
                            accountId: this.bankAccounts[0].id,
                            count: 1,
                            amount: newValue,
                            date: date,
                            initialDate: initialDate,
                            forecastId: res
                        }, this.clickedCellObj.cell.rowPath));
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

    addFieldToClicking(path) {
        this.fieldPathsToClick = [path];
    }

    /** Return the amount of the child of the column like the */
    monthHasForecast(cellObj) {
        let monthDataWithForecast = this.cashflowData.filter(item => {
            let cellDate = this.getDateByPath(cellObj.cell.path, cellObj.columnFields, 'month');
            return item.forecastId && item.date.format('M.Y') === cellDate.format('M.Y');
        });
        return monthDataWithForecast.length ? true : false;
    }

    /**
     * Return the date object of type {year: 2015, month: 12, day: 24} for the path using column fields
     * @param path
     * @param columnFields
     * @return {any}
     */
    getDateByPath(path, columnFields, lowestInterval ?: string) {
        lowestInterval = lowestInterval || this.getLowestIntervalFromPath(path, columnFields);
        let date = moment.unix(0);
        let dateFields = [];
        columnFields.every(field => {
            if (field.dataType === 'date') {
                dateFields.push(field);
            }
            if (field.groupInterval === lowestInterval) {
                return false;
            }
            return true;
        });

        dateFields.forEach(dateField => {
            let method = dateField.groupInterval === 'day' ? 'date' : dateField.groupInterval,
                fieldValue = path[columnFields.filter(field => field.groupInterval === dateField.groupInterval)[0].areaIndex];
            fieldValue = dateField.groupInterval === 'month' ? fieldValue - 1 : fieldValue;
            /** set the new interval to the moment */
            date[method](fieldValue);
        });
        return date;
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

    formattingDate(param = [], columnFields) {
        let startDate: moment.Moment = moment.utc('1970-01-01');
        let endDate: moment.Moment = moment.utc('1970-01-01');
        let year = param[columnFields.year];
        let quarter = param[columnFields.quarter];
        let month = param[columnFields.month];
        let day = param[columnFields.day];

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
        if (!this.cashedRowsFitsToFilter.has(rowInfo) || !rowInfo) {
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
                        for (let id in dataSource) {
                            let cellInfo = {value: value};
                            if (this.customizeFieldText(cellInfo).toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
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
                    if (this.l('Uncategorized').toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
                        return true;
                    }
                }
                return false;
            });
            this.cashedRowsFitsToFilter.set(rowInfo, result);
        } else {
            result = this.cashedRowsFitsToFilter.get(rowInfo);
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
            currentCellValue = summaryCell.value() || 0,
            prevIsFirstColumn = this.getPrevWithParent(prevWithParent) ? true : false,
            prevCellValue = prevWithParent ? prevWithParent.value(prevIsFirstColumn) || 0 : 0,
            prevReconciliation = this.getCellValue(prevWithParent, Reconciliation);
        return currentCellValue + prevEndingAccountValue + prevCellValue + prevReconciliation;
    }

    /**
     * Modify the value of the starting balance summary cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceSummaryCell(summaryCell, prevWithParent) {
        let prevTotal = prevWithParent.slice(0, (CategorizationPrefixes.CashflowType + Total)),
            currentCellValue = summaryCell.value() || 0,
            prevTotalValue = prevTotal ? prevTotal.value() || 0 : 0,
            prevIsFirstColumn = this.getPrevWithParent(prevWithParent) ? true : false,
            prevCellValue = prevWithParent ? prevWithParent.value(prevIsFirstColumn) || 0 : 0,
            prevReconciliation = prevWithParent.slice(0, CategorizationPrefixes.CashflowType + Reconciliation),
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
        let startedBalanceCell = summaryCell.slice(0, CategorizationPrefixes.CashflowType + StartedBalance),
            startedBalanceCellValue = startedBalanceCell ? (startedBalanceCell.value(true) || 0) : 0,
            currentCellValue = summaryCell.value() || 0,
            reconciliationTotal = summaryCell.slice(0, CategorizationPrefixes.CashflowType + Reconciliation),
            reconciliationTotalValue = reconciliationTotal.value() || 0;
        return currentCellValue + startedBalanceCellValue + reconciliationTotalValue;
    }

    /**
     * Gets the cell value from the specific cell
     * cellData - summaryCell object of devextreme
     * target - StartedBalance | Total | Reconciliation
     */
    getCellValue(summaryCell, target, isCalculatedValue = underscore.contains([StartedBalance, Reconciliation], target)) {

        let targetPeriodAccountCashedValue;
        const accountId = summaryCell.value(summaryCell.field('row'), true).slice(2),
              targetPeriodCell = summaryCell.parent('row') ? summaryCell.parent('row').slice(0, CategorizationPrefixes.CashflowType + target) : null,
              targetPeriodAccountCell = targetPeriodCell ? targetPeriodCell.child('row', CategorizationPrefixes.AccountName + accountId) : null,
              cellData = this.getCellData(summaryCell, accountId, target);

            /** if we haven't found the value from the another period -
             *  then it hasn't been expanded and we should find out whether the value is in cash */
            if (targetPeriodAccountCell === null) {
                targetPeriodAccountCashedValue = this.getAnotherPeriodAccountCashedValue(cellData.toString());
                /** if we haven't found the value in cash - then we should calculate the value in the cashflow data by ourselves */
                if (!targetPeriodAccountCashedValue) {
                    /** calculate the cell value using the cell data and cashflowData */
                    targetPeriodAccountCashedValue = this.calculateCellValue(cellData, this.cashflowData);
                    this.setAnotherPeriodAccountCashedValue(cellData.toString(), targetPeriodAccountCashedValue);
                }
            } else {
                /** add the prevEndingAccount value to the cash */
                this.setAnotherPeriodAccountCashedValue(cellData.toString(), targetPeriodAccountCell.value(isCalculatedValue));
            }

        return targetPeriodAccountCashedValue ?
               targetPeriodAccountCashedValue :
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
    getAnotherPeriodAccountCashedValue(key) {
        return this.anotherPeriodAccountsValues.get(key);
    }

    /** set the prev ending account value to the cash */
    setAnotherPeriodAccountCashedValue(key, value) {
        this.anotherPeriodAccountsValues.set(key, value);
    }

    isColumnGrandTotal(summaryCell) {
        return summaryCell.field('row') !== null &&
               summaryCell.value(summaryCell.field('row')) === (CategorizationPrefixes.CashflowType + Total);
    }

    isRowGrandTotal(summaryCell) {
        return summaryCell.field('column') === null;
    }

    isStartingBalanceAccountCell(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'level1' &&
            summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === (CategorizationPrefixes.CashflowType + StartedBalance);
    }

    isCellIsStartingBalanceSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.value(summaryCell.field('row')) === (CategorizationPrefixes.CashflowType + StartedBalance);
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
               summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === (CategorizationPrefixes.CashflowType + Total);
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
        sortOptions.sortOrder = event.itemElement.hasClass('desc') ? 'asc' : 'desc';
        event.itemElement.parent().children().removeClass('asc desc');
        event.itemElement.addClass(sortOptions.sortOrder);

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
        $('.pivot-grid').addClass('invisible');
    }

    /** Finish loading animation */
    finishLoading() {
        abp.ui.clearBusy();
        $('.pivot-grid').removeClass('invisible');
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
                e.cellElement.addClass('editable');
            }

            if (e.column.dataField === 'status') {
                e.cellElement.addClass(`statusField ${e.data.status.toLowerCase()}`);
            }

            if (e.column.dataField === 'cashflowTypeId') {
                let className;
                switch (e.data.cashflowTypeId) {
                    case Income: className = 'inflows'; break;
                    case Expense: className = 'outflows'; break;
                }
                if (className) {
                    e.cellElement.addClass(className);
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
            e.rowElement.addClass('forecastRow');
        }

        if (e.rowType === 'data' && e.data.status === CashFlowStatsDetailDtoStatus.Projected) {
            e.rowElement.addClass('projected');
        }

        if (e.rowType === 'data' && e.data.cashflowTypeId === StartedBalance) {
            e.rowElement.addClass('adjustmentRow');
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
            let from = new Date(period.start + "-01-01");
            dateFilter.items['from'].setValue(from, dateFilter);
        } else {
            dateFilter.items['from'].setValue('', dateFilter);
        }

        if (period.end) {
            let from = new Date(period.end + "-12-31");
            dateFilter.items['to'].setValue(from, dateFilter);
        } else {
            dateFilter.items['to'].setValue('', dateFilter);
        }

        this._filtersService.change(dateFilter);
    }

    setBankAccountsFilter(data) {
        let accountFilter: FilterModel = underscore.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'account'; });

        if (data.banksWithAccounts) {
            accountFilter.items['element'].setValue(data.banksWithAccounts, accountFilter);
        } else {
            accountFilter.items['element'].setValue([], accountFilter);
        }
        this._filtersService.change(accountFilter);
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
