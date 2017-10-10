import { Component, OnInit, ViewChild } from '@angular/core';
import { CashflowService } from '../../services/cashflow.service';
import { Operation } from '../../models/operation';
import { GroupbyItem } from '../../models/groupbyItem';
import { DxPivotGridComponent } from 'devextreme-angular';

@Component({
  selector: 'app-cashflow-table',
  templateUrl: './cashflow-table.component.html',
  styleUrls: ['./cashflow-table.component.less'],
  providers: [ CashflowService ]
})
export class CashflowTableComponent implements OnInit {

  /** @todo find out why self is window */
  self = this;
  cashflowService: CashflowService;
  operations: Operation[];
  operationsSource: any;
  groupInterval: string;
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
      'historicalCustomizerFunction': this.getQuarterHistoricalCustomizer
    },
    {
      'groupInterval': 'month',
      'optionText': 'MONTHS',
      'customizeTextFunction': this.getMonthHeaderCustomizer,
      'historicalSelectionFunction': this.getMonthHistoricalSelector,
      'historicalCustomizerFunction': this.getMonthHistoricalCustomizer
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
    /*{
      'groupInterval': 'day',
      'optionText': 'DAYS',
      'customizeTextFunction': this.getDayHeaderCustomizer,
      'historicalSelectionFunction': this.getDayHistoricalSelector,
      'historicalCustomizerFunction': this.getDayHistoricalCustomizer
    }*/
  ];
  tableFields: any = [
    {
      caption: 'Cash Starting Balances',
      area: 'row',
      showTotals: true,
      expanded: true,
      isMeasure: false,
      allowExpand: false,
      dataType: 'string',
      customizeText: function() {
        return 'CASH STARTING BALANCES';
      }
    },
    {
      caption: 'Type',
      width: 120,
      area: 'row',
      dataField: 'type',
      expanded: true,
      allowExpandAll: false,
      allowExpand: false,
      rowHeaderLayout: 'tree',
      showTotals: true,
      /** @todo find out how to remove total from the total field */
      customizeText: function(cellInfo) {
         return cellInfo.valueText === '0' ? 'TOTAL CASH INFLOWS' : 'TOTAL CASH OURFLOWS';
      },
      selector: function(data) {
          return data.type === 'income' ? 0 : 1;
      }
    },
    {
      caption: 'Group',
      width: 120,
      area: 'row',
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
      dataField: 'subgroup',
      rowHeaderLayout: 'tree'
    },
    {
      // caption: 'Name',
      width: 120,
      area: 'row',
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
      showColumnTotals: false
    },
    {
      caption: 'Date',
      dataField: 'date',
      dataType: 'date',
      area: 'column',
      groupInterval: 'year',
      customizeText: this.getYearHeaderCustomizer(),
      visible: true
    },
    {
      caption: 'Date',
      dataField: 'date',
      dataType: 'date',
      area: 'column',
      groupInterval: 'quarter',
      customizeText: this.getQuarterHeaderCustomizer(),
      visible: true
    },
    {
      caption: 'Date',
      dataField: 'date',
      dataType: 'date',
      area: 'column',
      groupInterval: 'month',
      customizeText: this.getMonthHeaderCustomizer(),
      visible: true
    },
    {
      caption: 'Projected',
      area: 'column',
      showTotals: false,
      selector: function(data) {const date = new Date(data.date);
          const current = new Date();
          let result;
          if (date.getMonth() + date.getFullYear() === current.getMonth() + current.getFullYear()) {
              if (current.getDay() > date.getDay()) {
                  result = 0;
              } else {
                  result = 1;
              }
          }
          return result;
      },
      customizeText: function(cellInfo) {
          const cellValue = (cellInfo.value === 1 ? 'PROJECTED' : 'MTD');
          const cssMarker = ' @css:{projectedField ' + (cellInfo.value === 1 ? 'projected' : 'mtd') + '}';
          return cellValue + cssMarker;
      },
      expanded: true,
      allowExpand: false
    }
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
    /*{
      caption: 'Date',
      dataField: 'date',
      dataType: 'date',
      area: 'column',
      groupInterval: 'day',
      customizeText: this.getDayHeaderCustomizer(),
      visible: true
    }*/
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
  constructor(CashflowService: CashflowService) {
      this.updateDateFields('year');
      this.cashflowService = CashflowService;
      this.operations = this.cashflowService.getOperations();
      this.operationsSource = this.getOperationsSource();
  }

  ngOnInit() {}

  /**
   * Update the fields array with the date fields with different date intervals like year, quarter and month
   * @param startedGroupInterval the groupInterval from wich we should start show headers
   */
  updateDateFields(startedGroupInterval) {

    /** remove date fields from table fields to update with the proper */
    this.hideDateFields();

    /** update date fields for table */
    let startedIntervalAdded = false;
    for (const group_by_item of this.groupbyItems) {
      if (group_by_item['groupInterval'] === startedGroupInterval || startedIntervalAdded) {
        const dateField = this.getDateFieldByInterval(group_by_item['groupInterval']);
        dateField.visible = true;
        startedIntervalAdded = true;
      }
    }
  };

  hideDateFields() {
    for (const group_by_item of this.groupbyItems) {
        const dateField = this.getDateFieldByInterval(group_by_item['groupInterval']);
        dateField.visible = false;
    }
  };

  getOperationsSource() {
      return {
          fields: this.tableFields,
          store: this.operations
      };
  }

  /**
   * @returns {function(any): string}
   */
  getYearHeaderCustomizer() {
      return function(cellInfo) {
          /** @todo find out how to inject the this.cssMarker instead of hardcoded ' @css' */
          return cellInfo.value + ' @css:{dateField year}';
      };
  }

  getYearHistoricalCustomizer() {
      return function(cellInfo) {
          const yearPeriods = [
              'Historical Cashflows - Prior Years',
              'Cashflow - Forecast'
          ];
          const cssClasses = [
              'historical',
              'forecast'
          ];
          return yearPeriods[cellInfo.value].toUpperCase() + ' @css:{historicalField ' + cssClasses[cellInfo.value] + '}';
      };
  }

  getMonthHistoricalCustomizer() {
      return function(cellInfo) {
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
      return function(cellInfo) {
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
        return function(cellInfo) {
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
      return function(data) {
          const current_year = new Date().getFullYear();
          const itemYear = new Date(data.date).getFullYear();
          return current_year < itemYear ? 1 : 0;
      };
  }

  getMonthHistoricalSelector(): any {
      return function(data) {
        const currentMonth = new Date().getMonth();
        const itemMonth = new Date(data.date).getMonth();
        let result;
        if (currentMonth < itemMonth) {
            result = 2;
        } else if (currentMonth === itemMonth) {
            result = 1;
        } else {
            result = 0;
        }
        return result;
      };
  }

  getWeekHistoricalSelector(): any {
      return function(data) {
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
      return function(data) {
          const currentDay = new Date().getDate();
          const itemDay = new Date(data.date).getDate();
          let result;
          if (currentDay < itemDay) {
              result = 2;
          } else if (currentDay === itemDay) {
              result = 1;
          } else {
              result = 0;
          }
          return result;
      };
  }

  /**
  * @returns string - the text of the header and the mark for the cellPrepared function with css classes that should be defined to fields
  */
  getQuarterHistoricalCustomizer() {
    return function(cellInfo) {
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
    return function(data) {
        function getQuarter(date) {
            date = date || new Date(); // If no date supplied, use today
            const quartersArr = [1, 2, 3, 4];
            return quartersArr[Math.floor(date.getMonth() / 3)];
        }
        const current_quarter = getQuarter(new Date());
        const item_quarter = getQuarter(new Date(data.date));
        let result;
        if (current_quarter < item_quarter) {
            result = 2;
        } else if (current_quarter === item_quarter) {
            result = 1;
        } else {
            result = 0;
        }
        return result;
    };
  }

  getQuarterHeaderCustomizer(): any {
    return function(cellInfo) {
        return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField quarter}';
    };
  }

  getMonthHeaderCustomizer(): any {
      return function(cellInfo) {
          return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField month}';
      };
  }

  getWeekHeaderCustomizer(): any {
      return function(cellInfo) {
          return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField week}';
      };
  }

  getDayHeaderCustomizer(): any {
      return function(cellInfo) {
          return cellInfo.valueText.slice(0, 3).toUpperCase() + ' @css:{dateField day}';
      };
  }

  getDateFieldByInterval(dateInterval): any {
     return this.tableFields.find(
         field => field['groupInterval'] === dateInterval
     );
  }
  getHistoricField(): Object {
      return this.tableFields.find(
          field => field['caption'] === 'Historical'
      );
  }

  changeGroupBy(event) {
    const startedGroupInterval = event.value.groupInterval;
    this.updateDateFields(startedGroupInterval);

    /**
     * Change historical field for different date intervals
     */
    const historical_field = this.getHistoricField();
    historical_field['selector'] = event.value.historicalSelectionFunction();
    historical_field['customizeText'] = event.value.historicalCustomizerFunction();

    this.operationsSource = this.getOperationsSource();
  }

  cutCssFromValue(text) {
      return text.slice(text.indexOf(this.cssMarker) + this.cssMarker.length + 2, text.length - 1);
  }
  onContentReady(event) {
      //console.log(event);
  }

  onCellPrepared(e) {
        /** added css class to start balance row */
        if ( (e.area === 'row' && e.cell.type === 'T' && e.cell.path.length === 1) ||
            ( e.area === 'data' && e.cell.rowPath !== undefined && e.cell.rowPath.length === 1) ) {
            const cssClass = 'startedBalance';
            e.cellElement.addClass(cssClass);
            /** disable collapsing for start balance column */
            e.cellElement.click(function(event) {
                event.stopImmediatePropagation();
            });
            /** move the row for started balance to the right to get proper view of started balances */
            if (e.area === 'data') {
                /** clone the first cell with zero value */
                if (e.columnIndex === 0) {
                    /** clone the cell */
                    const clonedCellElement = e.cellElement.clone();
                    clonedCellElement.find('span').text('$0');
                    e.cellElement.before(clonedCellElement);
                }
            }
        }
        /** added css class to the income and outcomes columns */
        if ( (e.area === 'row' && e.cell.type === 'T' && e.cell.path.length === 2) ||
            ( e.area === 'data' && e.cell.rowPath !== undefined && e.cell.rowPath.length === 2) ) {
            const cssClass = e.rowIndex === 1 ? 'income' : 'expenses';

            // console.log(e.cell.text, e);
            e.cellElement.addClass(cssClass);
            /** @todo find out how to change the text "totals" */
            /** disable collapsing for income and expenses columns */
            if ((e.area === 'row' && e.cell.type === 'T')) {
                e.cellElement.click(function(event) {
                    event.stopImmediatePropagation();
                });
            }
        }
        /** added css class to the income and outcomes columns to uppercase the columns names */
        if ( (e.area === 'row' && e.cell.path !== undefined && e.cell.path.length === 2)) {
            e.cellElement.addClass('uppercase');
        }

        /** headers manipulation (adding css classes and appending "Totals text") */
        if (e.area === 'column') {
            let cssClass = '';
            if (e.cell.text.indexOf(this.cssMarker) !== -1) {
                /** get the css class from name */
                const valueWithoutCss = e.cell.text.slice(0, (e.cell.text.indexOf(this.cssMarker)));
                /** cut off the css from the cell text */
                cssClass = this.cutCssFromValue(e.cell.text);
                /** update the columns with the text without the marker */
                e.cellElement.text(valueWithoutCss);
                /** Added "Total" text to the year and quarter headers */
                const fieldName = cssClass.slice(cssClass.indexOf(' ') + 1, cssClass.length).trim();
                if (fieldName === 'year' || fieldName === 'quarter') {
                    e.cellElement.append('<div class="totals">TOTALS</div>');
                }
                // /** Disable collapsing not current months for mdk and projected */
                // if (fieldName === 'month') {
                //     console.log(e);
                //     e.cellElement.click(function(event) {
                //         event.stopImmediatePropagation();
                //     });
                // }
            }
            /** Historical horizontal header columns */
            /** @todo exclude disabling for current month */
            if (e.rowIndex === 0) {
                /** disable collapsing for historical columns */
                e.cellElement.click(function(event) {
                    event.stopImmediatePropagation();
                });
            }
            e.cellElement.addClass(cssClass);
        }
        /** remove minus sign from negative values */
        if (e.area === 'data') {
            if (e.cell.value < 0) {
                e.cell.value = Math.abs(e.cell.value);
                e.cell.text = e.cell.text.replace('-', '');
                e.cellElement.text(e.cell.text);
            }
        }
    }
}
