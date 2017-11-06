import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { GroupbyItem } from './models/groupbyItem';

import { CashflowServiceProxy, StatsFilter, BankAccountDto, CashFlowInitialData, StatsDetailFilter } from '@shared/service-proxies/service-proxies';

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
    cashflowTypes: any;
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

    leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
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
                return  this.cashflowTypes[cellInfo.valueText].toUpperCase();
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
                    }).accountName;
                }
                return value.toUpperCase();
            },
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Subgroup',
            showTotals: false,
            area: 'row',
            areaIndex: 2,
            dataField: 'expenseCategoryId'
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
    private expandedFieldObj;
    private updateUncollapsedCells = false;
    private emptyCellsObjects = [];

    private initialData: CashFlowInitialData;

    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;
    private requestFilter: StatsFilter;

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
    }

    filterByAccount(filter: FilterMultiselectDropDownComponent) {
        if (filter.items && filter.items.acc && filter.items.acc.selectedElements) {
            return filter.items.acc.selectedElements.map(x => x.id);
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
        this._CashflowServiceProxy.getStats(this.requestFilter)
            .finally(() => abp.ui.clearBusy())
            .subscribe(result => {
                if (result.transactionStats.length) {
                    let transactions = result.transactionStats;
                    this.cashflowTypes = this.initialData.cashflowTypes;
                    let expenseCategories = this.initialData.expenseCategories;
                    let transactionCategories = this.initialData.transactionCategories;
                    this.bankAccounts = this.initialData.bankAccounts;
                    /** categories - object with categories */
                    this.cashflowData = transactions.map(function (transactionObj) {
                        transactionObj.expenseCategoryId = expenseCategories[transactionObj.expenseCategoryId];
                        transactionObj.transactionCategoryId = transactionCategories[transactionObj.transactionCategoryId];
                        if (transactionObj.cashflowTypeId === StartedBalance) {
                            transactionObj.transactionCategoryId = <any>transactionObj.accountId;
                        }
                        return transactionObj;
                    });
                } else {
                    this.cashflowData = null;
                }
                this.dataSource = this.getApiDataSource();
            });
    }

    refreshDataGrid() {
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

        /** Get the groupBy element and append the dx-area-description-cell with it */
        $('.groupBy').appendTo(event.element.find('.dx-area-description-cell'));

    }

    findChildrenByPath(data, path) {
        if (data) {
            /** clone the original path to not override it */
            let clonedPath = path.slice();
            while (clonedPath.length) {
                if (data) {
                    let pathShift = clonedPath.shift();
                    data = data.filter( item => {
                        return item.value === pathShift;
                    });
                    data = data[0].children;
                } else {
                    break;
                }
            }
            return data;
        }
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
               cellObj.cell.path[0] === StartedBalance;
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
        if (this.isStartingBalanceHeaderColumn(e) ||
            this.isStartingBalanceDataColumn(e)) {
            let cssClass = 'startedBalance';
            e.cellElement.parent().addClass(cssClass);
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
        /** @todo change logic for reconciliation */
        /** added reconciliation rows to the table */
        if (this.isGrandTotalLabelCell(e) && this.cashflowData && this.cashflowData.length) {
            this.createReconsiliationLabelCell(e);
        }

        /** added reconciliation and starting balances rows to the table data cells */
        if (this.isDataCell(e) && this.isGrandTotalDataCell(e) && this.cashflowData && this.cashflowData.length) {
            /** if the reconciliations and starting balances rows haven't already added */
            if (e.cellElement.parent().is(':last-child')) {
                this.createReconciliationDataRow(e);
            }
        }

        /** remove minus sign from negative values */
        if (this.isDataCell(e) && !this.isGrandTotalDataCell(e) && !this.isStartingBalanceDataColumn(e)) {
            if (e.cell.value < 0) {
                e.cell.value = Math.abs(e.cell.value);
                e.cell.text = e.cell.text.replace('-', '');
                e.cellElement.text(e.cell.text);
            }
        }

        /** disable expanding and hide the plus button of the elements that has no children */
        if (e.area === 'row' && e.cell.path &&
            e.cell.path.length !== e.component.getDataSource().getAreaFields('row').length) {
            if (!this.hasChildsByPath(e.cell.path, e.component.getDataSource().getAreaFields('row'))) {
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
            cellObj.cellElement.append('<div class="totals">' + this.l('Totals').toUpperCase() + '</div>');
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
     * Creates the reconciliation label it the left side
     * @param cellObj
     */
    createReconsiliationLabelCell(cellObj) {
        /** clone current row */
        let clonedRow = cellObj.cellElement.parent().clone();
        /** added the css class to the current row */
        clonedRow.find('td').removeClass('dx-grandtotal');
        clonedRow.addClass('reconciliation');
        /** find the span inside and change the text to the reconciliation */
        clonedRow.find('span').text('Reconciliation Differences');
        /** append the grand total row with the new created reconciliation row to match the mock up */
        cellObj.cellElement.parent().after(clonedRow);
    }

    /**
     * Create the reconciliation row
     * @param cellObj
     */
    createReconciliationDataRow(cellObj) {
        /** clone current row for reconciliation */
        let clonedRow = cellObj.cellElement.parent().clone();
        /** for each child change the text, remove grand total class and add reconciliation class */
        clonedRow.addClass('reconciliation');
        clonedRow.children('td').each(function(){
            $(this).text('$0.00');
            $(this).removeClass('dx-grandtotal');
        });
        cellObj.cellElement.parent().after(clonedRow);
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
        /** 1 - mark the column to check in onContentReady */
        if (cellObj.area === 'row' && cellObj.cell.path.length > 1) {
            this.expandedFieldObj = cellObj;
        }

        this.getStatsDetails();
    }

    /**
     * Find if the group has childs by path and fields list
     * @param path
     * @param fields
     * @return {any}
     */
    hasChildsByPath(path, fields) {
        let filterArr = {};
        path.forEach( (pathItem, key) => {
            filterArr[fields[key]['dataField']] = pathItem;
        });
        let filteredData = underscore.where(this.cashflowData, filterArr);

        let result = filteredData.some( element => {
            return element[fields[path.length]['dataField']];
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
            /** if the value is a balance value or grand total value -
             *  then get the prev columns grand total for the column and add */
            if (summaryCell.field('row') === null  || (summaryCell.field('row') &&
                    summaryCell.field('row').caption === 'Type' &&
                    summaryCell.value(summaryCell.field('row')) === StartedBalance)) {
                if (prevWithParent) {
                    let currentValue = summaryCell.value() || 0;
                    let sum = currentValue;
                    while (prevWithParent !== null) {
                        sum += prevWithParent.grandTotal('row').value();
                        prevWithParent = prevWithParent.prevWithParent('column', true);
                    }
                    return sum;
                }
            }
            return summaryCell.value() || 0;
        };
    }

    getStatsDetails(): void {
        this._CashflowServiceProxy
            .getStatsDetails(this.statsDetailFilter)
            .subscribe(result => {
                this.statsDetailResult = result;
            });
    }
}
