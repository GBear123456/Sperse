/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import TextBox from 'devextreme/ui/text_box';
import NumberBox from 'devextreme/ui/number_box';
import * as $ from 'jquery';
import * as _ from 'underscore';

/** Application imports */
import { CellInfo } from './models/cell-info';
import { CellInterval } from './models/cell-interval';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';
import {
    BankAccountDto,
    CategoryDto,
    GetCategoryTreeOutput,
    ReportingCategoryDto
} from '@shared/service-proxies/service-proxies';
import { IModifyingInputOptions } from '@app/cfo/cashflow/modifying-input-options.interface';
import { IEventDescription } from '@app/cfo/cashflow/models/event-description';
import { CashflowTypes } from '@app/cfo/cashflow/enums/cashflow-types.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { Projected } from '@app/cfo/cashflow/enums/projected.enum';
import { CategorizationModel } from '@app/cfo/cashflow/models/categorization-model';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

/** Constants */
const StartedBalance    = CashflowTypes.StartedBalance,
    Income            = CashflowTypes.Income,
    Expense           = CashflowTypes.Expense,
    CashflowTypeTotal = CashflowTypes.CashflowTypeTotal,
    Reconciliation    = CashflowTypes.Reconciliation,
    NetChange         = CashflowTypes.NetChange,
    Total             = CashflowTypes.Total,
    GrandTotal        = CashflowTypes.GrandTotal;

const PSB   = CategorizationPrefixes.CashflowType + CashflowTypes.StartedBalance,
      PI    = CategorizationPrefixes.CashflowType + CashflowTypes.Income,
      PE    = CategorizationPrefixes.CashflowType + CashflowTypes.Expense,
      PCTT  = CategorizationPrefixes.CashflowType + CashflowTypes.CashflowTypeTotal,
      PR    = CategorizationPrefixes.CashflowType + CashflowTypes.Reconciliation,
      PNC   = CategorizationPrefixes.CashflowType + CashflowTypes.NetChange,
      PT    = CategorizationPrefixes.CashflowType + CashflowTypes.Total;

@Injectable()
export class CashflowService {

    modifyingCellInput: NumberBox | TextBox;
    modifyingInputObj: any;
    additionalElements: any[];
    oldCellPadding: string;
    clickCount = 0;
    lastClickTime: Date;
    modifyingCellOldHtml: string;
    valueIsChanging = false;

    /**
     *  Categorization settings for creating categorization tree on cashflow
     */
    categorization: CategorizationModel[] = [
        {
            prefix                 : CategorizationPrefixes.CashflowType,
            statsKeyName           : 'cashflowTypeId',
            namesSource            : 'categoryTree.types'
        },
        {
            prefix                 : CategorizationPrefixes.AccountName,
            statsKeyName           : 'accountId',
            namesSource            : 'bankAccounts'
        },
        {
            prefix                 : CategorizationPrefixes.ReportingGroup,
            namesSource            : 'reportingGroups'
        },
        {
            prefix                 : CategorizationPrefixes.ReportingSection,
            statsKeyName           : 'reportSectionId',
            namesSource            : 'categoryTree.reportingSections'
        },
        {
            prefix                 : CategorizationPrefixes.AccountingType,
            statsKeyName           : 'accountingTypeId',
            namesSource            : 'categoryTree.accountingTypes'
        },
        {
            prefix                 : CategorizationPrefixes.Category,
            statsKeyName           : 'categoryId',
            namesSource            : 'categoryTree.categories'
        },
        {
            prefix                 : CategorizationPrefixes.SubCategory,
            statsKeyName           : 'subCategoryId',
            namesSource            : 'categoryTree.categories'
        },
        {
            prefix                 : CategorizationPrefixes.TransactionDescriptor,
            statsKeyName           : 'transactionDescriptor'
        }
    ];

    /** The string paths of cashflow data */
    treePathes = {};

    /** The tree of categories after first data loading */
    categoryTree: GetCategoryTreeOutput;

    cashflowTypes: any;

    /** Bank accounts of user with extracted bank accounts */
    bankAccounts: BankAccountDto[];

    constructor(
        private userPreferencesService: UserPreferencesService,
        private ls: AppLocalizationService
    ) { }

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

    /**
     * Gets categorization properties and their values depend on targets and forecasts data
     * @param forecast
     * @param {CellInfo} target
     * @param {boolean} subCategoryIsCategory
     * @return {{categoryId: number; transactionDescriptor: string}}
     */
    getCategorizationFromForecastAndTarget(source: CellInfo, target: CellInfo, subCategoryIsCategory = true) {

        let categorization = {};
        if (this.isUnclassified(target)) {
            categorization['cashflowTypeId'] = categorization['cashFlowTypeId'] = target.cashflowTypeId;
            categorization['transactionDescriptor'] = target.transactionDescriptor;
            return categorization;
        }

        let cashflowTypeId = target.cashflowTypeId != source.cashflowTypeId ? target.cashflowTypeId : source.cashflowTypeId;
        let accountingTypeId = target.accountingTypeId && target.accountingTypeId != source.accountingTypeId ? target.accountingTypeId : source.accountingTypeId;
        let subCategoryId;
        if (target.subCategoryId) {
            subCategoryId = target.subCategoryId && target.subCategoryId != source.subCategoryId ? target.subCategoryId : source.subCategoryId;
        }
        let categoryId = target.categoryId && target.categoryId != source.categoryId ? target.categoryId : source.categoryId;
        let transactionDescriptor = target.transactionDescriptor && target.transactionDescriptor != source.transactionDescriptor ? target.transactionDescriptor : source.transactionDescriptor;
        categorization = {
            categoryId: subCategoryIsCategory && subCategoryId ? subCategoryId : categoryId,
            transactionDescriptor: transactionDescriptor,
            accountingTypeId: accountingTypeId
        };

        if (!subCategoryIsCategory) {
            categorization['subCategoryId'] = subCategoryId;
        }

        categorization['cashflowTypeId'] = categorization['cashFlowTypeId'] = cashflowTypeId;
        return categorization;
    }

    isUnclassified(cell: CellInfo): boolean {
        return !cell.accountingTypeId && !cell.categoryId && !cell.subCategoryId;
    }

    isHorizontalCopying(sourceCellObj: any, targetCellObjs: any[]) {
        return targetCellObjs.every(targetCell => targetCell.rowIndex === sourceCellObj.rowIndex && targetCell.columnIndex !== sourceCellObj.columnIndex);
    }

    /**
     * Get Category value by prefix
     * @param {any[]} path
     * @param {CategorizationPrefixes} prefix
     * @return {any}
     */
    getCategoryValueByPrefix(path: any[], prefix: CategorizationPrefixes): any {
        let value;
        path.some(pathItem => {
            if (pathItem && pathItem.slice(0, 2) === prefix) {
                value = pathItem !== CategorizationPrefixes.CashflowType + CashflowTypes.CashflowTypeTotal ? pathItem.slice(2) : undefined;
                return true;
            }
            return false;
        });
        return value;
    }

    getCashFlowTypeByCategory(categoryId: number, categoryTree: GetCategoryTreeOutput): string {
        let cashflowType;
        const accountingTypeId = categoryTree.categories[categoryId] && categoryTree.categories[categoryId].accountingTypeId;
        if (accountingTypeId) {
            const accountingType = categoryTree.accountingTypes[accountingTypeId];
            cashflowType = accountingType && accountingType.typeId;
        }
        return cashflowType;
    }

    getCategoryValueByValue(value: number) {
        return value > 0 ? CashflowTypes.Income : CashflowTypes.Expense;
    }

    /**
     * Gets active accounts ids including filter
     * @param {BankAccountDto[]} bankAccounts
     * @param {number[]} idsFromFilter
     * @return {number[]}
     */
    getActiveAccountIds(bankAccounts: BankAccountDto[], idsFromFilter: number[] = null): number[] {
        let activeBankAccountsIds: number[] = bankAccounts.filter(account => account.isActive).map(account => account.id);
        if (idsFromFilter && idsFromFilter.length) {
            activeBankAccountsIds = _.intersection(activeBankAccountsIds, idsFromFilter);
        }
        return activeBankAccountsIds;
    }

    /**
     * Get active account id
     * @param {number[]} activeAccountIds
     * @param {number} accountId
     * @return {number}
     */
    getActiveAccountId(activeAccountIds: number[], accountId: number = null) {
        return activeAccountIds && activeAccountIds.length ?
               accountId && (activeAccountIds.indexOf(accountId) !== -1 ? accountId : activeAccountIds[0]) :
               accountId;
    }

    /**
     * Gets current date with 00:00:00 time
     * @returns {moment.Moment}
     */
    getUtcCurrentDate(): moment.Moment {
        return moment.tz(moment().format('YYYY-MM-DD') + 'T00:00:00', 'UTC');
    }

    /**
     * Get forecasts interval for adding forecasts
     * @param futureForecastsYearCount
     * @returns {CellInterval}
     */
    getAllowedForecastsInterval(forecastsYearCount: number): CellInterval {
        const currentDate = this.getUtcCurrentDate();
        return {
            startDate: currentDate,
            endDate: moment(currentDate).add('day', -1).add('year', forecastsYearCount).endOf('day')
        };
    }

    cellIsAllowedForAddingForecast(cellInterval: CellInterval, futureForecastsYearCount: number): boolean {
        const allowedForecastsInterval = this.getAllowedForecastsInterval(futureForecastsYearCount);
        return cellInterval.endDate.isBefore(allowedForecastsInterval.endDate) ||
               cellInterval.startDate.isBefore(allowedForecastsInterval.endDate);
    }

    isSubCategory(categoryId: number, categoryTree: GetCategoryTreeOutput): boolean {
        return categoryId && !!categoryTree.categories[categoryId].parentId;
    }

    getCategoryFullPath(categoryId: number, category: CategoryDto, categoryTree: GetCategoryTreeOutput): string[] {
        let allCategoriesInPath: string[] = this.getCategoryPath(categoryId, categoryTree);
        return [
            CategorizationPrefixes.CashflowType + categoryTree.accountingTypes[category.accountingTypeId].typeId,
            ...allCategoriesInPath
        ];
    }

    private getCategoryPath(categoryId: number, categoryTree: GetCategoryTreeOutput): string[] {
        const parentCategoryId = categoryTree.categories[categoryId].parentId;
        const prevCategories = parentCategoryId && categoryTree.categories[parentCategoryId] ? this.getCategoryPath(parentCategoryId, categoryTree) : [];
        const prefix = !!parentCategoryId ? CategorizationPrefixes.SubCategory : CategorizationPrefixes.Category;
        return [ ...prevCategories, prefix + categoryId ];
    }

    categoryHasTransactions(treePathes, categoryPath: string[]): boolean {
        return Object.keys(treePathes).some(path => path.indexOf(categoryPath.join(',')) >= 0);
    }

    isCategoryCell(cellObj, area): boolean {
        return area === 'row' && !cellObj.isWhiteSpace && cellObj.path && this.hasCategoryOrSubcategoryPrefix(cellObj.path[cellObj.path.length - 1]);
    }

    hasCategoryOrSubcategoryPrefix(item: string): boolean {
        let result = false;
        if (item) {
            const prefix = item.slice(0, 2);
            result = prefix === CategorizationPrefixes.Category || prefix === CategorizationPrefixes.SubCategory;
        }
        return result;
    }

    openEditField(cellObj, options: IModifyingInputOptions, additionalElements: any[] = []) {
        let element: HTMLElement = cellObj.cellElement;

        this.additionalElements = additionalElements;
        /** if the modifying input has already exists */
        if (this.modifyingCellInput) {
            this.removeModifyingCellInput();
        }
        this.modifyingCellOldHtml = $(element).html();
        if (!$(element).find('> span'))
            $(element).wrapInner('<span></span>');
        const elementSpan = $(element).find('> span');

        elementSpan.hide();
        this.oldCellPadding = window.getComputedStyle(element).padding;
        let wrapper = document.createElement('div');
        wrapper.onclick = function(ev) {
            ev.stopPropagation();
        };
        let wrapperButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };

        this.modifyingCellInput = options.type === 'number'
            ? new NumberBox(wrapper, {
                value: cellObj.cell.text,
                height: element.clientHeight,
                format: options.currencySymbol + ' #,###.##',
                onEnterKey: (e) => options.onEnterKey(e, cellObj),
                onValueChanged: (e) => {
                    options.onValueChanged(e, cellObj);
                },
                onFocusOut: (e) => {
                    if (!this.valueIsChanging) {
                        this.removeModifyingCellInput();
                    }
                },
                elementAttr: {
                    class: 'modifying-box'
                }
            })
            : new TextBox(wrapper, {
                value: cellObj.cell.text,
                height: element.clientHeight,
                onValueChanged: (e) => {
                    options.onValueChanged(e, cellObj);
                },
                onFocusOut: (e) => {
                    if (!this.valueIsChanging) {
                        this.removeModifyingCellInput();
                    }
                },
                elementAttr: {
                    class: 'modifying-box'
                }
            });
        additionalElements.forEach(element => {
            element.appendChild(element);
        });
        element.appendChild(this.modifyingCellInput.element());
        if (options.fontSize) {
            this.modifyingCellInput.element().querySelector('input.dx-texteditor-input')['style'].fontSize = options.fontSize;
        }
        this.modifyingCellInput.focus();
        element = null;
        this.modifyingInputObj = cellObj;
    }

    removeModifyingCellInput(callback?: () => void) {
        if (this.modifyingCellInput) {
            let parentTD = this.modifyingCellInput.element().parentElement;
            this.modifyingCellInput.dispose();
            this.modifyingCellInput.element().remove();
            this.modifyingCellInput = null;
            if (this.additionalElements && this.additionalElements.length) {
                this.additionalElements.forEach(element => {
                    element.dispose && element.dispose();
                    element.element() && element.element().remove();
                });
            }
            /** Remove inner span wrapper in the cell */
            parentTD.innerHTML = this.modifyingCellOldHtml;
            $(parentTD).find('> span').text(this.modifyingInputObj.cell.text);
            parentTD.style.padding = this.oldCellPadding;
            this.modifyingInputObj = null;
            callback && callback();
        }
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
            if (((+new Date()) - +component.lastClickTime) < 300) {
                if (doubleClickHandler && typeof doubleClickHandler === 'function') {
                    doubleClickHandler(e);
                }
            }
            component.clickCount = 0;
            component.lastClickTime = null;
        }
    }

    /**
     * Return whether element is cell of cashflow table
     * @param {HTMLElement} element
     * @return {boolean}
     */
    elementIsDataCell(element: HTMLElement): boolean {
        return Boolean(element.closest('.dx-area-data-cell'));
    }

    getReportingCategoriesIds(reportingCategoryId: number, reportingCategories: { [key: string]: ReportingCategoryDto; }): number[] {
        let reportingCategoriesIds = [ reportingCategoryId ];
        while (reportingCategories[reportingCategoryId].parentId) {
            reportingCategoriesIds.unshift(reportingCategories[reportingCategoryId].parentId);
            reportingCategoryId = reportingCategories[reportingCategoryId].parentId;
        }
        return reportingCategoriesIds;
    }

    itemIsInWeekInterval(cellData, date): boolean {
        const weekInterval = JSON.parse(cellData.projected);
        return weekInterval
            && date.isSameOrAfter(moment.utc(weekInterval.startDate))
            && date.isSameOrBefore(moment.utc(weekInterval.endDate));
    }

    /**
     * Calculates the value of the cell using the cell data and cashflowData array
     * Please run test after changing or refactoring to avoid regression
     * @param cellData
     */
    calculateCellValue(cellData, dataArray, onlyStartOfPeriod = false) {
        let currentDateDate = DateHelper.getCurrentUtcDate().date(), cellMoment;
        if (onlyStartOfPeriod) {
            if (cellData.projected) {
                const weekInterval = JSON.parse(cellData.projected);
                cellMoment = moment.utc(weekInterval.startDate);
            } else {
                cellMoment = moment()
                    .set({ year: cellData.year })
                    .startOf('year')
                    .set({
                        quarter: cellData.quarter,
                        month: cellData.month ? cellData.month - 1 : cellData.month,
                        date: cellData.day
                    });
            }
        }
        /** {cashflowTypeId: 'T', accountId: 10, quarter: 3, year: 2015, month: 5} */
        let value = dataArray.reduce((sum, cashflowData) => {
            let date = cashflowData.initialDate || cashflowData.date;
            if (
                cashflowData.cashflowTypeId === cellData.cashflowTypeId &&
                /** if account id is B - then we should get all accounts */
                (cellData.accountId === StartedBalance || cellData.accountId === Total || cashflowData.accountId == cellData.accountId) &&
                (
                    onlyStartOfPeriod
                        ? cellMoment.format('DD.MM.YYYY') === date.format('DD.MM.YYYY')
                        : ((!cellData.year || (cellData.year === date.year())) &&
                            (!cellData.quarter || (cellData.quarter === date.quarter())) &&
                            (!cellData.month || (cellData.month - 1 === date.month())) &&
                            ((cellData.day && cellData.day === date.date()) ||
                                (!cellData.day && !cellData.projected) ||
                                (
                                    cellData.projected &&
                                    (
                                        (cellData.projected === Projected.Mtd && date.date() < currentDateDate) ||
                                        (cellData.projected === Projected.Today && date.date() === currentDateDate) ||
                                        (cellData.projected === Projected.Forecast && date.date() > currentDateDate) ||
                                        this.itemIsInWeekInterval(cellData, date)
                                    )
                                ))
                        )
                )
            ) {
                sum += cashflowData.amount;
            }
            return sum;
        }, 0);

        return value;
    }

    addCategorizationLevels(transactionObj: any) {
        /** Add group and categories numbers to the categorization list and show the names in
         *  customize functions by finding the names with ids
         */
        let levelNumber = 0;
        let isAccountTransaction = transactionObj.cashflowTypeId === StartedBalance ||
            transactionObj.cashflowTypeId === Total ||
            transactionObj.cashflowTypeId === Reconciliation ||
            transactionObj.cashflowTypeId === NetChange;
        let key = null;
        transactionObj['levels'] = {};
        this.categorization.every((level) => {

            if (
                transactionObj[level.statsKeyName]
                || (level.prefix === CategorizationPrefixes.SubCategory && !transactionObj.categoryId)
                || level.prefix === CategorizationPrefixes.ReportingGroup
            ) {
                /** If user doesn't want to show accounting type row - skip it */
                if (
                    level.prefix === CategorizationPrefixes.AccountingType && !this.userPreferencesService.localPreferences.value.showAccountingTypeTotals
                    || ((level.prefix === CategorizationPrefixes.ReportingGroup || level.prefix === CategorizationPrefixes.ReportingSection) && !this.userPreferencesService.localPreferences.value.showReportingCategoryTotals)
                ) {
                    return true;
                }

                if (level.prefix === CategorizationPrefixes.ReportingGroup) {
                    if (transactionObj.reportSectionId) {
                        const reportSection = this.categoryTree.reportSections[transactionObj.reportSectionId];
                        if (reportSection) {
                            transactionObj['levels'][`level${levelNumber++}`] = level.prefix + reportSection.group;
                        }
                    }
                    return true;
                }

                /** Create categories levels properties */
                if (level.prefix === CategorizationPrefixes.AccountName) {
                    if (isAccountTransaction) {
                        key = level.prefix + transactionObj[level.statsKeyName];
                        transactionObj['levels'][`level${levelNumber++}`] = key;
                        return false;
                    } else {
                        return true;
                    }
                }

                /**
                 * The first level for income or expense is total if user chooses to hide cashflow type totals
                 */
                if (level.prefix === CategorizationPrefixes.CashflowType
                    && (
                        transactionObj[level.statsKeyName] === Income
                        || transactionObj[level.statsKeyName] === Expense
                    )
                    && !this.userPreferencesService.localPreferences.value.showCashflowTypeTotals
                ) {
                    key = PCTT;
                    transactionObj['levels'][`level${levelNumber++}`] = key;
                    return true;
                }

                const isUnclassified = !transactionObj[level.statsKeyName];
                /**
                 * If user wants to hide categories and subcategories - avoid adding level for them
                 */
                if (
                    (level.prefix === CategorizationPrefixes.Category || level.prefix === CategorizationPrefixes.SubCategory || level.prefix === CategorizationPrefixes.TransactionDescriptor)
                    && !this.userPreferencesService.localPreferences.value.showCategoryTotals
                    && !isUnclassified
                ) {
                    return true;
                }

                key = isUnclassified ? transactionObj[level.statsKeyName] : level.prefix + transactionObj[level.statsKeyName];
                transactionObj['levels'][`level${levelNumber++}`] = key;
            }
            return true;
        });

        /** Don't show items only with one level in the second level */
        if (Object.keys(transactionObj.levels).length === 1) {
            transactionObj.levels.level1 = 'hidden';
        }

        this.updateTreePathes(transactionObj);
        return transactionObj;
    }

    /**
     * Update pathes for the filtering
     * @param transactionObj
     */
    updateTreePathes(transactionObj, removePath = false) {
        let fullPath = [];
        for (let level in transactionObj['levels']) {
            fullPath.push(transactionObj['levels'][level]);
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
                    text  = `${this.ls.l('Total')} ${text}`;
                } else if (key === CashflowTypeTotal) {
                    text = this.ls.l('CashFlowGrid_UserPrefs_ShowCashflowTypeTotals');
                }
                text = text.toUpperCase();
            }

            /** Text customizing for reporting groups */
            if (prefix === CategorizationPrefixes.ReportingGroup) {
                let group = this.categoryTree.reportSectionGroups[key];
                text = group ? this.ls.l('SectionGroup_' + group) : '';
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

    getCategoryParams(prefix: CategorizationPrefixes): CategorizationModel {
        return this.categorization.find(item => item.prefix === prefix);
    }

    getDescendantPropValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}
