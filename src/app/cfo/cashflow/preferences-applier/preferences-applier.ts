/**
 * Class that responsible for appliing user preferences to cashflow grid
 */
import { UserPreferencesService } from '../preferences-dialog/preferences.service';
import { GeneralScope } from '../enums/general-scope.enum';
import { CashflowCellsChecker } from '../cashflow-cells-checker/cashflow-cells-checker';
import * as _ from 'underscore.string';
import { CashflowHelper } from '../cashflow.helper/cashflow.helper';

export class PreferencesApplier {

    private cashedColumnActivity: Map<string, boolean> = new Map();
    userPreferencesHandlers = {
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
        },
        localizationAndCurrency: {
            applyTo: 'cells',
            preferences: {
                numberFormatting: {
                    areas: ['data'],
                    handleMethod: this.reformatCell
                }
            }
        }
    };

    cellTypesCheckMethods = {
        [GeneralScope.TransactionRows]: 'isTransactionRows',
        [GeneralScope.TotalRows]: 'isIncomeOrExpensesDataCell',
        [GeneralScope.BeginningBalances]: 'isStartingBalanceDataColumn',
        [GeneralScope.EndingBalances]: 'isAllTotalBalanceCell'
    };

    constructor(private _userPreferencesService: UserPreferencesService,
                private _cashflowCellChecker: CashflowCellsChecker,
                private _cashflowHelper: CashflowHelper) {}

    public applyUserPreferencesForCells(e, preferencesSettings) {
        let userPreferences = this.getUserPreferencesAppliedTo('cells', preferencesSettings);
        userPreferences.forEach(preference => {
            if (preference['sourceValue'] !== null && (!preference.areas.length || preference.areas.indexOf(e.area) !== -1)) {
                preference['handleMethod'].call(this, e, preference);
            }
        });
    }

    public applyUserPreferencesForAreas(preferencesSettings) {
        let userPreferences = this.getUserPreferencesAppliedTo('areas', preferencesSettings);
        userPreferences.forEach(preference => {
            if (preference['sourceValue'] !== null) {
                preference['handleMethod'].call(this, preference);
            }
        });
    }

    /**
     * Get user preferences by applyTo type
     * @param {"cells" | "areas"} applyTo
     */
    private getUserPreferencesAppliedTo(applyTo: 'cells' | 'areas', preferencesSettings) {
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
                    preferences[preferenceName]['sourceValue'] = preferencesSettings ? preferencesSettings[preferencesType][preferenceName] : null;
                    userPreferences.push(preferences[preferenceName]);
                }
            }
        }
        return userPreferences;
    }

    /** User preferences */
    private showAmountsWithDecimals(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this._userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (!isCellMarked) {
                let valueWithDecimals = cellObj.cellElement.text();
                cellObj.cellElement.text(valueWithDecimals.slice(0, valueWithDecimals.length - 3));
            }
        }
    }

    private hideZeroValuesInCells(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this._userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cellObj.cell.value === 0) {
                cellObj.cellElement.text('');
            }
        }
    }

    private showNegativeValuesInRed(cellObj, preference) {
        let cellType = this.getCellType(cellObj);
        if (cellType) {
            let isCellMarked = this._userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cellObj.cell.value < 0) {
                cellObj.cellElement.classList.add('red');
            }
        }
    }

    /** @todo refactor */
    private getCellType(cellObj) {
        let cellType;
        for (let type in this.cellTypesCheckMethods) {
            let method = this.cellTypesCheckMethods[type];
            if (this._cashflowCellChecker[method](cellObj)) {
                cellType = type;
                break;
            }
        }
        return cellType;
    }

    private hideColumnsWithZeroActivity(cellObj, preference) {
        // let path = cellObj.cell.columnPath || cellObj.cell.path;
        // if (path) {
        //     let cellPeriod = this._cashflowHelper.getLowestIntervalFromPath(path, this.getColumnFields());
        //     let isCellMarked = this._userPreferencesService.isCellMarked(
        //         preference['sourceValue'],
        //         ModelEnums.PeriodScope[_.capitalize(cellPeriod)]
        //     );
        //     if (isCellMarked) {
        //         let activity = this.columnHasActivity(cellObj, cellPeriod);
        //         if (!activity) {
        //             //cellObj.cellElement.classList.add('hideZeroActivity');
        //             // cellObj.cell.expanded = false;
        //             // cellObj.cellElement.css({
        //             //     'border': 'none !important',
        //             //     'padding': '0 !important',
        //             //     'width': '0 !important',
        //             //     'min-width': '0 !important',
        //             //     'max-width': '0 !important',
        //             //     '-moz-box-sizing': 'border-box !important',
        //             //     'box-sizing': 'border-box !important'
        //             // });
        //             // cellObj.cellElement.text('');
        //         }
        //     }
        // }
    }

    /** Get column activity */
    private columnHasActivity(cellObj, lowestPeriod) {
        // let columnHasActivity = false;
        // let path = cellObj.cell.columnPath || cellObj.cell.path
        // let cellDate = this._cashflowHelper.getDateByPath(path, this.getColumnFields(), lowestPeriod);
        // if (cellDate) {
        //     let dateKey = this._cashflowHelper.formatToLowest(cellDate, lowestPeriod);
        //     /** if we have the activity value in cache - get it from there */
        //     if (this.cashedColumnActivity.get(dateKey)) {
        //         columnHasActivity = this.cashedColumnActivity.get(dateKey);
        //         /** else calculate the activity using cashflow data and save it in cache to avoid
        //          *  a lot of calculations */
        //     } else {
        //         columnHasActivity = this.cashflowData.some((cashflowItem) => {
        //             return (dateKey === this._cashflowHelper.formatToLowest(cashflowItem.date, lowestPeriod) &&
        //                 cashflowItem.amount);
        //         });
        //         this.cashedColumnActivity.set(dateKey, columnHasActivity);
        //     }
        // }
        // return columnHasActivity;
    }

    private addPreferenceClass(preference) {
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

    private addPreferenceStyle(preference) {
        const cssProperty = _.dasherize(preference['sourceName']);
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).css(cssProperty, preference['sourceValue']);
        }
    }

    private reformatCell() {}

}
