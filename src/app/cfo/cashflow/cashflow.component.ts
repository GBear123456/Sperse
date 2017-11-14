import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { GroupbyItem } from './models/groupbyItem';

import { CashflowServiceProxy, StatsFilter, BankAccountDto, CashFlowInitialData, StatsDetailFilter, TransactionStatsDto } from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { DxPivotGridComponent } from 'devextreme-angular';
import * as _ from 'underscore.string';
import * as underscore from 'underscore';
import * as moment from 'moment';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { FilterMultiselectDropDownComponent } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.component';
import { MultiselectDropDownElement } from '@shared/filters/multiselect-dropdown/multiselect-dropdown-element';

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
    cashflowData: any;
    cashflowDataTree: any;
    cashflowTypes: any;
    transactionCategories: any;
    expenseCategories: any;
    bankAccounts: any;
    dataSource: any;
    groupInterval: any = 'year';
    statsDetailFilter: StatsDetailFilter = new StatsDetailFilter();
    statsDetailResult: any;
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
            'historicalSelectionFunction': this.getQuarterHistoricalSelector.bind(this)
        },
        {
            'groupInterval': 'month',
            'optionText': this.l('Months').toUpperCase(),
            'customizeTextFunction': this.getMonthHeaderCustomizer,
            'historicalSelectionFunction': this.getMonthHistoricalSelector.bind(this)
        },
        {
          'groupInterval': 'day',
          'optionText': this.l('Days').toUpperCase(),
          'customizeTextFunction': this.getDateIntervalHeaderCustomizer.bind(this, 'day'),
          'historicalSelectionFunction': this.getDayHistoricalSelector.bind(this)
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
                return  value ? value.toUpperCase() : cellInfo.value;
            }
        },
        {
            caption: 'Group',
            width: 120,
            area: 'row',
            areaIndex: 1,
            dataField: 'transactionCategoryId',
            expanded: false,
            showTotals: true,
            customizeText: cellInfo => {
                let value = cellInfo.value;
                /** If the cell is int - then we have bank account as second level */
                if (Number.isInteger(cellInfo.value) && this.bankAccounts) {
                    value = this.bankAccounts.find( account => {
                        return account.id === cellInfo.value;
                    });
                    value = value ? value.accountName : cellInfo;
                } else {
                    value = this.transactionCategories[cellInfo.valueText] ?
                            this.transactionCategories[cellInfo.valueText] :
                            cellInfo.valueText;
                }
                return value ? value.toUpperCase() : cellInfo.value;
            },
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Subgroup',
            showTotals: false,
            area: 'row',
            areaIndex: 2,
            dataField: 'expenseCategoryId',
            customizeText: cellInfo => {
                let value = this.expenseCategories[cellInfo.valueText];
                return value ? value.toUpperCase() : cellInfo.valueText;
            }
        },
        {
            caption: 'Historical',
            area: 'column',
            showTotals: false,
            selector: this.groupbyItems[0].historicalSelectionFunction(),
            customizeText: this.getHistoricalCustomizer.bind(this)(),
            expanded: true,
            allowExpand: false
        },
        {
            caption: 'Amount',
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: 'currency',
            area: 'data',
            showColumnTotals: true,
            calculateSummaryValue: this.calculateSummaryValue()
        },
        {
            caption: 'Date',
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
            caption: 'Date',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            groupInterval: 'quarter',
            showTotals: false,
            customizeText: this.getQuarterHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Date',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Projected',
            area: 'column',
            showTotals: false,
            selector: function(data) {
                let date = new Date(data.date);
                let current = new Date();
                let result;
                if (current.getDate() > date.getDate()) {
                    result = 0;
                } else {
                    result = 1;
                }
                return result;
            },
            customizeText: cellInfo => {
                let projectedKey = cellInfo.value === 1 ? 'Projected' : 'Mtd';
                let cellValue = this.l(projectedKey).toUpperCase();
                let cssMarker = ' @css:{projectedField ' + (cellInfo.value === 1 ? 'projected' : 'mtd') + '}';
                return cellValue + cssMarker;
            },
            expanded: true,
            allowExpand: false
        },
        {
            caption: 'Date',
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
        this.l('Historical Cashflows - Current Year'),
        this.l('Current Period'),
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
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'accountIds',
                            caption: 'Account',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: 'Account',
                                    filterField: 'accountIds',
                                    displayElementExp: (item: BankAccountDto) => {
                                        if (item) {
                                            return item.accountName + ' (' + item.accountNumber + ')';
                                        }
                                    },
                                    dataSource: result.bankAccounts,
                                    columns: [{
                                        dataField: 'accountName',
                                        caption: this.l('CashflowAccountFilter_AccountName') },
                                        {
                                            dataField: 'accountNumber',
                                            caption: this.l('CashflowAccountFilter_AccountNumber')
                                        }
                                    ],
                                }
                            }
                        }
                    ]
                );

                this.loadGridDataSource();
            });

        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                this.requestFilter[filter.field] = filterMethod ? filterMethod(filter) : filter.value;
            }
            this.loadGridDataSource();
        });

        window['onHeaderExpanderClick'] = function($event) {
          let rect = $event.target.getBoundingClientRect();
          if (Math.abs($event.clientX - rect.x) < 10 &&
            Math.abs($event.clientY - rect.y) < 10
          ) $event.stopPropagation();
          $event.target.classList.toggle('closed');
        };
    }

    filterByAccount(filter: FilterMultiselectDropDownComponent) {
        if (filter.items && filter.items.acc && filter.items.acc.selectedElements) {
            return filter.items.acc.selectedElements.map(x => x.id);
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(false);
    }

    ngOnDestroy() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this._filtersService.enabled = false;
        this.rootComponent.overflowHidden();
    }

    loadGridDataSource() {
        abp.ui.setBusy();
        this._CashflowServiceProxy.getStats(this.requestFilter)
            .finally(() => abp.ui.clearBusy())
            .subscribe(result => {
                if (result.transactionStats.length) {
                    let transactions = result.transactionStats;
                    this.cashflowTypes = this.initialData.cashflowTypes;
                    this.expenseCategories = this.initialData.expenseCategories;
                    this.transactionCategories = this.initialData.transactionCategories;
                    this.bankAccounts = this.initialData.bankAccounts;
                    let cashflowDataCopy = [];
                    /** categories - object with categories */
                    this.cashflowData = transactions.map(function (transactionObj) {
                        if (transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation) {
                            transactionObj.transactionCategoryId = <any>transactionObj.accountId;
                        }
                        /** clone transaction to another array */
                        if (transactionObj.cashflowTypeId === Income || transactionObj.cashflowTypeId === Expense) {
                            let clonedTransaction = new TransactionStatsDto(transactionObj);
                            clonedTransaction.cashflowTypeId = Total;
                            clonedTransaction.transactionCategoryId = <any>clonedTransaction.accountId;
                            clonedTransaction.expenseCategoryId = null;
                            cashflowDataCopy.push(clonedTransaction);
                        }
                        return transactionObj;
                    });
                    /** Make a copy of cashflow data to display it in custom total group on the top level */
                    this.cashflowTypes[Total] = this.l('Ending Cash Position');
                    this.cashflowData = this.cashflowData.concat(cashflowDataCopy);
                    /** Get cashflow data tree to hide groups without children */
                    this.cashflowDataTree = this.getCashflowDataTree(
                        this.cashflowData,
                        this.apiTableFields.filter( field => {
                            return field.area === 'row';
                        })
                    );
                } else {
                    this.cashflowData = null;
                }
                this.dataSource = this.getApiDataSource();
            });
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
        data.forEach( cashflowItem => {
            let chainingArr = [];
            fields.forEach( (field) => {
                chainingArr.push(cashflowItem[field['dataField']]);
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
     * @param startedGroupInterval the groupInterval from wich we should start show headers
     */
    updateDateFields(startedGroupInterval) {
        let allDateIntervals = this.groupbyItems.map(group => group.groupInterval);
        let datesIntervalsToBeHide = allDateIntervals.slice(0, allDateIntervals.indexOf(startedGroupInterval));
        for (let dateInterval of allDateIntervals) {
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
            let intervalFieldsSelector = '.dateField:not(.dx-total).' + dateInterval;
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

    getMonthHistoricalSelector(): any {
        return data => {
            let result,
                currentDate = new Date(),
                itemDate = new Date(data.date),
                yearCompare = this.compareDateIntervals(currentDate, itemDate, 'year');
            /** if years not the same */
            if (yearCompare !== 1) {
                result = yearCompare;
            } else {
                result = this.compareDateIntervals(currentDate, itemDate, 'month');
            }
            return result;
        };
    }

    getDayHistoricalSelector(): any {
        return (data) => {
            let result,
                currentDate = new Date(),
                itemDate = new Date(data.date),
                yearCompare = this.compareDateIntervals(currentDate, itemDate, 'year');
            /** if years not the same */
            if (yearCompare !== 1) {
                result = yearCompare;
            } else {
                let monthCompare = this.compareDateIntervals(currentDate, itemDate, 'month');
                if (monthCompare !== 1) {
                    result = monthCompare;
                } else {
                    result = this.compareDateIntervals(currentDate, itemDate, 'day');
                }
            }
            return result;
        };
    }

    getQuarterHistoricalSelector(): any {
        return (data) => {
            let result = 0,
                currentDate = new Date(),
                itemDate = new Date(data.date),
                currentYear = currentDate.getFullYear(),
                itemYear = itemDate.getFullYear(),
                currentQuarter = this.getQuarter(currentDate),
                itemQuarter = this.getQuarter(itemDate),
                currentFullDate = currentYear.toString() + currentQuarter.toString(),
                itemFullDate = itemYear.toString() + itemQuarter.toString();
            if ( currentFullDate < itemFullDate ) {
                result = 2;
            } else if (currentFullDate === itemFullDate ) {
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
        const intervals2methods = {
            'year': 'getFullYear',
            'month': 'getMonth',
            'day': 'getDay'
        };
        let result = 0,
            currentYear = date1[intervals2methods[interval]](),
            itemYear = date2[intervals2methods[interval]]();
        if (currentYear < itemYear) {
            result = 2;
        } else if (currentYear === itemYear) {
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
    getDateFieldByInterval(dateInterval): any {
        return this.apiTableFields.find(
            field => field['groupInterval'] === dateInterval
        );
    }

    /**
     * Gets the historical field object in tableFields
     * @returns {Object}
     */
    getHistoricField(): Object {
        return this.apiTableFields.find(
            field => field['caption'] === 'Historical'
        );
    }

    changeGroupBy(event) {
        let startedGroupInterval = event.value.groupInterval;
        this.groupInterval = startedGroupInterval;
        this.updateDateFields(startedGroupInterval);
        /** Change historical field for different date intervals */
        let historical_field = this.getHistoricField();
        historical_field['selector'] = event.value.historicalSelectionFunction();
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
            (cellObj.cell.rowType === 'T' || cellObj.cell.rowPath.length === 1);
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

        /** headers manipulation (adding css classes and appending "Totals text") */
        if (e.area === 'column') {
            if (this.isCellContainsCssMarker(e)) {
                this.prepareCell(e);
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

        /** remove minus sign from negative values */
        // if (this.isDataCell(e) && !this.isGrandTotalDataCell(e) && !this.isStartingBalanceDataColumn(e)) {
        //     if (e.cell.value < 0) {
        //         e.cell.value = Math.abs(e.cell.value);
        //         e.cell.text = e.cell.text.replace('-', '');
        //         e.cellElement.text(e.cell.text);
        //     }
        // }

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
    prepareCell(cellObj) {
        /** get the css class from name */
        let valueWithoutCss = cellObj.cell.text.slice(0, (cellObj.cell.text.indexOf(this.cssMarker)));
        /** cut off the css from the cell text */
        let cssClass = this.cutCssFromValue(cellObj.cell.text);
        /** update the columns with the text without the marker */
        cellObj.cellElement.text(valueWithoutCss);
        /** Added "Total" text to the year and quarter headers */
        let fieldName = cssClass.slice(cssClass.indexOf(' ') + 1, cssClass.length).trim();
        if (fieldName === 'year' || fieldName === 'quarter') {
            let hideHead = cellObj.cellElement.hasClass('dx-pivotgrid-expanded') &&
              (fieldName === 'quarter' || cellObj.cellElement.parent().parent().children().length == 6);
            cellObj.cellElement.html('<div onclick="onHeaderExpanderClick(event)" class="head-cell-expand ' +
              (hideHead ? 'closed': '') + '">' + cellObj.cellElement.html() +
              '<div class="totals">' + this.l('Totals').toUpperCase() + '</div></div>');
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
            this.statsDetailFilter.accountIds = this.requestFilter.accountIds || [];
            this.statsDetailFilter.cashFlowTypeId = cellObj.cell.rowPath[0];
            if (this.statsDetailFilter.cashFlowTypeId == 'B') {
                this.statsDetailFilter.accountIds.push(cellObj.cell.rowPath[1]);
            } else {
                this.statsDetailFilter.transactionCategoryId = cellObj.cell.rowPath[1];
            }
            this.statsDetailFilter.expenseCategoryId = cellObj.cell.rowPath[2];
            this.statsDetailFilter.startDate = datePeriod.startDate;
            this.statsDetailFilter.endDate = datePeriod.endDate;
            this.getStatsDetails(this.statsDetailFilter);
        }
    }

    formattingDate(param = []) {
        let startDate: moment.Moment = moment.utc('1970-01-01');
        let endDate: moment.Moment = moment.utc('1970-01-01');
        let year = param[1];
        let quarter = param[2];
        let month = param[3];
        let day = param[5];

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
    hasChildsByPath(path, object) {
        let result = true;
        path.forEach( pathItem => {
            let keys = Object.keys(object[pathItem]);
            let firstKey = Object.keys(object[pathItem])[0];
            let firstSubKey = Object.keys(object[pathItem][firstKey])[0];

            if (object.hasOwnProperty(pathItem) &&
                keys.length !== 1 ||
                (keys.length === 1 && firstKey !== 'null')
            ) {
                object = object[pathItem];
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
                let prev = this.prev(arguments),
                    currentCell = this;
                while (counter > 0) {
                    if (prev === null) {
                        if (currentCell.parent('column')) {
                            prev = currentCell.parent('column').prev(arguments);
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
            sum = (summaryCell.value() || 0) + prevEndingAccountValue + (prevWithParent.value(true) || 0);

        return  sum || 0;
    }

    /**
     * Modify the value of the starting balance summary cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceSummaryCell(summaryCell, prevWithParent) {
        return (summaryCell.value() || 0) + (prevWithParent.slice(0, Total).value() || 0) + prevWithParent.value(true);
    }

    /**
     * Modify the ending balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyEndingBalanceAccountSummary(summaryCell, prevWithParent) {
        let startedBalanceAccountValue = this.getAccountValueFromAnotherPeriod(summaryCell, prevWithParent, StartedBalance);
        let sum = (summaryCell.value() || 0) + startedBalanceAccountValue;
        return sum || 0;
    }

    /**
     * Modify the total balance summary cell to have a proper calculation
     * @param summaryCell
     * @return {number}
     */
    modifyGrandTotalSummary(summaryCell) {
        return (summaryCell.value() || 0) + (summaryCell.slice(0, StartedBalance).value(true) || 0);
    }

    /**
     * Get the value from target period for account. For example if we have the cell of total that belongs to the account -
     * then we find the appropriate started balance account value for it
     * @param summaryCell
     * @param prev
     * @param target
     * @return {number}
     */
    /** @todo refactor this method */
    getAccountValueFromAnotherPeriod(summaryCell, prevWithParent, target) {
        let accountId = summaryCell.value(summaryCell.field('row'), true),
        subject = target === StartedBalance ? summaryCell : prevWithParent,
        anotherPeriodCell = subject.parent('row').slice(0, target),
        anotherPeriodAccount = anotherPeriodCell ? anotherPeriodCell.child('row', accountId) : null,
        anotherPeriodAccountCashedValue,
        isCalculatedValue = target === StartedBalance ? true : false,
        groupInterval = subject.field('column').groupInterval,
        columnValue = subject.value(subject.field('column')),
        parent = subject.parent(),
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
        while (parent.field('column') && parent.field('column').dataType === 'date') {
            let parentGroupInterval = parent.field('column').groupInterval,
                parentColumnValue = parent.value(parent.field('column'));
            cellData[parentGroupInterval] = parentColumnValue;
            parent = parent.parent();
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
        /** {cashflowTypeId: "T", accountId: 10, quarter: 3, year: 2015, month: 5} */
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
            summaryCell.field('row').dataField === 'transactionCategoryId' &&
            summaryCell.parent() && summaryCell.parent().value(summaryCell.parent('row').field('row')) === StartedBalance &&
            Number.isInteger(summaryCell.value(summaryCell.field('row')));
    }

    isEndingBalanceAccountSummary(summaryCell) {
        return summaryCell.field('row') !== null &&
            summaryCell.field('row').dataField === 'transactionCategoryId' &&
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
