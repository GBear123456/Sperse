import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
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
    GetCategoriesOutput,
    CashFlowGridSettingsDto,
    InstanceType,
    InstanceType18
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from './preferences-dialog/preferences.service';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { DxPivotGridComponent, DxDataGridComponent } from 'devextreme-angular';
import * as _ from 'underscore.string';
import * as underscore from 'underscore';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

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

import { CacheService } from 'ng2-cache-service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/buffer';

import { SortState } from '@app/cfo/shared/common/sorting/sort-state';
import { SortingItemModel } from '@app/cfo/shared/common/sorting/sorting-item.model';

const moment = extendMoment(Moment);

/** Constants */
const StartedBalance = 'B',
      Income         = 'I',
      Expense        = 'E',
      Reconciliation = 'D',
      NetChange      = 'NC',
      Total          = 'T',
      GrandTotal     = 'GT';

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashflowServiceProxy, CashFlowForecastServiceProxy, CacheService, ClassificationServiceProxy, UserPreferencesService ]
})
export class CashflowComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    @ViewChild(DxDataGridComponent) cashFlowGrid: DxDataGridComponent;

    headlineConfig: any;
    categories: GetCategoriesOutput;
    cashflowData: any;
    cashflowDataTree: any;
    cashflowTypes: any;
    bankAccounts: any;
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
    categorization: Array<string> = [
        'groupName',
        'name',
        'transactionDescriptor'
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
        },
        {
            'groupInterval': 'day',
            'optionText': this.l('Days').toUpperCase(),
            'historicalSelectionFunction': this.getYearHistoricalSelectorWithCurrent
        }
    ];
    collapsedStartingAndEndingBalance = false;
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
            expanded: true,
            allowExpandAll: false,
            allowExpand: false,
            sortOrder: 'asc',
            dataField: 'cashflowTypeId',
            rowHeaderLayout: 'tree',
            showTotals: true,
            sortingMethod: (firstItem, secondItem) => {
                return this.leftMenuOrder.indexOf(firstItem.value) > this.leftMenuOrder.indexOf(secondItem.value);
            },
            customizeText: cellInfo => {
                let value = this.cashflowTypes[cellInfo.valueText];
                /** If the type is income or expenses */
                if (cellInfo.valueText === Income || cellInfo.valueText === Expense) {
                    value = this.l('Total') + ' ' + value;
                }
                if (cellInfo.valueText === NetChange) {
                    value = this.l('Net Change');
                }
                return value ? value.toUpperCase() : cellInfo.valueText;
            }
        },
        {
            caption: 'Group',
            width: 120,
            area: 'row',
            areaIndex: 1,
            dataField: `categorization.${this.categorization[0]}`,
            sortBy: 'displayText',
            sortOrder: 'asc',
            expanded: false,
            showTotals: true,
            resortable: true,
            customizeText: cellInfo => {
                let value = cellInfo.valueText;
                /** If the cell is int - then we have bank account as second level */
                if (Number.isInteger(cellInfo.value) && this.bankAccounts) {
                    value = this.bankAccounts.find(account => {
                        return account.id === cellInfo.value;
                    });
                    value = value ? (value.accountName || value.accountNumber) : cellInfo.valueText;
                } else {
                    /** find the group name in categories array */
                    value = this.categories.groups[value]
                            ? this.categories.groups[value]['name']
                            : this.l('Cashflow_Unclassified');
                }
                return value ? value.toUpperCase() : cellInfo.valueText;
            },
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Subgroup',
            showTotals: false,
            area: 'row',
            areaIndex: 2,
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            dataField: `categorization.${this.categorization[1]}`,
            customizeText: cellInfo => {
                return this.categories.items[cellInfo.value] ? this.categories.items[cellInfo.value]['name'] : cellInfo.value;
            }
        },
        {
            caption: 'Descriptor',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            areaIndex: 3,
            dataField: `categorization.${this.categorization[2]}`,
            customizeText: cellInfo => {
                return cellInfo.valueText ? cellInfo.valueText : this.l('Cashflow_emptyDescriptor');
            }
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
    sortings: SortingItemModel[] = [
        {
            name: 'Category',
            text: this.ls('Platform', 'SortBy', this.ls('CFO', 'Transactions_CashflowCategoryName')),
            activeByDefault: true,
            sortOptions: {
                sortBy: 'displayText',
                sortOrder: 'asc'
            }
        },
        {
            name: 'Account',
            text: this.ls('Platform', 'SortBy', this.ls('CFO', 'Transactions_Amount')),
            sortOptions: {
                sortBySummaryField: 'amount',
                sortBySummaryPath: [],
                sortOrder: 'asc'
            }
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
    transactionsTotal = 0;
    transactionsAmount = 0;
    transactionsAverage = 0;
    startDataLoading = false;
    filteredLoad = false;
    contentReady = false;
    adjustmentsList = [];
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
        /** Create parallel operations */
        let getCashFlowInitialDataObservable = this._cashflowServiceProxy.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId);
        let getForecastModelsObservable = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        let getCategoriesObservalbel = this._classificationServiceProxy.getCategories(InstanceType[this.instanceType], this.instanceId);
        let getCashflowGridSettings = this._cashflowServiceProxy.getCashFlowGridSettings(InstanceType[this.instanceType], this.instanceId);
        Observable.forkJoin(getCashFlowInitialDataObservable, getForecastModelsObservable, getCategoriesObservalbel, getCashflowGridSettings)
            .subscribe(result => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(result[0]);

                /** Forecast models handling */
                this.handleForecastModelResult(result[1]);

                /** Handle the get categories response */
                this.handleGetCategoriedsResult(result[2]);

                /** Handle the get cashflow grid settings response*/
                this.handleGetCashflowGridSettingsResult(result[3]);

                /** load cashflow data grid */
                this.loadGridDataSource();
            });

        this.initHeadlineConfig();
        this.initFiltering();
        this.addHeaderExpandClickHandling();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Cash Flow Statement and Forecast')],
            iconSrc: 'assets/common/icons/chart-icon.svg',
            buttons: []
        };
    }

    initFiltering() {
        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }
            this.closeTransactionsDetail();
            this.filteredLoad = true;
            this.loadGridDataSource();
        });
    }

    /**
     * Add the handling of the click on the date header cells in pivot grid
     */
    addHeaderExpandClickHandling() {
        window['onHeaderExpanderClick'] = function ($event) {
            let rect = $event.target.getBoundingClientRect();
            if (Math.abs($event.clientX - rect.x) < (rect.width * 0.1) &&
                Math.abs($event.clientY - rect.y) < rect.height
            ) $event.stopPropagation();
            $($event.target).closest('tr').children().each(function () {
                if ($(this).hasClass('dx-pivotgrid-expanded')) {
                    $(this).find('div.head-cell-expand').toggleClass('closed');
                }
            });
        };
    }

    /**
     * Handle the subscription result from getInitialData Observable
     * @param initialDataResult
     */
    handleCashFlowInitialResult(initialDataResult) {
        this.initialData = initialDataResult;
        this.cashflowTypes = this.initialData.cashflowTypes;
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
                        name: 'refresh',
                        action: this.refreshDataGrid.bind(this)
                    },
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
                        action: function(){ console.log( 'add forecast model' ); },
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
                                <input type="text" value="${e.itemData.text}">
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

    renameForecastModel(modelData) {
        return this._cashFlowForecastServiceProxy.renameForecastModel(
            InstanceType18[this.instanceType],
            this.instanceId,
            modelData
        );
    }

    /**
     * Handle get categories result
     * @param getCategoriesResult
     */
    handleGetCategoriedsResult(getCategoriesResult) {
        this.categories = getCategoriesResult;
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
            this.collapsedStartingAndEndingBalance = false;
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
        this._cashflowServiceProxy.getStats(InstanceType[this.instanceType], this.instanceId, this.requestFilter)
            .subscribe(result => {
                this.startDataLoading = true;
                if (result.transactionStats.length) {
                    let transactions = result.transactionStats;
                    /** categories - object with categories */
                    this.cashflowData = this.getCashflowDataFromTransactions(transactions);
                    /** Make a copy of cashflow data to display it in custom total group on the top level */
                    let stubCashflowDataForEndingCashPosition = this.getStubCashflowDataForEndingCashPosition(this.cashflowData);
                    this.addCashflowType(Total, this.l('Ending Cash Balance'));
                    let stubCashflowDataForAllDays = this.getStubCashflowDataForAllDays(this.cashflowData);
                    let cashflowWithStubForEndingPosition = this.cashflowData.concat(stubCashflowDataForEndingCashPosition);
                    let stubCashflowDataForAccounts = this.getStubCashflowDataForAccounts(cashflowWithStubForEndingPosition);
                    /** concat initial data and stubs from the different hacks */
                    this.cashflowData = cashflowWithStubForEndingPosition.concat(
                        stubCashflowDataForAccounts,
                        stubCashflowDataForAllDays
                    );
                    /** Get cashflow data tree to hide groups without children */
                    this.cashflowDataTree = this.getCashflowDataTree(
                        this.cashflowData,
                        this.apiTableFields.filter(field => field.area === 'row')
                    );
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
            firstDate;
        transactions.forEach(transaction => {
            /** get the first real date for stub data */
            if (!firstDate && transaction.date) {
                firstDate = transaction.date;
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
                            'accountId': accountId,
                            'categorization': {
                                [this.categorization[0]]: accountId
                            }
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
    createStubTransaction(stubObj) {
        let categorizationObject: { [key: string]: string; } = this.createCategorizationObject(this.categorization);
        let stubTransaction = {
            'adjustmentType': null,
            'cashflowTypeId': null,
            'accountId': null,
            'currencyId': 'USD',
            'amount': 0,
            'comment': null,
            'date': null,
            'initialDate': null,
            'categorization': categorizationObject,
            'forecastId': null
        };
        return Object.assign(stubTransaction, stubObj);
    }

    /**
     * For every categorization item create object with the categorization as properties
     */
    createCategorizationObject(categorization: Array<string>): { [key: string]: string; } {
        let categorizationObject = {};
        categorization.forEach(category => {
            categorizationObject[category] = null;
        });
        return categorizationObject;
    }

    /**
     * Get the cashflow data from the transactions from the server
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getCashflowDataFromTransactions(transactions) {
        this.transactionsAmount = 0;
        this.transactionsTotal = 0;
        this.transactionsAverage = 0;
        this.adjustmentsList = [];
        const data = transactions.reduce((result, transactionObj) => {
            transactionObj.categorization = {};
            transactionObj.initialDate = moment(transactionObj.date);
            transactionObj.date.add(new Date().getTimezoneOffset(), 'minutes');
            /** change the second level for started balance and reconciliations for the account id */
            if (transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation) {
                if (transactionObj.cashflowTypeId === StartedBalance) {
                    this.adjustmentsList.push(Object.assign({}, transactionObj));
                    transactionObj.cashflowTypeId = Total;
                }
                transactionObj.categorization[this.categorization[0]] = transactionObj.accountId;
            } else {
                let groupId = this.categories.items[transactionObj.categoryId] ? this.categories.items[transactionObj.categoryId]['groupId'] : null;

                if (!transactionObj.forecastId) {
                    this.transactionsTotal += transactionObj.amount;
                    this.transactionsAmount = this.transactionsAmount + transactionObj.count;
                }

                /** Add group and categories numbers to the categorization list and show the names in
                 *  customize functions by finding the names with ids
                 */
                transactionObj.categorization[this.categorization[0]] = groupId ? groupId.toString() : null;
                transactionObj.categorization[this.categorization[1]] = transactionObj.categoryId;
                transactionObj.categorization[this.categorization[2]] = transactionObj.transactionDescriptor;
            }
            result.push(transactionObj);
            return result;
        }, []);
        this.transactionsTotal = +this.transactionsTotal.toFixed(2);
        this.transactionsAverage = this.transactionsAmount ? +(this.transactionsTotal / this.transactionsAmount).toFixed(2) : 0;
        return data;
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
                    'categorization': {
                        [this.categorization[0]]: cashflowDataItem.accountId
                    },
                    'expenseCategoryId': null,
                    'amount': cashflowDataItem.amount,
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
                            'categorization': {
                                [this.categorization[0]]: null
                            },
                            'expenseCategoryId': null,
                            'amount': cashflowDataItem.amount,
                            'accountId': cashflowDataItem.accountId,
                            'date': cashflowDataItem.date,
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
                                'categorization': {
                                    [this.categorization[0]]: null
                                },
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
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getStubCashflowDataForAllDays(cashflowData: Array<TransactionStatsDto>) {
        let stubCashflowData = Array<TransactionStatsDto>(),
            allYears: Array<number> = [],
            existingDates: Array<string> = [],
            firstAccountId,
            minDate: Moment.Moment,
            maxDate: Moment.Moment;

        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let transactionYear = cashflowItem.date.year();
            let date = cashflowItem.date.format('DD.MM.YYYY');
            if (allYears.indexOf(transactionYear) === -1) allYears.push(transactionYear);
            if (existingDates.indexOf(date) === -1) existingDates.push(date);
            if (!minDate || cashflowItem.date < minDate)
                minDate = moment(cashflowItem.date).subtract(new Date().getTimezoneOffset(), 'minutes');
            if (!maxDate || cashflowItem.date > maxDate)
                maxDate = moment(cashflowItem.date).subtract(new Date().getTimezoneOffset(), 'minutes');
            if (!firstAccountId && cashflowItem.accountId) firstAccountId = cashflowItem.accountId;
        });
        allYears = allYears.sort();

        if (this.requestFilter.startDate && this.requestFilter.startDate < minDate) minDate = moment(this.requestFilter.startDate);
        if (this.requestFilter.endDate && this.requestFilter.endDate > maxDate) maxDate = moment(this.requestFilter.endDate);

        /** cycle from started date to ended date */
        let datesRange = Array.from(moment.range(minDate, maxDate).by('day'));
        /** added fake data for each date that is not already exists in cashflow data */
        datesRange.forEach((date: any) => {
            if (existingDates.indexOf(date.format('DD.MM.YYYY')) === -1) {
                stubCashflowData.push(
                    this.createStubTransaction({
                        'cashflowTypeId': StartedBalance,
                        'categorization': {
                            [this.categorization[0]]: firstAccountId
                        },
                        'accountId': firstAccountId,
                        'date': date,
                        'initialDate': date
                    })
                );
            }
        });

        /** Add stub for current period */
        /** if we have no current period */
        if (
            (!this.requestFilter.startDate || this.requestFilter.startDate < moment()) &&
            (!this.requestFilter.endDate || this.requestFilter.endDate > moment()) &&
            !cashflowData.concat(stubCashflowData).some(item => item.date.format('DD.MM.YYYY') === moment().format('DD.MM.YYYY'))
        ) {
            /** then we add current stub day */
            stubCashflowData.push(
                this.createStubTransaction({
                    'cashflowTypeId': StartedBalance,
                    'categorization': {
                        [this.categorization[0]]: firstAccountId
                    },
                    'accountId': firstAccountId,
                    'date': moment()
                })
            );
        }
        return stubCashflowData;
    }

    /**
     * @todo move to some helper
     * Build the nested object from array as the properties
     * @param base - the object to create
     * @param names - the array with nested keys
     */
    createNestedObject(base, names) {
        for (let i = 0; i < names.length; i++) {
            base = base[names[i]] = base[names[i]] || {};
        }
    }

    /** @todo move to some helper */
    getDescendantPropValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * Build the tree from cashflow data
     * @param data
     * @param fields
     * @return {{}}
     */
    getCashflowDataTree(data, fields) {
        let cashflowDataTree = {};
        data.forEach( cashflowItem => {
            let chainingArr = [];
            fields.forEach( field => {
                let value = this.getDescendantPropValue(cashflowItem, field['dataField']);
                chainingArr.push(value);
            });
            this.createNestedObject(cashflowDataTree, chainingArr);
        });
        return cashflowDataTree;
    }

    refreshDataGrid() {
        this.collapsedStartingAndEndingBalance = false;
        this.closeTransactionsDetail();
        this.loadGridDataSource();
    }

    repaintDataGrid() {
        this.pivotGrid.instance.repaint();
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
            this.handleGetCashflowGridSettingsResult(result);
            this.collapsedStartingAndEndingBalance = false;
            this.closeTransactionsDetail();
            this.startLoading();
            /** @todo refactor - move to the showNetChangeRow and call here all
             *  appliedTo data methods before reloading the cashflow
             */
            if (updateWithNetChange) {
                /** If user choose to show net change - then add stub data to data source */
                if (result.general.showNetChangeRow) {
                    this.cashflowData = this.cashflowData.concat(this.getStubForNetChange(this.cashflowData));
                /** else - remove the stubed net change data from data source */
                } else {
                    this.cashflowData = this.cashflowData.filter(item => item.cashflowTypeId !== NetChange);
                }
                this.dataSource = this.getApiDataSource();
                this.pivotGrid.instance.getDataSource().reload();
            } else {
                this.pivotGrid.instance.repaint();
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
        if (!this.collapsedStartingAndEndingBalance) {
            this.collapseFirstRows();
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

        /** Clear cache with columns activity */
        this.cashedColumnActivity.clear();
        this.applyUserPreferencesForAreas();
    }

    collapseFirstRows() {
        if (this.pivotGrid.instance) {
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [StartedBalance]);
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [NetChange]);
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [Total]);
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [Reconciliation]);
            this.collapsedStartingAndEndingBalance = true;
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

    /**
     * Return the index of next interval that leads for the interval in argument
     */
    getNextGroupInterval(groupInterval) {
        let currentIndex = this.groupbyItems.map(item => item.groupInterval).indexOf(groupInterval);
        return this.groupbyItems[currentIndex + 1].groupInterval;
    }

    getHistoricalCustomizer() {
        return cellInfo => this.l(this.historicalTextsKeys[cellInfo.value]).toUpperCase();
    }

    getYearHistoricalSelectorWithCurrent(): any {
        return data => {
            let currentYear = new Date().getFullYear(),
                itemYear = new Date(data.date).getFullYear(),
                result = 0;
            if (currentYear < itemYear) {
                result = 2;
            } else if (currentYear === itemYear) {
                result = 1;
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
        abp.ui.setBusy();
        $('.pivot-grid').addClass('invisible');
        let itemIndex = event.itemData.itemIndex !== undefined ? event.itemData.itemIndex : event.itemIndex,
            value = this.groupbyItems[itemIndex],
            startedGroupInterval = value.groupInterval;
        this.groupInterval = startedGroupInterval;
        this.updateDateFields(startedGroupInterval);
        /** Change historical field for different date intervals */
        let historicalField = this.getHistoricField();
        historicalField ['selector'] = value.historicalSelectionFunction();
        this.collapsedStartingAndEndingBalance = false;
        this.closeTransactionsDetail();
        this.dataSource = this.getApiDataSource();
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
                this.pivotGrid.instance.getDataSource().expandHeaderItem('row', [Income]);
                this.pivotGrid.instance.getDataSource().expandHeaderItem('row', [Expense]);
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
            if (this.hasChildsByPath(childPath, this.cashflowDataTree)) {
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
            cellObj.cell.path[0] === StartedBalance &&
            !cellObj.cell.isWhiteSpace;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === StartedBalance;
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === StartedBalance &&
            (cellObj.cell.rowType === Total || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.type === Total &&
            cellObj.cell.path.length === 1 &&
            (cellObj.cell.path[0] === Income || cellObj.cell.path[0] === Expense);
    }

    /**
     * whether or not the cell is net change header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isNetChangeCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.path && cellObj.cell.path[0] === NetChange;
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
            (cellObj.cell.rowPath[0] === Income || cellObj.cell.rowPath[0] === Expense);
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
               cellObj.cell.path.length === 1 &&
               cellObj.cell.path[0] === Total &&
               !cellObj.cell.isWhiteSpace;
    }

    isIncomeOrExpenseWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
               cellObj.cell.path.length === 1 &&
               (cellObj.cell.path[0] === Income || cellObj.cell.path[0] === Expense);
    }

    isStartingBalanceWhiteSpace(cellObj) {
        return cellObj.cell.isWhiteSpace &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === StartedBalance;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Total);
    }

    isAllTotalBalanceCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
               (cellObj.cell.rowPath[0] === Total || cellObj.cell.rowPath[0] === NetChange);
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
               (cellObj.cell.rowPath[0] === Income || cellObj.cell.rowPath[0] === Expense);
    }

    /** Whether the cell is the reconciliation header cell */
    isReconciliationHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === Reconciliation &&
            !cellObj.cell.isWhiteSpace;
    }

    /** Whether the cell is the reconciliation data cell */
    isReconciliationDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Reconciliation);
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

        if (this.isIncomeOrExpenseWhiteSpace(e)) {
            e.cellElement.addClass('hiddenWhiteSpace');
        }

        if (this.isStartingBalanceWhiteSpace(e)) {
            e.cellElement.addClass('startedBalanceWhiteSpace');
        }

        /** added css class to the income and outcomes columns */
        if ((this.isIncomeOrExpensesHeaderCell(e)) ||
            (this.isIncomeOrExpensesDataCell(e))) {
            let isDataCell = this.isIncomeOrExpensesDataCell(e);
            let pathProp = isDataCell ? 'rowPath' : 'path';
            let cssClass = e.cell[pathProp] !== undefined && e.cell[pathProp][0] === Income ? 'income' : 'expenses';
            e.cellElement.addClass(cssClass);
            e.cellElement.parent().addClass(cssClass + 'Row');
            /** disable collapsing for income and expenses columns */
            if (this.isIncomeOrExpensesHeaderCell(e)) {
                e.cellElement.addClass('uppercase');
                e.cellElement.click(function (event) {
                    event.stopImmediatePropagation();
                });
            }
        }

        if (this.isNetChangeCell(e)) {
            e.cellElement.addClass('netChange');
            e.cellElement.parent().addClass('netChangeRow');
            e.cellElement.click(function (event) {
                event.stopImmediatePropagation();
            });
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
            if (!this.hasChildsByPath(e.cell.path, this.cashflowDataTree)) {
                e.cellElement.addClass('emptyChildren');
                e.cellElement.click(function (event) {
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
        if (e.area === 'row' && e.cell.path && e.cell.path.length !== 1 && e.cell.text.length > this.maxCategoriesWidth) {
            e.cellElement.attr('title', e.cell.text);
            e.cellElement.text(_.prune(e.cell.text, this.maxCategoriesWidth));
        }

        /** Apply user preferences to the data showing */
        this.applyUserPreferencesForCells(e);
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
            !cellObj.cellElement.hasClass('hideZeroValues')) {
            cellObj.cellElement.text(cellObj.cell.value.toLocaleString(locale, {
                style: 'currency',
                currency: this.currencyId
            }));
        }
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
        for (let type in this.cellTypesCheckMethods) {
            let method = <any>this.cellTypesCheckMethods[type];
            if (method(cellObj)) {
                cellType = type;
                break;
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
                    let hideHead = cellObj.cellElement.hasClass('dx-pivotgrid-expanded') &&
                        (fieldName === 'quarter' || cellObj.cellElement.parent().parent().children().length >= 6);
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
            if (field.dataType === 'date' && field.groupInterval !== 'day') {
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

    onCellClick(cellObj) {
        /** bind the collapse action on white space column */
        if (cellObj.cell.isWhiteSpace) {
            this.bindCollapseActionOnWhiteSpaceColumn(cellObj);
        }
        if (cellObj.area === 'data') {

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

            $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
            $(cellObj.cellElement).addClass('chosenFilterForCashFlow');

            const isAccountCell = [StartedBalance, Reconciliation, Total].indexOf(cellObj.cell.rowPath[0]) !== -1;
            let accountsIds = isAccountCell && cellObj.cell.rowPath[1] ?
                              [cellObj.cell.rowPath[1]] :
                              this.requestFilter.accountIds || [];

            this.statsDetailFilter = StatsDetailFilter.fromJS({
                cashFlowTypeId: cellObj.cell.rowPath[0],
                categoryGroupId: !isAccountCell ? cellObj.cell.rowPath[1] || -1 : null,
                categoryId: cellObj.cell.rowPath[2] ? cellObj.cell.rowPath[2] : null,
                transactionDescriptor: cellObj.cell.rowPath[3] ? cellObj.cell.rowPath[3] : null,
                startDate: this.requestFilter.startDate && this.requestFilter.startDate > datePeriod.startDate ? this.requestFilter.startDate : datePeriod.startDate,
                endDate: this.requestFilter.endDate && this.requestFilter.endDate < datePeriod.endDate ? this.requestFilter.endDate : datePeriod.endDate,
                currencyId: this.currencyId,
                bankIds: this.requestFilter.bankIds || [],
                accountIds: accountsIds,
                businessEntityIds: this.requestFilter.businessEntityIds || []
            });

            // check on double click
            let component = cellObj.component;
            if (!component.clickCount) component.clickCount = 1;
            else component.clickCount = component.clickCount + 1;
            if (component.clickCount == 1) {
                component.lastClickTime = new Date();
                setTimeout(function () {
                    component.lastClickTime = 0;
                    component.clickCount = 0;
                }, 350);
            } else if (component.clickCount == 2) {
                if (((+new Date()) - component.lastClickTime) < 300) {
                    this.getStatsDetails(this.statsDetailFilter);
                    document.getSelection().removeAllRanges();
                }
                component.clickCount = 0;
                component.lastClickTime = 0;
            }
        }

        /** If month cell has only one child (mtd or projected) - then click on it
         *  to expand/collapse days */
        if (cellObj.area === 'column' && cellObj.cell) {
            if (cellObj.rowIndex === cellObj.columnFields.filter(field => field.groupInterval === 'month')[0].areaIndex && !this.monthHasForecast(cellObj) && !cellObj.cell.expanded) {
                this.addFieldToClicking(cellObj.cell.path);
            }
        }
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
    getDateByPath(path, columnFields, lowestInterval) {
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
        let startDate: Moment.Moment = moment.utc('1970-01-01');
        let endDate: Moment.Moment = moment.utc('1970-01-01');
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
    }

    reclassifyTransactions($event) {
        let transactions = this.cashFlowGrid.instance.getSelectedRowKeys();
        transactions.length && this.dialog.open(RuleDialogComponent, {
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

    /**
     * Find if the group has childs by path and fields list
     * @param path - the array with the path
     * @param object - the tree with the data
     * @return {boolean}
     */
    hasChildsByPath(path, dataTree) {
        let result = true;
        path.forEach( pathItem => {
            if (pathItem && dataTree.hasOwnProperty(pathItem)) {
                let keys = Object.keys(dataTree[pathItem]);
                let firstKey = keys && Object.keys(dataTree[pathItem])[0];
                if (firstKey !== 'undefined' && firstKey != 'null') {
                    dataTree = dataTree[pathItem];
                } else {
                    result = false;
                }
            } else {
                result = false;
            }
        });
        return result;
    }

    /**
     *  recalculates sum of the starting balance (including previous totals)
     *  and recalculates ending cash positions values (including previous totals)
     *  @param summaryCell
     *  @return {number}
     */
    calculateSummaryValue() {
        return summaryCell => {

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
                return this.modifyEndingBalanceAccountCell(summaryCell);
            }

            /** if the value is a balance value -
             *  then get the prev columns grand total for the column and add */
            if (prevWithParent !== null && this.isCellIsStartingBalanceSummary(summaryCell)) {
                return this.modifyStartingBalanceSummaryCell(summaryCell, prevWithParent);
            }

            if (this.isCellIsStartingBalanceSummary(summaryCell)) {
                return this.getCurrentValueForStartingBalanceCell(summaryCell, false);
            }

            return summaryCell.value() || 0;
        };
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
        let cellData = <any>this.getCellData(summaryCell, summaryCell.value(summaryCell.field('row')), StartedBalance);
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
        let prevTotal = prevWithParent.slice(0, Total),
            currentCellValue = summaryCell.value() || 0,
            prevTotalValue = prevTotal ? prevTotal.value() || 0 : 0,
            prevIsFirstColumn = this.getPrevWithParent(prevWithParent) ? true : false,
            prevCellValue = prevWithParent ? prevWithParent.value(prevIsFirstColumn) || 0 : 0,
            prevReconciliation = prevWithParent.slice(0, Reconciliation),
            prevReconciliationValue = prevReconciliation ? prevReconciliation.value() || 0 : 0;
        return currentCellValue + prevTotalValue + prevCellValue + prevReconciliationValue;
    }

    /**
     * Modify the ending balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyEndingBalanceAccountCell(summaryCell) {
        let startedBalanceAccountValue = this.getCellValue(summaryCell, StartedBalance),
            currentCellValue = summaryCell.value() || 0,
            reconciliationTotal = this.getCellValue(summaryCell, Reconciliation);
        return currentCellValue + startedBalanceAccountValue + reconciliationTotal;
    }

    /**
     * Modify the total balance summary cell to have a proper calculation
     * @param summaryCell
     * @return {number}
     */
    modifyGrandTotalSummary(summaryCell) {
        let startedBalanceCell = summaryCell.slice(0, StartedBalance),
            startedBalanceCellValue = startedBalanceCell ? (startedBalanceCell.value(true) || 0) : 0,
            currentCellValue = summaryCell.value() || 0,
            reconciliationTotal = summaryCell.slice(0, Reconciliation),
            reconciliationTotalValue = reconciliationTotal.value() || 0;
        return currentCellValue + startedBalanceCellValue + reconciliationTotalValue;
    }

    /**
     * Gets the cell value from the specific cell
     * cellData - summaryCell object of devextreme
     * target - StartedBalance | Total | Reconciliation
     */
    getCellValue(summaryCell, target) {

        let targetPeriodAccountCashedValue;
        const accountId = summaryCell.value(summaryCell.field('row'), true),
              targetPeriodCell = summaryCell.parent('row') ? summaryCell.parent('row').slice(0, target) : null,
              targetPeriodAccountCell = targetPeriodCell ? targetPeriodCell.child('row', accountId) : null,
              cellData = this.getCellData(summaryCell, accountId, target),
              isCalculatedValue = underscore.contains([StartedBalance, Reconciliation], target) ? true : false;

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
                (cellData.accountId === StartedBalance || cellData.accountId === Total || cashflowData.accountId === cellData.accountId) &&
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
               summaryCell.field('row').dataField === 'cashflowTypeId' &&
               summaryCell.value(summaryCell.field('row')) === Total;
    }

    isRowGrandTotal(summaryCell) {
        return summaryCell.field('column') === null;
    }

    isStartingBalanceAccountCell(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === `categorization.${this.categorization[0]}` &&
            summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === StartedBalance &&
            Number.isInteger(summaryCell.value(summaryCell.field('row')));
    }

    isCellIsStartingBalanceSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'cashflowTypeId' &&
            summaryCell.value(summaryCell.field('row')) === StartedBalance;
    }

    isEndingBalanceAccountCell(summaryCell) {
        return summaryCell.field('row') !== null &&
               summaryCell.field('row').dataField === `categorization.${this.categorization[0]}` &&
               summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === Total &&
               Number.isInteger(summaryCell.value(summaryCell.field('row')));
    }

    getStatsDetails(params): void {
        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, params)
            .subscribe(result => {
                this.statsDetailResult = result.map(detail => {
                    detail.date = this.removeLocalTimezoneOffset(detail.date);
                    return detail;
                });
            });
    }

    /**
     * Change moment date to the offset of local timezone
     * @param date
     */
    removeLocalTimezoneOffset(date) {
        let offset = new Date(date.format('YYYY-MM-DD')).getTimezoneOffset();
        return date.add(offset, 'minutes');
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
    resortPivotGrid(event: {sortBy: string, sortByDirection: SortState}) {
        let sortOptions = underscore.extend(this.sortings.find(sorting => sorting.name.toLowerCase() === event.sortBy.toLowerCase())['sortOptions']);
        sortOptions.sortOrder = event.sortByDirection === SortState.DOWN ? 'asc' : 'desc';
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
}
