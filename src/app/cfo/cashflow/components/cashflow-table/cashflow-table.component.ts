import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { CashflowService } from '../../services/cashflow.service';
import { Operation } from '../../models/operation';
import { GroupbyItem } from '../../models/groupbyItem';
//import { DxPivotGridComponent } from '@extended_modules/devextreme-angular/ui/pivot-grid';
import { CashflowServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-cashflow-table',
    templateUrl: './cashflow-table.component.html',
    styleUrls: ['./cashflow-table.component.less'],
    providers: [ CashflowService, CashflowServiceProxy ]
})

export class CashflowTableComponent extends AppComponentBase implements OnInit {
    cashflowService: CashflowService;
    /** @todo change for Operation model */
    cashflowData: any/*Operation[]*/;
    adjustments: any/*Operation[]*/;
    dataSource: any;
    groupInterval: any = 'year';
    /** posible groupIntervals year, quarter, month, dayofweek, day */
    groupbyItems: GroupbyItem[] = [
        {
            'groupInterval': 'year',
            'optionText': 'YEARS',
            'customizeTextFunction': this.getYearHeaderCustomizer,
            'historicalSelectionFunction': this.getYearHistoricalSelector,
            'historicalCustomizerFunction': this.getYearHistoricalCustomizer
        },
        {
            'groupInterval': 'quarter',
            'optionText': 'QUARTERS',
            'customizeTextFunction': this.getQuarterHeaderCustomizer,
            'historicalSelectionFunction': this.getQuarterHistoricalSelector,
            'historicalCustomizerFunction': this.getQuarterHistoricalCustomizer,
            'compareYears': this.compareYears,
            'compareQuarters': this.compareQuarters,
            'compareMonths': this.compareMonths,
            'getQuarter': this.getQuarter
        },
        {
            'groupInterval': 'month',
            'optionText': 'MONTHS',
            'customizeTextFunction': this.getMonthHeaderCustomizer,
            'historicalSelectionFunction': this.getMonthHistoricalSelector,
            'historicalCustomizerFunction': this.getMonthHistoricalCustomizer,
            'compareYears': this.compareYears,
            'compareQuarters': this.compareQuarters,
            'compareMonths': this.compareMonths,
            'getQuarter': this.getQuarter
        },
        /** @todo implement week functionality that is not posible in pivot grid by default */
        // {
        //   'groupInterval': 'dayOfWeek',
        //   'optionText': 'WEEKS',
        //   'customizeTextFunction': this.getWeekHeaderCustomizer,
        //   'historicalSelectionFunction': this.getWeekHistoricalSelector,
        //   'historicalCustomizerFunction': this.getWeekHistoricalCustomizer
        // },
        /** @todo implement the day interval in short long future */
        {
          'groupInterval': 'day',
          'optionText': 'DAYS',
          'customizeTextFunction': this.getDayHeaderCustomizer,
          'historicalSelectionFunction': this.getDayHistoricalSelector,
          'historicalCustomizerFunction': this.getDayHistoricalCustomizer,
          'compareYears': this.compareYears,
          'compareMonths': this.compareMonths,
          'compareDays': this.compareDays,
        }
    ];
    tableFields: any = [
        {
            caption: 'Cash Starting Balances',
            area: 'row',
            areaIndex: 0,
            width: 120,
            showTotals: false,
            expanded: true,
            // isMeasure: false,
            // allowExpand: false,
            dataField: 'startingBalance',
            // dataType: 'string',
            customizeText: function () {
                return 'CASH STARTING BALANCES';
            }
        },
        {
            caption: 'Type',
            width: 120,
            area: 'row',
            areaIndex: 0,
            expanded: true,
            allowExpandAll: false,
            allowExpand: false,
            dataField: 'type',
            rowHeaderLayout: 'tree',
            showTotals: true,
            /** @todo find out how to remove total from the total field */
            customizeText: function (cellInfo) {
                return cellInfo.valueText === '0' ? 'TOTAL CASH INFLOWS' : 'TOTAL CASH OURFLOWS';
            },
            selector: function (data) {
                return data.type === 'income' ? 0 : 1;
            }
        },
        {
            caption: 'Group',
            width: 120,
            area: 'row',
            areaIndex: 1,
            dataField: 'group',
            expanded: false,
            showTotals: true,
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Subgroup',
            width: 120,
            showTotals: false,
            area: 'row',
            areaIndex: 2,
            dataField: 'subgroup',
            rowHeaderLayout: 'tree'
        },
        {
            // caption: 'Name',
            width: 120,
            area: 'row',
            areaIndex: 3,
            showTotals: false,
            dataField: 'name',
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Historical',
            area: 'column',
            showTotals: false,
            selector: this.groupbyItems[0].historicalSelectionFunction(),
            customizeText: this.groupbyItems[0].historicalCustomizerFunction(),
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
            calculateSummaryValue: function (summaryCell) {
                /** changed the ending cash position result using internal devexpress methods to calculate the
                 *  ending balances with the accounting of the starting balances
                 */
                /** check if current cell is the grand total cell */
                let field = summaryCell.field('row', true);
                /** if field === null - then it is the grand total row and if dataField is a - it starting balance row
                 *  that we alse need to calculate */

                let prevSummaryCell = summaryCell.prev('column', true);

                /** @todo find out why allowCrossGroup is not working */
                if ((field === null || field.dataField === 'startingBalance') && prevSummaryCell === null) {
                    // let parent = summaryCell.parent('column');
                    // /** check the previous value of the parent */
                    // while (parent !== null) {
                    //     prevSummaryCell = parent.prev('column', true);
                    //     if (prevSummaryCell !== null) {
                    //         break;
                    //     } else {
                    //         parent = summaryCell.parent('column');
                    //     }
                    // }
                }

                if ((field === null || field.dataField === 'startingBalance') && prevSummaryCell !== null) {

                    let sum = summaryCell.value();
                    sum += prevSummaryCell.value();
                    /** add all previous grand totals cells values and redefine the previous cell */
                    while (prevSummaryCell.prev('column', true) !== null) {
                        sum += prevSummaryCell.prev('column', true).value();
                        prevSummaryCell = prevSummaryCell.prev('column', true);
                    }
                    //return sum;
                }
                return summaryCell.value();
            }
        },
        {
            caption: 'Date',
            dataField: 'date',
            dataType: 'date',
            area: 'column',
            groupInterval: 'year',
            showTotals: false,
            customizeText: this.getYearHeaderCustomizer(),
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
            selector: function (data) {
                const date = new Date(data.date);
                const current = new Date();
                let result;
                // if (date.getMonth() + date.getFullYear() === current.getMonth() + current.getFullYear()) {
                if (current.getDate() > date.getDate()) {
                    result = 0;
                } else {
                    result = 1;
                }
                // }
                return result;
            },
            customizeText: function (cellInfo) {
                const cellValue = (cellInfo.value === 1 ? 'PROJECTED' : 'MTD');
                const cssMarker = ' @css:{projectedField ' + (cellInfo.value === 1 ? 'projected' : 'mtd') + '}';
                return cellValue + cssMarker;
            },
            expanded: true,
            allowExpand: false
        },
        /** @todo implement the week interval in the long future */
        // {
        //   caption: 'Date',
        //   dataField: 'date',
        //   dataType: 'date',
        //   area: 'column',
        //   groupInterval: 'dayOfWeek',
        //   customizeText: this.getWeekHeaderCustomizer(),
        //   visible: true
        // },
        /** @todo implement the day interval in short long future */
        {
          caption: 'Date',
          dataField: 'date',
          dataType: 'date',
          area: 'column',
          groupInterval: 'day',
          customizeText: this.getDayHeaderCustomizer(),
          visible: true
        }
    ];
    cssClasses: any = {
        'historical': {
            'groupClass': 'historicalField',
            'specificClasses': [
                'historical',
                'current',
                'forecast'
            ]
        },
        'date': {
            'groupClass': 'dateField',
            'specificClasses': [
                'year',
                'quarter',
                'month'
            ]
        },
        'projected': {
            'groupClass': 'dateField',
            'specificClasses': [
                'mtd',
                'projected'
            ]
        }
    };
    cssMarker = ' @css';

    constructor(injector: Injector, CashflowService: CashflowService, private _CashflowServiceProxy: CashflowServiceProxy) {
        super(injector);
        // this.updateDateFields('year');
        this.cashflowService = CashflowService;
        /** @todo change default currency for dynamic value (and start and end dates) */
        let now = new Date();
        let lastTwoYearsDate = new Date(now.setFullYear(now.getFullYear() - 2));
        console.log('lastTwoYearsDate: ', lastTwoYearsDate);
        //debugger;
        // this._transactionsService.getStats(moment(lastTwoYearsDate.toString()), moment(now.toString()), 'USD').subscribe(result => {
        //     let transactions = result.transactionStats;
        //     let categories = result.categories;
        //     let adjustments = result.adjustments;
        //     console.time('geting categories');
        //     /** categoris - object with categories */
        //     // this.cashflowData = transactions.map(function(transactionObj){
        //     //     return Object.assign(transactionObj, categories[transactionObj.categoryId]);
        //     // });
        //     /** categories - array of objects */
        //     this.cashflowData = transactions.map(function(transactionObj){
        //         let category = categories.filter(function(category){
        //             return category.id == transactionObj.categoryId;
        //         });
        //         console.log(category);
        //         return Object.assign(transactionObj, category[0]);
        //     });
        //     console.timeEnd('geting categories');
        //     // this.dataSource = {
        //     //     fields: this.tableFields,
        //     //     store: this.cashflowData
        //     // };
        // });
        this.dataSource = this.getDataSource();
    }

    ngOnInit() {
    }

    getDataSource() {
        return {
            fields: this.tableFields,
            //store: this._CashflowServiceProxy.getStats()
            store: this.cashflowService.getOperations()
        };
    }

    /**
     * return the array of dates intervals that should be hidden
     * @param startedGroupInterval
     */
    getFieldsToBeHide(startedGroupInterval) {
        const datesIntervalsToBeHide = this.groupbyItems.map(group => group.groupInterval);
        /** update date fields for table */
        let startedIntervalAdded = false;
        for (const group_by_item of this.groupbyItems) {
            const intervalField = this.getDateFieldByInterval(group_by_item['groupInterval']);
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
        const allDateIntervals = this.groupbyItems.map(group => group.groupInterval);
        const datesIntervalsToBeHide = allDateIntervals.slice(0, allDateIntervals.indexOf(startedGroupInterval));
        for (const dateInterval of allDateIntervals) {
            const intervalField = this.getDateFieldByInterval(dateInterval);
            intervalField.expanded = false;
        }
        for (const dateInterval of datesIntervalsToBeHide) {
            const intervalField = this.getDateFieldByInterval(dateInterval);
            intervalField.expanded = true;
        }
    }

    /**
     * Event that happens when the content renders
     * @param event
     */
    onContentReady(event) {
        const allDateIntervals = this.groupbyItems.map(group => group.groupInterval);
        const datesIntervalsToBeHide = allDateIntervals.slice(0, allDateIntervals.indexOf(this.groupInterval));
        for (const dateInterval of datesIntervalsToBeHide) {
            /** Hide the fields that are not chosen */
            const intervalFieldsSelector = '.dateField:not(.dx-total).' + dateInterval;
            // $(intervalFieldsSelector).each(function(){
            //     $(this).text('');
            //     $(this).addClass('dataFieldHidden');
            // });
        }

        /** crutch for moving the income and expenses rows to bottom instead of top */
        /** calculate the amount of the subgroups for incomes and expenses */
        // let amountOfIncomeSubgroups = this.calculateElementsBetween(
        //     '.dx-pivotgrid-vertical-headers .incomeRow',
        //     '.dx-pivotgrid-vertical-headers .expensesRow'
        // );
        // let amountOfExpenseSubgroups = this.calculateElementsBetween(
        //     '.dx-pivotgrid-vertical-headers .expensesRow',
        //     '.dx-pivotgrid-vertical-headers .reconciliation') - 1;

        // let incomeLabel = $('.dx-pivotgrid-vertical-headers .incomeRow');
        // let expensesLabel = $('.dx-pivotgrid-vertical-headers .expensesRow');
        // let incomeRowspan = incomeLabel.find('tr').first().attr('rowspan');
        // incomeLabel.find('tr').first().attr('rowspan', incomeRowspan + 1);
        // let newIncomeRow = expensesLabel.prev().clone().text(incomeLabel.find('span').text());
        // expensesLabel.before(newIncomeRow);

        // this.changeColspanUntil(
        //     '.dx-pivotgrid-vertical-headers .incomeRow',
        //     '.dx-pivotgrid-vertical-headers .expensesRow'
        // );
        //
        // $('.dx-pivotgrid-vertical-headers .expensesRow').before($('.dx-pivotgrid-vertical-headers .incomeRow').clone());
        //
        //
        // $('.expensesRow').each(function(){
        //
        // });
    }

    changeColspanUntil(selector1, selector2) {
        let elementsBetween = $(selector1).nextUntil(selector2);
        elementsBetween.each(function(){
            $(this).find('.dx-last-cell').attr('colspan', 2);
        });
    }

    calculateElementsBetween(selector1, selector2) {
        return $(selector1).nextUntil(selector2).length;
    }

    /**
     * @returns {function(any): string}
     */
    getYearHeaderCustomizer() {
        return function (cellInfo) {
            /** @todo find out how to inject the this.cssMarker instead of hardcoded ' @css' */
            return cellInfo.value + ' @css:{dateField year}';
        };
    }

    getYearHistoricalCustomizer() {
        return function (cellInfo) {
            const yearPeriods = [
                'Historical Cashflows - Prior Years',
                'Current',
                'Cashflow - Forecast',
            ];
            const cssClasses = [
                'historical',
                'current',
                'forecast'
            ];
            return yearPeriods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
        };
    }

    getMonthHistoricalCustomizer() {
        return function (cellInfo) {
            const month_periods = [
                'Historical Cashflows - Current Year',
                'Current Period',
                'Cashflow - Forecast'
            ];
            const cssClasses = [
                'historical',
                'current',
                'forecast'
            ];
            /** @todo find out how to inject the this.cssMarker instead of hardcoded ' @css' */
            return month_periods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
        };
    }

    getWeekHistoricalCustomizer() {
        return function (cellInfo) {
            const weekPeriods = [
                'Historical Cashflows - Current Year',
                'Current Period',
                'Cashflow - Forecast'
            ];
            const cssClasses = [
                'historical',
                'current',
                'forecast'
            ];
            return weekPeriods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
        };
    };

    getDayHistoricalCustomizer() {
        return function (cellInfo) {
            const month_periods = [
                'Historical Cashflows - Current Year',
                'Current Period',
                'Cashflow - Forecast'
            ];
            const cssClasses = [
                'historical',
                'current',
                'forecast'
            ];
            /** @todo find out how to inject the this.cssMarker instead of hardcoded ' @css' */
            return month_periods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
        };
    }

    getYearHistoricalSelector(): any {
        return function (data) {
            const currentYear = new Date().getFullYear();
            const itemYear = new Date(data.date).getFullYear();
            // let result = 0;
            // if (currentYear < itemYear) {
            //     result = 2;
            // } else if (currentYear === itemYear) {
            //     result = 1;
            // }
            // return result;
            return currentYear < itemYear ? 1 : 0;
        };
    }

    getMonthHistoricalSelector(): any {
        // return function(data) {
        //     const currentMonth = new Date().getMonth();
        //     const itemMonth = new Date(data.date).getMonth();
        //     let result;
        //     if (currentMonth < itemMonth) {
        //         result = 2;
        //     } else if (currentMonth === itemMonth) {
        //         result = 1;
        //     } else {
        //         result = 0;
        //     }
        //     return result;
        // };
        return (data) => {
            let result;
            const currentDate = new Date();
            const itemDate = new Date(data.date);
            const yearCompare = this.compareYears(currentDate, itemDate);
            /** if years not the same */
            if (yearCompare !== 1) {
                result = yearCompare;
            } else {
                result = this.compareMonths(currentDate, itemDate);
            }
            return result;
        };
    }

    getWeekHistoricalSelector(): any {
        return function (data) {
            const currentWeek = new Date().getDay();
            const itemWeek = new Date(data.date).getDay();
            let result;
            if (currentWeek < itemWeek) {
                result = 2;
            } else if (currentWeek === itemWeek) {
                result = 1;
            } else {
                result = 0;
            }
            return result;
        };
    }

    getDayHistoricalSelector(): any {
        return (data) => {
            let result;
            const currentDate = new Date();
            const itemDate = new Date(data.date);
            const yearCompare = this.compareYears(currentDate, itemDate);
            /** if years not the same */
            if (yearCompare !== 1) {
                result = yearCompare;
            } else {
                let monthCompare = this.compareMonths(currentDate, itemDate);
                if (monthCompare !== 1) {
                    result = monthCompare;
                } else {
                    result = this.compareDays(currentDate, itemDate);
                }
            }
            return result;
        };
    }

    /**
     * @returns string - the text of the header and the mark for the cellPrepared
     * function with css classes that should be defined to fields
     */
    getQuarterHistoricalCustomizer() {
        return function (cellInfo) {
            const quarters_periods = [
                'Historical Cashflows - Current Year',
                'Current Period',
                'Cashflow - Forecast'
            ];
            const cssClasses = [
                'historical',
                'current',
                'forecast'
            ];
            return quarters_periods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
        };
    }

    getQuarterHistoricalSelector(): any {
        // return function(data) {
        //     function getQuarter(date) {
        //         date = date || new Date(); // If no date supplied, use today
        //         const quartersArr = [1, 2, 3, 4];
        //         return quartersArr[Math.floor(date.getMonth() / 3)];
        //     }
        //     const current_quarter = getQuarter(new Date());
        //     const item_quarter = getQuarter(new Date(data.date));
        //     let result;
        //     if (current_quarter < item_quarter) {
        //         result = 2;
        //     } else if (current_quarter === item_quarter) {
        //         result = 1;
        //     } else {
        //         result = 0;
        //     }
        //     return result;
        // };
        return (data) => {
            let result = 0;
            const currentDate = new Date();
            const itemDate = new Date(data.date);
            const currentYear = currentDate.getFullYear();
            const itemYear = itemDate.getFullYear();
            const currentQuarter = this.getQuarter(currentDate);
            const itemQuarter = this.getQuarter(itemDate);
            const currentFullDate = currentYear.toString() + currentQuarter.toString();
            const itemFullDate = itemYear.toString() + itemQuarter.toString();
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
    getQuarter(date) {
        date = date || new Date(); // If no date supplied, use today
        const quartersArr = [1, 2, 3, 4];
        return quartersArr[Math.floor(date.getMonth() / 3)];
    }
    /**
     * Compares two years of two dates
     * @param date1
     * @param date2
     * @returns {number}
     */
    compareYears(date1, date2) {
        let result = 0;
        const currentYear = date1.getFullYear();
        const itemYear = date2.getFullYear();
        if (currentYear < itemYear) {
            result = 2;
        } else if (currentYear === itemYear) {
            result = 1;
        }
        return result;
    }

    /**
     * Compares the quarters of the dates
     * @param date1
     * @param date2
     * @returns {number}
     */
    compareQuarters(date1, date2) {
        let result = 0;
        const currentQuarter = this.getQuarter(date1);
        const itemQuarter = this.getQuarter(date2);
        if (currentQuarter > itemQuarter) {
            result = 2;
        } else if (currentQuarter === itemQuarter) {
            result = 1;
        }
        return result;
    }

    /**
     * Compares the months of the dates
     * @param date1
     * @param date2
     * @returns {number}
     */
    compareMonths(date1, date2) {
        let result = 0;
        const currentMonth = date1.getMonth();
        const itemMonth = date2.getMonth();
        if (currentMonth < itemMonth) {
            result = 2;
        } else if (currentMonth === itemMonth) {
            result = 1;
        }
        return result;
    }

    /**
     * Compares the days of the dates
     * @param date1
     * @param date2
     * @returns {number}
     */
    compareDays(date1, date2) {
        let result = 0;
        const currentMonth = date1.getDate();
        const itemMonth = date2.getDate();
        if (currentMonth < itemMonth) {
            result = 2;
        } else if (currentMonth === itemMonth) {
            result = 1;
        }
        return result;
    }

    /**
     * Gets the text for quarters header
     * @returns {string}
     */
    getQuarterHeaderCustomizer(): any {
        return function (cellInfo) {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField quarter}';
        };
    }

    /**
     * Gets the text for months header
     * @returns {string}
     */
    getMonthHeaderCustomizer(): any {
        return function (cellInfo) {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField month}';
        };
    }

    /**
     * Gets the text for weeks header
     * @returns {string}
     */
    getWeekHeaderCustomizer(): any {
        return function (cellInfo) {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField week}';
        };
    }

    /**
     * Gets the text for days header
     * @returns string
     */
    getDayHeaderCustomizer(): any {
        return function (cellInfo) {
            return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField day}';
        };
    }

    /**
     * Gets the field in tableFields by dateInterval (year, quarter, month or day)
     * @returns {Object}
     */
    getDateFieldByInterval(dateInterval): any {
        return this.tableFields.find(
            field => field['groupInterval'] === dateInterval
        );
    }

    /**
     * Gets the historical field object in tableFields
     * @returns {Object}
     */
    getHistoricField(): Object {
        return this.tableFields.find(
            field => field['caption'] === 'Historical'
        );
    }

    changeGroupBy(event) {
        const startedGroupInterval = event.value.groupInterval;
        this.groupInterval = startedGroupInterval;
        this.updateDateFields(startedGroupInterval);
        /** Change historical field for different date intervals */
        const historical_field = this.getHistoricField();
        historical_field['selector'] = event.value.historicalSelectionFunction();
        historical_field['customizeText'] = event.value.historicalCustomizerFunction();
        this.dataSource = this.getDataSource();
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
        return cellObj.area === 'row' && cellObj.cell.type === 'T' && cellObj.cell.path.length === 1;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isStartingBalanceDataColumn(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined && cellObj.cell.rowPath.length === 1;
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesHeaderCell(cellObj) {
        return cellObj.area === 'row' && cellObj.cell.type === 'T' && cellObj.cell.path.length === 2;
    }

    /**
     * whether or not the cell is income or expenses data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesDataCell(cellObj) {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined && cellObj.cell.rowPath.length === 2;
    }

    /**
     * whether or not the cell is grand total label cell
     * @param cellObj
     * @returns {boolean}
     */
    isGrandTotalLabelCell(cellObj) {
        return cellObj.cell.type === 'GT';
    }
    /**
     * whether or not the cell is grand total data cell
     * @param cellObj
     * @returns {boolean}
     */
    isGrandTotalDataCell(cellObj) {
        return cellObj.cell.rowType === 'GT';
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
            const cssClass = 'startedBalance';
            e.cellElement.addClass(cssClass);
            /** disable collapsing for start balance column */
            e.cellElement.click(function (event) {
                event.stopImmediatePropagation();
            });
            /** move the row for started balance to the right to get proper view of started balances */
            if (this.isStartingBalanceDataColumn(e)) {
                /** clone the first cell with zero value */
                if (e.columnIndex === 0) {
                    /** clone the cell */
                    const clonedCellElement = e.cellElement.clone();
                    clonedCellElement.find('span').text('$0.00');
                    e.cellElement.before(clonedCellElement);
                }
            }
        }
        /** added css class to the income and outcomes columns */

        if ((this.isIncomeOrExpensesHeaderCell(e)) ||
            (this.isIncomeOrExpensesDataCell(e))) {
            let isDataCell = this.isIncomeOrExpensesDataCell(e);
            let pathProp = isDataCell ? 'rowPath' : 'path';
            const cssClass = (e.cell[pathProp] !== undefined && e.cell[pathProp][1] === 0)  ? 'income' : 'expenses';
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
            /** @todo exclude disabling for current month */
            if (this.isHistoricalCell(e)) {
                /** disable collapsing for historical columns */
                e.cellElement.click(function (event) {
                    event.stopImmediatePropagation();
                });
            }
        }
        /** @todo change logic for reconciliation */
        /** added reconciliation rows to the table */
        if (this.isGrandTotalLabelCell(e)) {
            this.createReconsiliationLabelCell(e);
        }

        /** added reconciliation and starting balances rows to the table data cells */
        if (this.isDataCell(e) && this.isGrandTotalDataCell(e)) {
            /** if the reconciliations and starting balances rows haven't already added */
            if (e.cellElement.parent().is(':last-child')) {
                this.createReconciliationDataRow(e);
            }
        }

        /** remove minus sign from negative values */
        if (this.isDataCell(e) && !this.isGrandTotalDataCell(e)) {
            if (e.cell.value < 0) {
                e.cell.value = Math.abs(e.cell.value);
                e.cell.text = e.cell.text.replace('-', '');
                e.cellElement.text(e.cell.text);
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
    //
    /**
     * remove css from the cell text, add css as a class, and add the totals text for the fields
     * if it is year or quarter cells
     * @param cellObj
     */
    prepareCell(cellObj) {

        /** get the css class from name */
        const valueWithoutCss = cellObj.cell.text.slice(0, (cellObj.cell.text.indexOf(this.cssMarker)));
        /** cut off the css from the cell text */
        const cssClass = this.cutCssFromValue(cellObj.cell.text);
        /** update the columns with the text without the marker */
        cellObj.cellElement.text(valueWithoutCss);
        /** Added "Total" text to the year and quarter headers */
        const groupName = cssClass.slice(0, cssClass.indexOf(' ')).trim();
        const fieldName = cssClass.slice(cssClass.indexOf(' ') + 1, cssClass.length).trim();
        if (fieldName === 'year' || fieldName === 'quarter') {
            cellObj.cellElement.append('<div class="totals">TOTALS</div>');
        }

        cellObj.cellElement.addClass(cssClass);
        /** hide projected field for not current months for mdk and projected */
        if (groupName === 'projectedField') {
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
        let today = new Date();
        let currentMonth = today.getMonth() + 1;
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
        const clonedRow = cellObj.cellElement.parent().clone();
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
        const clonedRow = cellObj.cellElement.parent().clone();
        /** for each child change the text, remove grand total class and add reconciliation class */
        clonedRow.addClass('reconciliation');
        clonedRow.children('td').each(function(){
            $(this).text('$0.00');
            $(this).removeClass('dx-grandtotal');
        });
        cellObj.cellElement.parent().after(clonedRow);
    }

    onCellClick(event) {
        //debugger;
    }
}
