import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { GroupbyItem } from './models/groupbyItem';

import {
    CashflowServiceProxy,
    StatsFilter,
    BankAccountDto,
    CashFlowInitialData,
    StatsDetailFilter,
    TransactionStatsDto
} from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { DxPivotGridComponent } from 'devextreme-angular';
import * as _ from 'underscore.string';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterMultiselectDropDownComponent } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.component';
import { FilterMultiselectDropDownModel } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

const moment = extendMoment(Moment);

/** Constants */
const StartedBalance = 'B',
      Income         = 'I',
      Expense        = 'E',
      Reconciliation = 'D',
      Total          = 'T',
      GrandTotal     = 'GT';

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashflowServiceProxy ]
})
export class CashflowComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    headlineConfig: any;
    cashflowData: any;
    cashflowDataTree: any;
    cashflowTypes: any;
    expenseCategories: any;
    bankAccounts: any;
    dataSource: any;
    groupInterval: any = 'year';
    statsDetailFilter: StatsDetailFilter = new StatsDetailFilter();
    statsDetailResult: any;
    categorization: Array<string> = [
        'category',
        'descriptor'
    ];
    /** posible groupIntervals year, quarter, month, dayofweek, day */
    groupbyItems: GroupbyItem[] = [
        {
            'groupInterval': 'year',
            'optionText': this.l('Years').toUpperCase(),
            'customizeTextFunction': this.getDateIntervalHeaderCustomizer.bind(this, 'year')(),
            'historicalSelectionFunction': this.getYearHistoricalSelector
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
            'customizeTextFunction': this.getDateIntervalHeaderCustomizer.bind(this, 'day'),
            'historicalSelectionFunction': this.getYearHistoricalSelectorWithCurrent
        }
    ];
    collapsedStartingAndEndingBalance = false;
    leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
        Total,
        Reconciliation
    ];
    intervals2methods = {
        'year': 'getFullYear',
        'month': 'getMonth',
        'day': 'getDate'
    };
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
                return value ? value.toUpperCase() : cellInfo.valueText;
            }
        },
        {
            caption: 'Group',
            width: 120,
            area: 'row',
            areaIndex: 1,
            dataField: `categorization.${this.categorization[0]}`,
            expanded: false,
            showTotals: true,
            customizeText: cellInfo => {
                let value = cellInfo.value;
                /** If the cell is int - then we have bank account as second level */
                if (Number.isInteger(cellInfo.value) && this.bankAccounts) {
                    value = this.bankAccounts.find( account => {
                        return account.id === cellInfo.value;
                    });
                    value = value ? value.accountName : cellInfo.valueText;
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
            dataField: `categorization.${this.categorization[1]}`,
            customizeText: cellInfo => {
                return cellInfo.valueText;
            }
        },
        {
            caption: 'Amount',
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: 'currency',
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
            customizeText: this.getDateIntervalHeaderCustomizer.bind(this)('year'),
            visible: true,
            summaryDisplayMode: 'percentVariation'
        },
        {
            caption: 'Quarter',
            dataField: 'date',
            dataType: 'date',
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
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Day',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            groupInterval: 'day',
            customizeText: this.getDateIntervalHeaderCustomizer.bind(this)('day'),
            visible: true
        }
    ];
    cssMarker = ' @css';
    loading = {
        'enabled': true
    };
    historicalTexts = [
        this.l('Historical Cashflows - Current Period'),
        this.l('Current'),
        this.l('Cashflow - Forecast')
    ];
    historicalClasses = [
        'historical',
        'current',
        'forecast'
    ];
    private initialData: CashFlowInitialData;
    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;
    private requestFilter: StatsFilter;
    private anotherPeriodAccountsValues: Map<object, number> = new Map();

    constructor(injector: Injector, private _CashflowServiceProxy: CashflowServiceProxy,
        private _filtersService: FiltersService) {
        super(injector);
        this._filtersService.enabled = true;
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';
        this._CashflowServiceProxy.getCashFlowInitialData()
            .subscribe(result => {
                this.initialData = result;
                this._filtersService.setup(
                    this.filters = [
                        new FilterModel({
                            component: FilterMultiselectDropDownComponent,
                            field: 'accountIds',
                            caption: 'Account',
                            items: {
                                acc: new FilterMultiselectDropDownModel({
                                    displayName: 'Account',
                                    filterField: 'accountIds',
                                    displayElementExp: (item: BankAccountDto) => {
                                        if (item) {
                                            return item.accountName + ' (' + item.accountNumber + ')';
                                        }
                                    },
                                    dataSource: result.bankAccounts,
                                    columns: [
                                        {
                                            dataField: 'accountName',
                                            caption: this.l('CashflowAccountFilter_AccountName')
                                        },
                                        {
                                            dataField: 'accountNumber',
                                            caption: this.l('CashflowAccountFilter_AccountNumber')
                                        }
                                    ],
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterCalendarComponent,
                            caption: 'Date',
                            items: { from: new FilterItemModel(), to: new FilterItemModel() }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'businessEntityIds',
                            caption: 'BusinessEntity',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.businessEntities,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        })
                    ]
                );

                this.loadGridDataSource();
            });

        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }
            this.loadGridDataSource();
        });

        window['onHeaderExpanderClick'] = function ($event) {
            let rect = $event.target.getBoundingClientRect();
            if (Math.abs($event.clientX - rect.x) < 10 &&
                Math.abs($event.clientY - rect.y) < 10
            ) $event.stopPropagation();
            $($event.target).closest('tr').children().each(function () {
                if ($(this).hasClass('dx-pivotgrid-expanded')) {
                    $(this).find('div.head-cell-expand').toggleClass('closed');
                }
            });
        };
        this.headlineConfig = {
            name: this.l('Cash Flow Statement and Forecast'),
            icon: 'globe',
            buttons: [
                {
                    enabled: true,
                    action: Function(),
                    lable: this.l('Add New')
                }
            ]
        };
    }

    filterByBusinessEntity(filter: FilterModel, requestFilter: StatsFilter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            requestFilter[filter.field] = filter.items.element.value.map(x => x);
        }
    }

    filterByAccount(filter: FilterModel, requestFilter: StatsFilter) {
        if (filter.items && filter.items.acc && filter.items.acc.value) {
            requestFilter[filter.field] = filter.items.acc.value.map(x => x.id);
        }
    }

    filterByDate(filter: FilterModel, requestFilter: StatsFilter) {
        requestFilter.startDate = requestFilter.endDate = null;
        let keys = Object.keys(filter.items);
        for (let key of keys) {
            let item = filter.items[key];
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's');
                    requestFilter.endDate = date.toDate();
                } else {
                    requestFilter.startDate = date.toDate();
                }
            }
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this._filtersService.enabled = false;
        this.rootComponent.overflowHidden();
    }

    loadGridDataSource() {
        abp.ui.setBusy();
        $('.pivot-grid').addClass('invisible');
        this._CashflowServiceProxy.getStats(this.requestFilter)
            .subscribe(result => {
                if (result.transactionStats.length) {
                    let transactions = result.transactionStats;
                    this.cashflowTypes = this.initialData.cashflowTypes;
                    this.bankAccounts = this.initialData.bankAccounts;
                    /** categories - object with categories */
                    this.cashflowData = this.getCashflowDataFromTransactions(transactions);
                    /** Make a copy of cashflow data to display it in custom total group on the top level */
                    let stubCashflowDataForEndingCashPosition = this.getStubCashflowDataForEndingCashPosition(this.cashflowData);
                    this.addCashflowType(Total, this.l('Ending Cash Position'));
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
                        this.apiTableFields.filter( field => { return field.area === 'row'; })
                    );
                } else {
                    this.cashflowData = null;
                }
                this.dataSource = this.getApiDataSource();
            });
    }

    /**
     * Get the array of stub cashflow data to add stub empty columns for cashflow
     * @param {Array<TransactionStatsDto>} transactions
     */
    getStubCashflowDataForAccounts(transactions: Array<TransactionStatsDto>) {
        let stubCashflowDataForAccounts: Array<TransactionStatsDto> = [],
            allAccountsIds: Array<number> = [],
            currentAccountsIds = {
                [StartedBalance]: [],
                [Total]: [],
                [Reconciliation]: []
            },
            firstDate;
            transactions.forEach(transaction => {
                /** get the first real date for stub data */
                if (!firstDate && transaction.date)  {
                    firstDate = transaction.date;
                }
                if (allAccountsIds.indexOf(transaction.accountId) === -1) {
                    allAccountsIds.push(transaction.accountId);
                }
                for (let cashflowType in currentAccountsIds) {
                    if (transaction.cashflowTypeId === cashflowType &&
                        currentAccountsIds[cashflowType].indexOf(transaction.accountId) === -1) {
                        currentAccountsIds[cashflowType].push(transaction.accountId);
                    }
                }
            });
            allAccountsIds.forEach(accountId => {
                for (let cashflowType in currentAccountsIds) {
                    if (currentAccountsIds[cashflowType].indexOf(accountId) === -1) {
                        stubCashflowDataForAccounts.push(
                            this.createStubTransaction({
                                'cashflowTypeId': cashflowType,
                                'date': firstDate,
                                'accountId': accountId,
                                'categorization': {
                                    'category': accountId
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
    createStubTransaction(stubObj): TransactionStatsDto {
        let categorizationObject: { [key: string]: string; } = this.createCategorizationObject(this.categorization);
        let stubTransaction = new TransactionStatsDto({
            'adjustmentType': null,
            'cashflowTypeId': null,
            'accountId': null,
            'currencyId': 'USD',
            'amount': 0,
            'comment': null,
            'date': null,
            'categorization': categorizationObject
        });
        return Object.assign(stubTransaction, stubObj);
    }

    /**
     * For every categorization item create object with the categorization as properties
     */
    createCategorizationObject(categorization: Array<string>): { [key: string]: string; } {
        let categorizationObject = {};
        this.categorization.forEach(category => {
            categorizationObject[category] = null;
        });
        return categorizationObject;
    }

    /**
     * Get the cashflow data from the transactions from the server
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getCashflowDataFromTransactions(transactions: Array<TransactionStatsDto>) {
        return transactions.map(transactionObj => {
            /** change the second level for started balance and reconciliations for the account id */
            if (transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation) {
                transactionObj.categorization = {
                    [this.categorization[0]]: <any>transactionObj.accountId
                };
            }
            return transactionObj;
        });
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
    getStubCashflowDataForEndingCashPosition(cashflowData: Array<TransactionStatsDto>) {
        let stubCashflowDataForEndingCashPosition: Array<TransactionStatsDto> = [];
        cashflowData.forEach( cashflowDataItem => {
            /** clone transaction to another array */
            if (cashflowDataItem.cashflowTypeId === Income || cashflowDataItem.cashflowTypeId === Expense) {
                let clonedTransaction = this.createStubTransaction({
                    'cashflowTypeId': Total,
                    'categorization': {
                        [this.categorization[0]]: cashflowDataItem.accountId
                    },
                    'expenseCategoryId': null,
                    'amount': cashflowDataItem.amount,
                    'date': cashflowDataItem.date
                });
                stubCashflowDataForEndingCashPosition.push(clonedTransaction);
            }
        });
        return stubCashflowDataForEndingCashPosition;
    }

    /**
     * for every day that is absent in cashflow data add stub object
     * (hack to show all days, months and quarters for all years in cashflow data page)
     * @param {Array<TransactionStatsDto>} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getStubCashflowDataForAllDays(cashflowData: Array<TransactionStatsDto>) {
        let stubCashflowData = Array<TransactionStatsDto>();
        let allYears: Array<number> = [];
        let existingDates: Array<string> = [];
        let firstAccountId;
        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let transactionYear = cashflowItem.date.year();
            let date = cashflowItem.date.format('DD.MM.YYYY');
            if (allYears.indexOf(transactionYear) === -1) allYears.push(transactionYear);
            if (existingDates.indexOf(date) === -1) existingDates.push(date);
            if (!firstAccountId && cashflowItem.accountId) firstAccountId = cashflowItem.accountId;
        });
        allYears = allYears.sort();
        /** get started date of the first year */
        let startedDate = moment().year(allYears[0]).startOf('year');
        /** get last date of the last year */
        let endedDate = moment().year(allYears[allYears.length - 1]).endOf('year');
        /** cycle from started date to ended date */
        let datesRange = Array.from(moment.range(startedDate, endedDate).by('day'));
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
                        'date': date
                    })
                );
            }
        });
        return stubCashflowData;
    }

    /**
     * Build the nested object from array as the properties
     * @param base - the object to create
     * @param names - the array with nested keys
     */
    createNestedObject(base, names) {
        for (let i = 0; i < names.length; i++ ) {
            base = base[ names[i] ] = base[ names[i] ] || {};
        }
    }

    /**
     * Build the tree from cashflow data
     * @param data
     * @param fields
     * @return {{}}
     */
    getCashflowDataTree(data, fields) {
        let cashflowDataTree = {};
        const getDescendantPropValue = (obj, path) => (
            path.split('.').reduce((acc, part) => acc && acc[part], obj)
        );
        data.forEach( cashflowItem => {
            let chainingArr = [];
            fields.forEach( (field) => {
                let value = getDescendantPropValue(cashflowItem, field['dataField']);
                chainingArr.push(value);
            });
            this.createNestedObject(cashflowDataTree, chainingArr);
        });
        return cashflowDataTree;
    }

    refreshDataGrid() {
        this.collapsedStartingAndEndingBalance = false;
        this.loadGridDataSource();
    }

    getApiDataSource() {
        return {
            fields: this.apiTableFields,
            store: this.cashflowData
        };
    }

    /**
     * return the array of dates intervals that should be hidden
     * @param startedGroupInterval
     */
    getFieldsToBeHide(startedGroupInterval) {
        let datesIntervalsToBeHide = this.groupbyItems.map(group => group.groupInterval);
        /** update date fields for table */
        let startedIntervalAdded = false;
        for (let group_by_item of this.groupbyItems) {
            let intervalField = this.getDateFieldByInterval(group_by_item['groupInterval']);
            if (group_by_item['groupInterval'] === startedGroupInterval || startedIntervalAdded) {
                datesIntervalsToBeHide.splice(datesIntervalsToBeHide.indexOf(group_by_item['groupInterval']), 1);
                startedIntervalAdded = true;
                intervalField.expanded = true;
            }
        }
        return datesIntervalsToBeHide;
    }

    /**
     * Update the fields array with the date fields with different date intervals like year, quarter and month
     * @param startedGroupInterval - the groupInterval from which we should start show headers
     */
    updateDateFields(startedGroupInterval) {
        let allDateIntervals = this.groupbyItems.map(group => group.groupInterval);
        let datesIntervalsToBeHide = allDateIntervals.slice(0, allDateIntervals.indexOf(startedGroupInterval));
        for (let dateInterval of allDateIntervals) {
            /** move historical period to the top of started interval by setting area index */
            let intervalField = this.getDateFieldByInterval(dateInterval);
            intervalField.expanded = false;
        }
        for (let dateInterval of datesIntervalsToBeHide) {
            let intervalField = this.getDateFieldByInterval(dateInterval);
            intervalField.expanded = true;
        }
    }

    /**
     * Event that happens when the content renders
     * @param event
     */
    onContentReady(event) {
        let allDateIntervals = this.groupbyItems.map(group => group.groupInterval);
        let datesIntervalsToBeHide = allDateIntervals.slice(0, allDateIntervals.indexOf(this.groupInterval));
        for (let dateInterval of datesIntervalsToBeHide) {
            /** Hide the fields that are not chosen */
            let intervalFieldsSelector = `.dateField:not(.dx-total).${dateInterval}`;
            // $(intervalFieldsSelector).each(function(){
            //     $(this).text('');
            //     $(this).addClass('dataFieldHidden');
            // });
        }

        /** Collapse starting and ending balances rows */
        if (!this.collapsedStartingAndEndingBalance) {
            if (this.pivotGrid.instance) {
                this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [StartedBalance]);
                this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [Total]);
                this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', [Reconciliation]);
                this.collapsedStartingAndEndingBalance = true;
            }
        }

        /** Get the groupBy element and append the dx-area-description-cell with it */
        $('.groupBy').appendTo(event.element.find('.dx-area-description-cell'));
        this.changeIntervalWidth();

        /** Calculate the amount current cells to cut the current period current cell to change current from
         *  current for year to current for the grouping period */
        if (this.groupInterval !== 'year') {
            let lowestOpenedInterval = this.getLowestOpenedInterval();
            $(`.current${_.capitalize(lowestOpenedInterval)}`).addClass('lowestOpenedCurrent');
            this.changeHistoricalColspans(lowestOpenedInterval);
        }

        if (this.pivotGrid.instance != undefined && !this.pivotGrid.instance.getDataSource().isLoading()) {
            abp.ui.clearBusy();
            $('.pivot-grid').removeClass('invisible');
        }
    }

    /**
     * Resize the width of the interval inputs
     */
    changeIntervalWidth() {
        function textWidth(element): number {
            let fakeEl = $('<span>').hide().appendTo(document.body);
            fakeEl.text(element.val() || element.text()).css('font', element.css('font'));
            let width = fakeEl.width();
            fakeEl.remove();
            return width;
        };
        let elemWidth = textWidth($('.groupBy .dx-texteditor-input')) + 23;
        $('.groupBy .dx-texteditor-input').css('width', elemWidth);
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
            text = period === 'forecast' ? this.historicalTexts[2] : this.historicalTexts[0];
        $('.historicalRow .current')
            [positionMethod](function() {
                return `<td class="dx-pivotgrid-expanded historicalField ${period}">${text.toUpperCase()}</td>`;
            }).click(function (event) {
                event.stopImmediatePropagation();
            });
    }

    getIntervalColspansAmountForCurrent(lowestInterval) {
        let colspanAmount = 1;
        let currentElement = $('.current' + _.capitalize(lowestInterval));
        if (!currentElement.length) {
            colspanAmount = 0;
        }
        return colspanAmount;
    }

    /**
     * Get lowest opened interval
     */
    getLowestOpenedInterval() {
        let allIntervals = this.groupbyItems.map(item => item.groupInterval);
        let lowestInterval = allIntervals[0];
        allIntervals.every(interval => {
            let currentElement = $('.current' + _.capitalize(interval));
            lowestInterval = interval;
            if (currentElement.length && !currentElement.attr('colspan')) {
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
        return this.groupbyItems[currentIndex - 1].groupInterval;
    }

    /**
     * Return the index of next interval that leads for the interval in argument
     */
    getNextGroupInterval(groupInterval) {
        let currentIndex = this.groupbyItems.map(item => item.groupInterval).indexOf(groupInterval);
        return this.groupbyItems[currentIndex + 1].groupInterval;
    }

    /**
     * @returns {function(any): string}
     */
    getDateIntervalHeaderCustomizer(dateInterval: string) {
        return cellInfo => {
            /** @todo find out how to inject the this.cssMarker instead of hardcoded ' @css' */
            return cellInfo.value + ' @css:{dateField ' + dateInterval + '}';
        };
    }

    getHistoricalCustomizer() {
        return cellInfo => {
            return this.historicalTexts[cellInfo.value].toUpperCase() +
                   ' @css:{historicalField ' + this.historicalClasses[cellInfo.value] + '}';
        };
    }

    getYearHistoricalSelector(): any {
        return data => {
            let currentYear = new Date().getFullYear(),
                itemYear = new Date(data.date).getFullYear();
            return currentYear <= itemYear ? 2 : 0;
        };
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
     * Compares two intervals of two dates with the method
     * @param date1
     * @param date2
     * @param method - method of Date object to compare two dates
     * @returns {number}
     */
    compareDateIntervals(date1, date2, interval: string) {
        let result = 0,
            currentPeriod = date1[this.intervals2methods[interval]](),
            itemPeriod = date2[this.intervals2methods[interval]]();
        if (currentPeriod < itemPeriod) {
            result = 2;
        } else if (currentPeriod === itemPeriod) {
            result = 1;
        }
        return result;
    }

    /**
     * Gets the text for quarters header
     * @returns {string}
     */
    getQuarterHeaderCustomizer(): any {
        return cellInfo => {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField quarter}';
        };
    }

    /**
     * Gets the text for months header
     * @returns {string}
     */
    getMonthHeaderCustomizer(): any {
        return function(cellInfo) {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField month}';
        };
    }

    /**
     * Gets the field in apiTableFields by dateInterval (year, quarter, month or day)
     * @returns {Object}
     */
    getDateFieldByInterval(dateInterval) {
        return this.apiTableFields.find(
            field => field['groupInterval'] === dateInterval
        );
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
        let startedGroupInterval = event.value.groupInterval;
        this.groupInterval = startedGroupInterval;
        this.updateDateFields(startedGroupInterval);
        /** Change historical field for different date intervals */
        let historicalField = this.getHistoricField();
        //this.changeHistoricalFieldPosition(historicalField, startedGroupInterval);
        historicalField ['selector'] = event.value.historicalSelectionFunction();
        this.changeIntervalWidth();
        this.refreshDataGrid();
    }

    cutCssFromValue(text) {
        return text.slice(text.indexOf(this.cssMarker) + this.cssMarker.length + 2, text.length - 1);
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
               cellObj.cell.rowPath[0] === StartedBalance &&
               cellObj.cell.rowType === 'D';
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

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === Total);
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
     * whether or not the cell is grand total label cell
     * @param cellObj
     * @returns {boolean}
     */
    isGrandTotalLabelCell(cellObj) {
        return cellObj.cell.type === GrandTotal;
    }
    /**
     * whether or not the cell is grand total data cell
     * @param cellObj
     * @returns {boolean}
     */
    isGrandTotalDataCell(cellObj) {
        return cellObj.cell.rowType === GrandTotal;
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
     * whether the cell contains the css marker for adding css to it
     * @param cellObj
     * @returns {boolean}
     */
    isCellContainsCssMarker(cellObj) {
        return cellObj.cell.text.indexOf(this.cssMarker) !== -1;
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

        /** added css class to reconsiliation row */
        if (this.isReconciliationHeaderCell(e) || this.isReconciliationDataCell(e)) {
            e.cellElement.parent().addClass('reconciliation');
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

        /** headers manipulation (adding css classes and appending 'Totals text') */
        if (e.area === 'column') {
            if (this.isCellContainsCssMarker(e)) {
                this.prepareColumnCell(e);
            }

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
    }

    /**
     * whether it belong to current period
     * @param cellObj
     */
    // isMonthBelongToCurrentPeriod(cellObj) {
    //     return this.getMonthHistoricalSelector();
    // }
    /**
     * remove css from the cell text, add css as a class, and add the totals text for the fields
     * if it is year or quarter cells
     * @param cellObj
     */
    prepareColumnCell(cellObj) {
        /** get the css class from name */
        let valueWithoutCss = cellObj.cell.text.slice(0, (cellObj.cell.text.indexOf(this.cssMarker)));
        /** cut off the css from the cell text */
        let cssClass = this.cutCssFromValue(cellObj.cell.text);
        /** update the columns with the text without the marker */
        cellObj.cellElement.text(valueWithoutCss);
        /** Added 'Total' text to the year and quarter headers */
        let fieldName = cssClass.slice(cssClass.indexOf(' ') + 1, cssClass.length).trim();
        if (fieldName === 'year' || fieldName === 'quarter') {
            let hideHead = cellObj.cellElement.hasClass('dx-pivotgrid-expanded') &&
              (fieldName === 'quarter' || cellObj.cellElement.parent().parent().children().length >= 6);
            cellObj.cellElement.html('<div onclick="onHeaderExpanderClick(event)" class="head-cell-expand ' +
              (hideHead ? 'closed' : '') + '">' + cellObj.cellElement.html() +
              '<div class="totals">' + this.l('Totals').toUpperCase() + '</div></div>');
        }
        if (_.startsWith(cssClass, 'historicalField') && !cellObj.cellElement.parent().hasClass('historicalRow')) {
            cellObj.cellElement.parent().addClass('historicalRow');
        }
        cellObj.cellElement.addClass(cssClass);
        /** hide projected field for not current months for mdk and projected */
        if (_.startsWith(cssClass, 'projectedField')) {
            /** hide the projected fields if the group interval is */
            if (this.groupInterval === 'day') {
                cellObj.cellElement.hide();
            } else {
                this.hideProjectedFieldForNotCurrentMonths(cellObj);
            }
        }
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
                    currentPeriodValue = fieldInterval === 'month' ?
                                         currentDate[method]() + 1 :
                                         currentDate[method]();
                let path = cellObj.cell.path ? cellObj.cell.path : cellObj.cell.columnPath;
                if (path && path[index] === currentPeriodValue) {
                    cellObj.cellElement.addClass(`current${_.capitalize(fieldInterval)}`);
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
            let datePeriod = this.formattingDate(cellObj.cell.columnPath);
            $('.chosenFilterForCashFlow').removeClass('chosenFilterForCashFlow');
            $(cellObj.cellElement).addClass('chosenFilterForCashFlow');
            this.statsDetailFilter.currencyId = this.requestFilter.currencyId;
            this.statsDetailFilter.cashFlowTypeId = cellObj.cell.rowPath[0];
            this.statsDetailFilter.categorization = this.statsDetailFilter.categorization || {};
            if (this.statsDetailFilter.cashFlowTypeId == StartedBalance ||
                this.statsDetailFilter.cashFlowTypeId == Total ||
                this.statsDetailFilter.cashFlowTypeId == Reconciliation
            ) {
                this.statsDetailFilter.categorization[this.categorization[0]] = undefined;
                if ((!this.requestFilter.accountIds || !this.requestFilter.accountIds.length)  &&
                    cellObj.cell.rowPath[1] &&
                    Number.isInteger(cellObj.cell.rowPath[1])) {
                    this.statsDetailFilter.accountIds = [cellObj.cell.rowPath[1]];
                } else {
                    this.statsDetailFilter.accountIds = (this.requestFilter.accountIds && this.requestFilter.accountIds) || [];
                }
            } else {
                this.statsDetailFilter.accountIds = (this.requestFilter.accountIds && this.requestFilter.accountIds) || [];
                this.statsDetailFilter.categorization[this.categorization[0]] = cellObj.cell.rowPath[1];
            }
            this.statsDetailFilter.categorization[this.categorization[1]] = cellObj.cell.rowPath[2];
            this.statsDetailFilter.startDate = datePeriod.startDate;
            this.statsDetailFilter.endDate = datePeriod.endDate;
            this.statsDetailFilter.businessEntityIds = this.requestFilter.businessEntityIds;
            this.getStatsDetails(this.statsDetailFilter);
        }
    }

    customCurrency(value) {
        return (value).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0});
    }

    formattingDate(param = []) {
        let startDate: Moment.Moment = moment.utc('1970-01-01');
        let endDate: Moment.Moment = moment.utc('1970-01-01');
        let year = param[1];
        let quarter = param[2];
        let month = param[3];
        let day = param[4];

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
        return {startDate: startDate, endDate : endDate};
    }

    closeCashflow() {
        this.statsDetailResult = undefined;
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
            let keys = Object.keys(dataTree[pathItem]);
            let firstKey = Object.keys(dataTree[pathItem])[0];
            if (dataTree.hasOwnProperty(pathItem) &&
                keys.length !== 1 ||
                (keys.length === 1 && firstKey != 'null' && firstKey != 'undefined')
            ) {
                dataTree = dataTree[pathItem];
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
            let counter = this.groupbyItems.length;
            /** @todo refactor and fix a bug when the second call return wrong result */
            summaryCell.__proto__.prevWithParent = function() {
                let prev = this.prev(arguments[0], arguments[1]),
                    currentCell = this;
                while (counter > 0) {
                    if (prev === null) {
                        if (currentCell.parent('column')) {
                            prev = currentCell.parent('column').prev(arguments[0], arguments[1]);
                            currentCell = currentCell.parent('column');
                        }
                        counter--;
                    } else {
                        break;
                    }
                }
                return prev;
            };
            let prevWithParent = summaryCell.prevWithParent('column', true);
            /** if cell is starting balance account cell - then add account sum from previous period */
            if (prevWithParent !== null && this.isStartingBalanceAccountSummary(summaryCell)) {
                return this.modifyStartingBalanceAccountCell(summaryCell, prevWithParent);
            }

            /** if the value is a balance value -
             *  then get the prev columns grand total for the column and add */
            if (prevWithParent && this.isCellIsStartingBalanceSummary(summaryCell)) {
                return this.modifyStartingBalanceSummaryCell(summaryCell, prevWithParent);
            }

            /** if cell is ending cash position account cell */
            if (this.isEndingBalanceAccountSummary(summaryCell)) {
                return this.modifyEndingBalanceAccountSummary(summaryCell, prevWithParent);
            }

            /** calculation for ending cash position value */
            if (this.isGrandTotalSummary(summaryCell)) {
                return this.modifyGrandTotalSummary(summaryCell);
            }

            return summaryCell.value() || 0;
        };
    }

    /**
     * Modify the value of the starting balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceAccountCell(summaryCell, prevWithParent) {
        let prevEndingAccountValue = this.getAccountValueFromAnotherPeriod(summaryCell, prevWithParent, Total),
            currentCellValue = summaryCell.value() || 0,
            prevCellValue = prevWithParent ? prevWithParent.value(true) || 0 : 0;
        return  currentCellValue + prevEndingAccountValue + prevCellValue;
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
            prevCellValue = prevWithParent ? prevWithParent.value(true) || 0 : 0;
        return currentCellValue + prevTotalValue + prevCellValue;
    }

    /**
     * Modify the ending balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyEndingBalanceAccountSummary(summaryCell, prevWithParent) {
        let startedBalanceAccountValue = this.getAccountValueFromAnotherPeriod(summaryCell, prevWithParent, StartedBalance),
            currentCellValue = summaryCell.value() || 0;
        return currentCellValue + startedBalanceAccountValue;
    }

    /**
     * Modify the total balance summary cell to have a proper calculation
     * @param summaryCell
     * @return {number}
     */
    modifyGrandTotalSummary(summaryCell) {
        let startedBalanceCell = summaryCell.slice(0, StartedBalance),
            startedBalanceCellValue = startedBalanceCell ? (startedBalanceCell.value(true) || 0) : 0,
            currentCellValue = summaryCell.value() || 0;
        return currentCellValue + startedBalanceCellValue;
    }

    /**
     * Get the value from target period for account. For example if we have the cell of total that belongs to the account -
     * then we find the appropriate started balance account value for it
     * @param summaryCell
     * @param prev
     * @param target
     * @return {number}
     */
    getAccountValueFromAnotherPeriod(summaryCell, prevWithParent, target) {
        /** if we want to get the value of the started balance - then we should get the
         *  slice value from current cell, else - we should get the total value from previous cell */
        let subject = target === StartedBalance ? summaryCell : prevWithParent;
            if (!subject) {
                return 0;
            }
        let accountId = summaryCell.value(summaryCell.field('row'), true),
            anotherPeriodCell = subject.parent('row') ? subject.parent('row').slice(0, target) : null,
            anotherPeriodAccount = anotherPeriodCell ? anotherPeriodCell.child('row', accountId) : null,
            anotherPeriodAccountCashedValue,
            isCalculatedValue = target === StartedBalance ? true : false,
            groupInterval = subject.field('column').groupInterval,
            columnValue = subject.value(subject.field('column')),
            parent = subject ? subject.parent() : null,
            /** object with cell data as the key for Map object cash */
            cellData = {
                'cashflowTypeId': target,
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

            /** add to the cell data other date intervals */
            if (parent) {
                while (parent.field('column') && parent.field('column').dataType === 'date') {
                    let parentGroupInterval = parent.field('column').groupInterval,
                        parentColumnValue = parent.value(parent.field('column'));
                    cellData[parentGroupInterval] = parentColumnValue;
                    parent = parent.parent();
                }
            }

            /** if we haven't found the value from the another period -
             *  then it hasn't been expanded and we should find out whether the value is in cash */
            if (anotherPeriodAccount === null) {
                anotherPeriodAccountCashedValue = this.getAnotherPeriodAccountCashedValue(cellData);
                /** if we haven't found the value in cash - then we should calculate the value in the cashflow data by ourselfs */
                if (!anotherPeriodAccountCashedValue) {
                    /** calculate the cell value using the cell data and cashflowData */
                    anotherPeriodAccountCashedValue = this.calculateCellValue(cellData);
                    this.setAnotherPeriodAccountCashedValue(cellData, anotherPeriodAccountCashedValue);
                }
            } else {
                /** add the prevEndingAccount value to the cash */
                this.setAnotherPeriodAccountCashedValue(cellData, anotherPeriodAccount.value(isCalculatedValue));
            }
            return anotherPeriodAccountCashedValue ?
                anotherPeriodAccountCashedValue :
                (anotherPeriodAccount ? anotherPeriodAccount.value(isCalculatedValue) || 0 : 0);
    }

    /**
     * Calculates the value of the cell using the cell data and cashflowData array
     * @param cellData
     */
    calculateCellValue(cellData) {
        /** {cashflowTypeId: 'T', accountId: 10, quarter: 3, year: 2015, month: 5} */
        let value = this.cashflowData.reduce( (sum, cashflowData) => {
            if (
                cashflowData.cashflowTypeId === cellData.cashflowTypeId &&
                cashflowData.accountId === cellData.accountId &&
                (!cellData.year || (cellData.year === cashflowData.date.year())) &&
                (!cellData.quarter || (cellData.quarter === cashflowData.date.quarter())) &&
                (!cellData.month || ( cellData.month - 1 === cashflowData.date.month())) &&
                (!cellData.day || (cellData.day === cashflowData.date.date()))
            ) {
                sum += cashflowData.amount;
            }
            return sum;
        }, 0);
       return value;
    }

    /** get the prev ending account from the cash */
    getAnotherPeriodAccountCashedValue(keyObject) {
        return this.anotherPeriodAccountsValues.get(keyObject.toString());
    }

    /** set the prev ending account value to the cash */
    setAnotherPeriodAccountCashedValue(keyObject, value) {
        this.anotherPeriodAccountsValues.set(keyObject.toString(), value);
    }

    isGrandTotalSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'cashflowTypeId' &&
            summaryCell.value(summaryCell.field('row')) === Total;
    }

    isCellIsStartingBalanceSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'cashflowTypeId' &&
            summaryCell.value(summaryCell.field('row')) === StartedBalance;
    }

    isStartingBalanceAccountSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'categorization.category' &&
            summaryCell.parent() && summaryCell.parent().value(summaryCell.parent('row').field('row')) === StartedBalance &&
            Number.isInteger(summaryCell.value(summaryCell.field('row')));
    }

    isEndingBalanceAccountSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'categorization.category' &&
            summaryCell.parent() && summaryCell.parent().value(summaryCell.parent('row').field('row')) === Total &&
            Number.isInteger(summaryCell.value(summaryCell.field('row')));
    }

    getStatsDetails(params): void {
        this._CashflowServiceProxy
            .getStatsDetails(params)
            .subscribe(result => {
                this.statsDetailResult = result;
            });
    }
}
