/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import TextBox from 'devextreme/ui/text_box';
import NumberBox from 'devextreme/ui/number_box';
import DevExpress from 'devextreme/bundles/dx.all';
import * as $ from 'jquery';
import capitalize from 'underscore.string/capitalize';
import * as _ from 'underscore';
import * as underscore from 'underscore';

/** Application imports */
import { CellInfo } from './models/cell-info';
import { CellInterval } from './models/cell-interval';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';
import {
    AdjustmentType,
    BankAccountDto,
    CashFlowGridSettingsDto,
    CashFlowInitialData,
    CategoryDto,
    GetCategoryTreeOutput,
    GetReportTemplateDefinitionOutput,
    GroupByPeriod,
    SectionGroup,
    StatsDetailFilter,
    StatsFilter
} from '@shared/service-proxies/service-proxies';
import { IModifyingInputOptions } from '@app/cfo/cashflow/modifying-input-options.interface';
import { IEventDescription } from '@app/cfo/cashflow/models/event-description';
import { CashflowTypes } from '@app/cfo/cashflow/enums/cashflow-types.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { Projected } from '@app/cfo/cashflow/enums/projected.enum';
import { CategorizationModel } from '@app/cfo/cashflow/models/categorization-model';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CurrencyPipe } from '@angular/common';
import { Periods } from '@app/cfo/cashflow/enums/periods.enum';
import { WeekInfo } from '@app/cfo/cashflow/models/week-info';
import { TransactionStatsDtoExtended } from '@app/cfo/cashflow/models/transaction-stats-dto-extended';

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
            statsKeyName           : 'reportSectionGroup'
        },
        {
            prefix                 : CategorizationPrefixes.ReportingSection,
            statsKeyName           : 'reportSectionId',
            namesSource            : 'reportSections.sections'
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
    requestFilter: StatsFilter;
    /** Bank accounts of user with extracted bank accounts */
    bankAccounts: BankAccountDto[];
    anotherPeriodAccountsValues: Map<string, number> = new Map();
    cachedRowsFitsToFilter: Map<string, boolean> = new Map();
    /** First categorization level items order */
    private leftMenuOrder = [
        StartedBalance,
        Income,
        Expense,
        CashflowTypeTotal,
        NetChange,
        Reconciliation,
        Total
    ];
    cashflowData;
    cashflowGridSettings: CashFlowGridSettingsDto;

    selectedForecastModelId;

    /** List of adjustments on cashflow */
    adjustmentsList = [];
    zeroAdjustmentsList = [];
    showAllVisible = false;
    showAllDisable = false;
    initialData: CashFlowInitialData;
    /** Pivot grid fields settings */
    apiTableFields: any = [
        {
            caption: 'Type',
            width: 120,
            area: 'row',
            expanded: false,
            allowExpandAll: false,
            allowExpand: false,
            sortOrder: 'asc',
            areaIndex: 0,
            dataField: 'levels.level0',
            rowHeaderLayout: 'tree',
            showTotals: true,
            sortingMethod: (firstItem, secondItem) => {
                return this.leftMenuOrder.indexOf(firstItem.value.slice(2)) > this.leftMenuOrder.indexOf(secondItem.value.slice(2)) ? 1 : -1;
            },
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Reporting Group',
            width: 120,
            area: 'row',
            dataField: 'levels.level1',
            areaIndex: 1,
            sortBy: 'displayText',
            sortOrder: 'asc',
            expanded: false,
            showTotals: true,
            sortingMethod: (a, b) => CashflowService.sortReportingGroup(a, b),
            resortable: true,
            customizeText: cellInfo => this.customizeFieldText.bind(this, cellInfo, this.ls.l('Unclassified'))()
        },
        {
            caption: 'Reporting Section',
            width: 120,
            area: 'row',
            dataField: 'levels.level2',
            areaIndex: 2,
            sortBy: 'displayText',
            sortOrder: 'asc',
            expanded: false,
            showTotals: true,
            resortable: true,
            customizeText: cellInfo => this.customizeFieldText.bind(this, cellInfo, this.ls.l('Unclassified'))()
        },
        {
            caption: 'Account Type',
            width: 120,
            area: 'row',
            dataField: 'levels.level3',
            areaIndex: 3,
            sortBy: 'displayText',
            sortOrder: 'asc',
            expanded: false,
            showTotals: true,
            resortable: true,
            customizeText: cellInfo => this.customizeFieldText.bind(this, cellInfo, this.ls.l('Unclassified'))(),
            rowHeaderLayout: 'tree'
        },
        {
            caption: 'Category',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            areaIndex: 4,
            dataField: 'levels.level4',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Sub Category',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            areaIndex: 5,
            dataField: 'levels.level5',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            caption: 'Descriptor',
            showTotals: false,
            area: 'row',
            sortBy: 'displayText',
            sortOrder: 'asc',
            resortable: true,
            areaIndex: 6,
            dataField: 'levels.level6',
            customizeText: this.customizeFieldText.bind(this)
        },
        {
            dataField: 'amount',
            dataType: 'number',
            summaryType: 'sum',
            format: value => {
                return this.formatAsCurrencyWithLocale(value);
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
            selector: this.getYearHistoricalSelectorWithCurrent(),
            customizeText: this.getHistoricalCustomizer.bind(this)(),
            expanded: true,
            allowExpand: false,
            wordWrapEnabled: true,
            visible: true
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
            width: 0.01,
            areaIndex: 3,
            showTotals: false,
            groupInterval: 'month',
            customizeText: this.getMonthHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Projected',
            area: 'column',
            showTotals: false,
            areaIndex: 4,
            selector: this.projectedSelector,
            customizeText: cellInfo => {
                let projectedKey;
                switch (cellInfo.value) {
                    case Projected.PastTotal:
                    case Projected.FutureTotal:    projectedKey = 'CashflowFields_Total'; break;
                    case Projected.Forecast:       projectedKey = 'CashflowFields_Projected'; break;
                    case Projected.Mtd:            projectedKey = 'CashflowFields_Mtd'; break;
                    case Projected.Today:          projectedKey = 'CashflowFields_Today'; break;
                }
                return this.ls.l(projectedKey).toUpperCase();
            },
            expanded: false,
            allowExpand: false,
            visible: true
        },
        {
            caption: 'Week',
            area: 'column',
            width: 0.01,
            areaIndex: 5,
            showTotals: false,
            sortBy: 'displayText',
            selector: this.weekHeaderSelector,
            sortingMethod: this.weekSorting,
            customizeText: this.getWeekHeaderCustomizer(),
            visible: true
        },
        {
            caption: 'Day',
            dataField: 'date',
            dataType: 'date',
            areaIndex: 6,
            area: 'column',
            showTotals: false,
            groupInterval: 'day',
            visible: true
        }
    ];

    /** Filter by string */
    filterBy: string;

    /** Language keys for historical field texts*/
    private historicalTextsKeys = [
        'Periods_Historical',
        'Periods_Current',
        'Periods_Forecast'
    ];

    /** Years in cashflow */
    allYears: number[] = [];

    /** Amount of years with stubs */
    yearsAmount = 0;

    reportSections: GetReportTemplateDefinitionOutput;

    constructor(
        private cfoPreferencesService: CfoPreferencesService,
        private ls: AppLocalizationService,
        private currencyPipe: CurrencyPipe,
        public userPreferencesService: UserPreferencesService
    ) {}


    static addLocalTimezoneOffset(date) {
        if (date) {
            let offset = new Date(date).getTimezoneOffset();
            date.add(-offset, 'minutes');
        }
    }

    /**
     * Change moment date to the offset of local timezone
     * @param date
     */
    static removeLocalTimezoneOffset(date) {
        if (date) {
            let offset = new Date(date).getTimezoneOffset();
            date.add(offset, 'minutes');
        }
    }

    /**
     * This function accepts two field values and should return a number indicating their sort order:
         Less than zero - a goes before b.
         Zero - a and b remain unchanged relative to each other.
         Greater than zero - a goes after b.
     * @param firstItem
     * @param secondItem
     * @return {number}
     */
    static sortReportingGroup(firstItem, secondItem): number {
        let result = 0;
        const firstItemValue = firstItem.value && firstItem.value.slice(2);
        const secondItemValue = secondItem.value && secondItem.value.slice(2);
        if (!firstItemValue || firstItemValue === 'N/A') {
            result = 1;
        } else if (!secondItemValue || secondItemValue === 'N/A') {
            result = -1;
        } else if (firstItem.value.slice(0, 2) === CategorizationPrefixes.ReportingGroup) {
            const sectionGroups = Object.keys(SectionGroup);
            result = sectionGroups.indexOf(firstItemValue) > sectionGroups.indexOf(secondItemValue) ? 1 : -1;
        }
        return result;
    }

    static addEvents(element: HTMLElement, events: IEventDescription[]) {
        for (let event of events) {
            element.addEventListener(event.name, event.handler, event.useCapture);
        }
    }

    static removeEvents(element: HTMLElement, events: IEventDescription[]) {
        for (let event of events) {
            element.removeEventListener(event.name, event.handler);
        }
    }

    static applyNewTextWidth(cellObj, element, newCellWidth) {
        cellObj.cellElement.setAttribute('title', cellObj.cell.text.toUpperCase());
        /** Extend text to the whole cell */
        element.style.whiteSpace = 'nowrap';
        element.classList.add('truncated');
        /** created another span inside to avoid inline-flex and text-overflow: ellipsis conflicts */
        element.innerHTML = `<span>${element.textContent}</span>`;
        /** Set new width to the text element */
        element.style.width = newCellWidth + 'px';
    }

    /**
     * Gets categorization properties and their values depend on targets and forecasts data
     * @param {CellInfo} source
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

    /**
     * Handle get categories result
     * @param getCategoriesResult
     */
    handleGetCategoryTreeResult(getCategoriesResult: GetCategoryTreeOutput) {
        this.categoryTree = getCategoriesResult;
        /** Add starting balance, ending balance, netchange and balance discrepancy */
        for (let type in this.cashflowTypes) {
            if (!this.categoryTree.types.hasOwnProperty(type)) {
                this.categoryTree.types[type] = <any>{ name: this.cashflowTypes[type]};
            }
        }
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
     * @param forecastsYearCount
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
                onFocusOut: () => {
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
                onFocusOut: () => {
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
                const filterStartDate = this.requestFilter.startDate;
                cellMoment = moment()
                    .set({ year: cellData.year })
                    .startOf('year')
                    .set({
                        quarter: cellData.quarter,
                        month: cellData.month ? (cellData.month - 1) || (filterStartDate && filterStartDate.getMonth()) : null,
                        date: cellData.day || (filterStartDate && filterStartDate.getDate())
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
                || level.prefix === CategorizationPrefixes.ReportingSection
            ) {
                /** If user doesn't want to show accounting type row - skip it */
                if (
                    level.prefix === CategorizationPrefixes.AccountingType && !this.userPreferencesService.localPreferences.value.showAccountingTypeTotals
                    || ((level.prefix === CategorizationPrefixes.ReportingGroup || level.prefix === CategorizationPrefixes.ReportingSection) && !this.userPreferencesService.localPreferences.value.showReportingSectionTotals)
                ) {
                    return true;
                }

                if (level.prefix === CategorizationPrefixes.ReportingGroup || level.prefix === CategorizationPrefixes.ReportingSection) {
                    let reportSectionId;
                    const categoryId = transactionObj.subCategoryId || transactionObj.categoryId;
                    if (categoryId) {
                        reportSectionId = this.reportSections.categorySectionMap[categoryId];
                        if (reportSectionId) {
                            const reportSection = this.reportSections.sections[reportSectionId];
                            if (reportSection) {
                                transactionObj['levels'][`level${levelNumber++}`] = level.prefix + (
                                    level.prefix === CategorizationPrefixes.ReportingGroup
                                        ? reportSection.group
                                        : reportSectionId
                                );
                            }
                        }
                    }
                    if ((!categoryId || !reportSectionId) &&
                        level.prefix === CategorizationPrefixes.ReportingGroup
                    ) {
                        transactionObj['levels'][`level${levelNumber++}`] = level.prefix + 'N/A';
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
                text = key === 'N/A' ? key : this.ls.l('SectionGroup_' + key);
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
        const category = this.getCategoryParams(prefix);
        return category && category['namesSource'] ? this.getDescendantPropValue(this, category.namesSource) : undefined;
    }

    getCategoryParams(prefix: CategorizationPrefixes): CategorizationModel {
        return this.categorization.find(item => item.prefix === prefix);
    }

    getDescendantPropValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    getDetailFilterFromCell(cellObj): StatsDetailFilter {
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
            currencyId: this.cfoPreferencesService.selectedCurrencyId,
            accountIds: accountsIds,
            businessEntityIds: this.requestFilter.businessEntityIds || [],
            searchTerm: '',
            forecastModelId: this.selectedForecastModelId
        };

        this.showAllVisible = false;
        this.showAllDisable = false;

        cellObj.cell.rowPath.forEach(item => {
            if (item) {
                let [ key, prefix ] = [ item.slice(2), item.slice(0, 2) ];

                if (key !== CashflowTypeTotal && item !== CategorizationPrefixes.ReportingGroup + 'N/A') {
                    const property = this.getCategoryParams(prefix)['statsKeyName'];
                    filterParams[property] = key;
                }
            } else {
                filterParams['categoryId'] = -1;
            }
        });
        return StatsDetailFilter.fromJS(filterParams);
    }

    formattingDate(path): CellInterval {
        let columnFields = {};
        this.getColumnFields().forEach(item => {
            columnFields[item.caption.toLowerCase()] = item.areaIndex;
        });

        let startDate: moment.Moment = moment.utc('1970-01-01');
        let endDate: moment.Moment = moment.utc('1970-01-01');
        let year = path[columnFields['year']];
        let quarter = path[columnFields['quarter']];
        let month = path[columnFields['month']];
        let week = path[columnFields['week']];
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
            if (week) {
                let weekInfo = JSON.parse(week);
                startDate = moment(weekInfo.startDate).utc();
                endDate = moment(weekInfo.endDate).utc();
            } else if (projected) {
                let currentDate = moment().date();
                /** Exclude projected */
                if (projected === Projected.Forecast) {
                    startDate.date(currentDate + 1);
                    /** or mtd dates */
                } else if (projected === Projected.Mtd) {
                    endDate.date(currentDate - 1);
                } else if (projected === Projected.Today) {
                    startDate.date(currentDate);
                    endDate.date(currentDate);
                }
            }
        }

        return { startDate: startDate, endDate: endDate };
    }

    /** Get all column fields */
    getColumnFields() {
        return this.apiTableFields.filter(field => field.area === 'column' && field.visible);
    }

    projectedSelector(dataItem) {
        let result: Projected;
        let itemMonthFormatted = dataItem.initialDate.format('YYYY.MM');
        let currentMonthFormatted = moment().format('YYYY.MM');
        if (itemMonthFormatted !== currentMonthFormatted) {
            result = currentMonthFormatted > itemMonthFormatted ? Projected.PastTotal : Projected.FutureTotal;
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
    }

    formatAsCurrencyWithLocale(value: number, fractionDigits = 2, locale: string = null) {
        if (!locale)
            locale = this.cashflowGridSettings.localizationAndCurrency.numberFormatting.indexOf('.') == 1 ? 'tr' : 'en-EN';
        value = value > -0.01 && value < 0.01 ? 0 : value;
        return this.currencyPipe.transform(
            value,
            this.cfoPreferencesService.selectedCurrencyId,
            this.cfoPreferencesService.selectedCurrencySymbol,
            `0.${fractionDigits}-${fractionDigits}`
        );
    }


    /**
     * Method that check if the cell of format CTI (Category Type Income) is fit to the filter
     * It looks all pathes where the cell value is presented and if any of the elements of these pathes
     * contains filter string - return true
     * @param rowInfo - info of format (CategoryPrefixes + Key)
     * @param filter - string for which to filter
     * @return {boolean}
     */
    rowFitsToFilter(summaryCell, cellValue) {
        let result = false;
        const rowInfo = cellValue || '';
        /** add the rowInfo to cash to avoid checking for every cell */
        if (this.cachedRowsFitsToFilter.has(rowInfo))
            result = this.cachedRowsFitsToFilter.get(rowInfo);
        else {
            result = Object.keys(this.treePathes).some(strPath => {
                let arrPath = strPath.split(',');
                if (arrPath.indexOf(rowInfo) >= 0) {
                    /** Handle for uncategorized */
                    if (!rowInfo) {
                        let parent = summaryCell.parent('row');
                        let parentInfo = parent.value(parent.field('row').dataField);
                        if (arrPath.indexOf(parentInfo) >= 0 && this.pathContainsFilter(arrPath, this.filterBy)) {
                            return true;
                        }
                    } else if (this.pathContainsFilter(arrPath, this.filterBy)) {
                        return true;
                    }
                }
                return false;
            });
            this.cachedRowsFitsToFilter.set(rowInfo, result);
        }
        return result;
    }

    private pathContainsFilter(path: string[], filter: string) {
        filter = filter.toLowerCase();
        return path.some((value: string) => {
            if (value) {
                const key = value.slice(2);
                const prefix: any = value.slice(0, 2);
                const dataSource = this.getNamesSourceLink(prefix);
                if (dataSource) {
                    for (let i = 0; i < dataSource.length; i++) {
                        let customizedFieldText = this.customizeFieldText({value: value}).toLowerCase();
                        if (customizedFieldText && customizedFieldText.indexOf(filter) >= 0 && key == dataSource[i].id)
                            return true;
                    }
                } else
                    return key.toLowerCase().indexOf(filter) >= 0;
            } else
                return this.ls.l('Unclassified').toLowerCase().indexOf(filter) >= 0;
        });
    }

    /**
     *  recalculates sum of the starting balance (including previous totals)
     *  and recalculates ending cash positions values (including previous totals)
     *  @param summaryCell
     *  @return {number}
     */
    calculateSummaryValue() {
        return (summaryCell: DevExpress.ui.dxPivotGridSummaryCell) => {
            const cellRow: any = summaryCell.field('row');
            const cellValue = cellRow && summaryCell.value(cellRow.dataField);
            /** Hide fields */
            if ((!this.cashflowGridSettings.general.showBalanceDiscrepancy && this.isCellDiscrapencyCell(summaryCell, cellRow, cellValue))
                || cellValue === 'hidden'
                /** To hide rows that not correspond to the search */
                || (this.filterBy && cellRow && !this.rowFitsToFilter(summaryCell, cellValue))
            ) {
                return null;
            }

            let prevWithParent = this.getPrevWithParent(summaryCell);

            /** calculation for ending cash position value */
            if (prevWithParent !== null && this.isColumnGrandTotal(summaryCell, cellRow)) {
                return this.modifyGrandTotalSummary(summaryCell);
            }

            if (this.isColumnGrandTotal(summaryCell, cellRow)) {
                return this.modifyGrandTotalSummary(summaryCell);
            }

            /** if cell is starting balance account cell - then add account sum from previous period */
            if (prevWithParent !== null && this.isStartingBalanceAccountCell(summaryCell, cellRow)) {
                return this.modifyStartingBalanceAccountCell(summaryCell, prevWithParent)
                    + this.getCurrentValueForStartingBalanceCell(summaryCell);
            }

            /** If the column is starting balance column but without prev - calculate */
            if (this.isStartingBalanceAccountCell(summaryCell, cellRow)) {
                return this.getCurrentValueForStartingBalanceCell(summaryCell) + (summaryCell.value() || 0);
            }

            /** For proper grand total calculation and proper sorting
             *  If the grand total is balance or ending cash position cell -
             *  get the previous value - not the total of every cell
             */
            if (this.isRowGrandTotal(summaryCell) && (this.isStartingBalanceAccountCell(summaryCell, cellRow) || this.isEndingBalanceAccountCell(summaryCell, cellRow))) {
                let cellAccount = this.initialData.bankAccountBalances.find(bankAccount => bankAccount.bankAccountId === cellValue);
                return cellAccount ? cellAccount.balance : 0;
            }

            /** if cell is ending cash position account summary cell */
            if (prevWithParent !== null && this.isEndingBalanceAccountCell(summaryCell, cellRow)) {
                return this.modifyEndingBalanceAccountCell(summaryCell, prevWithParent);
            }

            if (this.isEndingBalanceAccountCell(summaryCell, cellRow)) {
                let startedBalanceCell = summaryCell.slice(<any>0, PSB),
                    startedBalanceCellValue = startedBalanceCell ? (startedBalanceCell.value() || 0) : 0,
                    currentCellValue = summaryCell.value() || 0,
                    reconciliationTotal = this.getCellValue(summaryCell, Reconciliation);
                return startedBalanceCellValue + reconciliationTotal + currentCellValue;
            }

            /** if the value is a balance value -
             *  then get the prev columns grand total for the column and add */
            if (prevWithParent !== null && this.isCellIsStartingBalanceSummary(summaryCell, cellRow, cellValue)) {
                return this.modifyStartingBalanceSummaryCell(summaryCell, prevWithParent)
                    + this.getCurrentValueForStartingBalanceCell(summaryCell);
            }

            if (this.isCellIsStartingBalanceSummary(summaryCell, cellRow, cellValue)) {
                return (summaryCell.value(true) || 0) + this.getCurrentValueForStartingBalanceCell(summaryCell);
            }

            return this.cellRowIsNotEmpty(cellRow, cellValue) ? summaryCell.value() || 0 : null;
        };
    }

    getYearHistoricalSelectorWithCurrent(): any {
        return data => {
            let currentYear = moment().year();
            let itemYear = data.initialDate ? data.initialDate.year() : data.date.year();
            let result = Periods.Historical;
            if (currentYear < itemYear) {
                result = Periods.Forecast;
            } else if (currentYear === itemYear) {
                result = Periods.Current;
            }
            return result;
        };
    }

    /**
     * Gets the text for months header
     * @returns {string}
     */
    getMonthHeaderCustomizer(): any {
        return cellInfo => cellInfo.valueText.slice(0, 3).toUpperCase();
    }

    /**
     * Gets the text for quarters header
     * @returns {string}
     */
    getQuarterHeaderCustomizer(): any {
        return cellInfo => cellInfo.valueText.slice(0, 3).toUpperCase();
    }

    isColumnGrandTotal(summaryCell, cellRow) {
        return cellRow !== null && summaryCell.value(summaryCell.field('row')) === PT;
    }

    isRowGrandTotal(summaryCell) {
        return summaryCell.field('column') === null;
    }

    isStartingBalanceAccountCell(summaryCell, cellRow) {
        return cellRow !== null &&
            cellRow.dataField === 'levels.level1' &&
            summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === PSB;
    }

    isCellIsStartingBalanceSummary(summaryCell, cellRow, cellValue): boolean {
        return cellRow !== null && cellValue === (CategorizationPrefixes.CashflowType + StartedBalance);
    }

    isCellDiscrapencyCell(summaryCell, row, value): boolean {
        let parentCell = summaryCell.parent('row');
        return (row !== null && value === (CategorizationPrefixes.CashflowType + Reconciliation)) ||
            (parentCell !== null && parentCell.value(parentCell.field('row')) === (CategorizationPrefixes.CashflowType + Reconciliation));
    }

    cellRowIsNotEmpty(cellRow, cellValue) {
        return cellRow && (cellValue !== undefined || cellRow.dataField === 'levels.level1' ||
               (this.userPreferencesService.localPreferences.value.showReportingSectionTotals && cellRow.dataField === 'levels.level2'));
    }

    isEndingBalanceAccountCell(summaryCell, cellRow) {
        return cellRow !== null &&
            cellRow.dataField === 'levels.level1' &&
            summaryCell.parent('row') && summaryCell.parent('row').value(summaryCell.parent('row').field('row')) === PT;
    }

    getHistoricalCustomizer() {
        return cellInfo => this.ls.l(this.historicalTextsKeys[cellInfo.value]).toUpperCase();
    }

    weekHeaderSelector(dataItem): string {
        let weekInfo = new WeekInfo(dataItem.initialDate);
        return JSON.stringify(weekInfo);
    }

    weekSorting(firstItem, secondItem) {
        return JSON.parse(firstItem.value).weekNumber > JSON.parse(secondItem.value).weekNumber ? 1 : -1;
    }

    getWeekHeaderCustomizer(): any {
        return (weekInfo: {value: string, valueText: string}) => {
            let weekInfoObj: WeekInfo = JSON.parse(weekInfo.value);
            let startDate = moment(weekInfoObj.startDate).utc().format('MM.DD');
            let endDate = moment(weekInfoObj.endDate).utc().format('MM.DD');
            return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
        };
    }

    getCurrentValueForStartingBalanceCell(summaryCell) {
        const cellData = <any>this.getCellData(summaryCell, summaryCell.value(summaryCell.field('row')).slice(2), StartedBalance);
        return this.calculateCellValue(cellData, this.zeroAdjustmentsList, true);
    }

    /**
     * Modify the value of the starting balance account cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceAccountCell(summaryCell, prevWithParent) {
        const prevEndingAccountValue = this.getCellValue(prevWithParent, Total);
        const prevIsNotFirstColumn = !!this.getPrevWithParent(prevWithParent);
        const prevCellValue = prevWithParent ? prevWithParent.value(prevIsNotFirstColumn) || 0 : 0;
        const prevReconciliation = this.getCellValue(prevWithParent, Reconciliation);
        const adjustmentsAlreadyIncludedInStartedBalances = prevIsNotFirstColumn
            ? this.getCurrentValueForStartingBalanceCell(prevWithParent)
            : 0;
        return prevEndingAccountValue + prevCellValue + prevReconciliation - adjustmentsAlreadyIncludedInStartedBalances;
    }

    /**
     * Modify the value of the starting balance summary cell to have a proper calculation
     * @param summaryCell
     * @param prevWithParent
     * @return {number}
     */
    modifyStartingBalanceSummaryCell(summaryCell, prevWithParent) {
        const prevTotal = prevWithParent.slice(0, PT);
        const currentCellValue = summaryCell.value() || 0;
        const prevTotalValue = prevTotal ? prevTotal.value() || 0 : 0;
        const prevIsNotFirstColumn = !!this.getPrevWithParent(prevWithParent);
        const prevCellValue = prevWithParent ? prevWithParent.value(prevIsNotFirstColumn) || 0 : 0;
        const prevReconciliation = prevWithParent.slice(0, PR);
        const prevReconciliationValue = prevReconciliation ? prevReconciliation.value() || 0 : 0;
        const adjustmentsAlreadyIncludedInStartedBalances = prevIsNotFirstColumn
            ? this.getCurrentValueForStartingBalanceCell(prevWithParent)
            : 0;
        return currentCellValue + prevTotalValue + prevCellValue + prevReconciliationValue - adjustmentsAlreadyIncludedInStartedBalances;
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
            reconciliationTotalValue = reconciliationTotal && reconciliationTotal.value() || 0,
            adjustmentsAlreadyIncludedInStartedBalances = this.getCurrentValueForStartingBalanceCell(summaryCell);
        return currentCellValue + startedBalanceCellValue + reconciliationTotalValue - adjustmentsAlreadyIncludedInStartedBalances;
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

    /**
     * Gets the cell value from the specific cell
     * cellData - summaryCell object of devextreme
     * target - StartedBalance | Total | Reconciliation
     */
    getCellValue(summaryCell, target, isCalculatedValue = underscore.contains([StartedBalance, Reconciliation], target)) {

        let targetPeriodAccountCachedValue;
        const accountId = summaryCell.value(summaryCell.field('row'), true).slice(2);
        const targetPeriodCell = summaryCell.parent('row') ? summaryCell.parent('row').slice(0, CategorizationPrefixes.CashflowType + target) : null;
        const targetPeriodAccountCell = targetPeriodCell ? targetPeriodCell.child('row', CategorizationPrefixes.AccountName + accountId) : null;

        /** if we haven't found the value from the another period -
         *  then it hasn't been expanded and we should find out whether the value is in cash */
        if (targetPeriodAccountCell === null) {
            const cellData = this.getCellData(summaryCell, accountId, target);
            let key = cellData.toString();
            /** if we haven't found the value in cash - then we should calculate the value in the cashflow data by ourselves */
            if (!this.anotherPeriodAccountsValues.has(key)) {
                /** calculate the cell value using the cell data and cashflowData */
                targetPeriodAccountCachedValue = this.calculateCellValue(cellData, this.cashflowData);
                this.setAnotherPeriodAccountCachedValue(key, targetPeriodAccountCachedValue);
            } else {
                targetPeriodAccountCachedValue = this.anotherPeriodAccountsValues.get(key);
            }
        }
        //else {
        //    /** add the prevEndingAccount value to the cash */
        //    this.setAnotherPeriodAccountCachedValue(cellData.toString(), targetPeriodAccountCell.value(isCalculatedValue));
        //}

        return targetPeriodAccountCachedValue ?
            targetPeriodAccountCachedValue :
            (targetPeriodAccountCell ? targetPeriodAccountCell.value(isCalculatedValue) || 0 : 0);
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

    getCellData(summaryCell, accountId, cashflowTypeId) {
        const groupInterval = summaryCell.field('column') ? summaryCell.field('column').groupInterval || 'projected' : 'historical',
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

    /** set the prev ending account value to the cash */
    setAnotherPeriodAccountCachedValue(key, value) {
        this.anotherPeriodAccountsValues.set(key, value);
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


    /** check the date - if it is mtd date - disallow editing, if today or projected - welcome on board */
    cellIsNotHistorical(cellObj): boolean {
        let path = cellObj.cell.path || cellObj.cell.columnPath;
        let cellDateInterval = this.formattingDate(path);
        let currentDate = DateHelper.getCurrentUtcDate();
        return cellDateInterval.endDate.isAfter(currentDate, 'day') ||
            currentDate.isBetween(cellDateInterval.startDate, cellDateInterval.endDate, 'day') ||
            (currentDate.isSame(cellDateInterval.startDate, 'day') && currentDate.isSame(cellDateInterval.endDate, 'day'));
    }


    getDataSourceItemByPath(dataSourceItems: any[], path: any[]) {
        let pathValue = path.shift();
        for (let i = 0; i < dataSourceItems.length; i++) {
            let item = dataSourceItems[i];
            if (item.value == pathValue) {
                if (path.length == 0)
                    return item;

                if (!item.children)
                    return null;

                return this.getDataSourceItemByPath(item.children, path);
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
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isStartingBalanceDataColumn(cell, area): boolean {
        return area === 'data' && cell.rowPath !== undefined && cell.rowPath[0] === PSB;
    }

    /**
     * whether or not the cell is balance sheet data cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isEndingBalanceDataColumn(cell, area): boolean {
        return area === 'data' && cell.rowPath !== undefined && cell.rowPath[0] === PT;
    }

    getStartingBalanceAdjustments(cell) {
        return this.zeroAdjustmentsList.filter(cashflowItem => {
            return (
                    cell.rowPath[1] === CategorizationPrefixes.AccountName + cashflowItem.accountId
                    || (cell.rowPath.length === 1 && cell.rowPath[0] === PSB)
                ) &&
                this.cellStartsFromPeriod(cashflowItem.initialDate, cell.columnPath);
        });
    }

    getEndingBalanceAdjustments(cell) {
        return this.zeroAdjustmentsList.filter(cashflowItem => {
            return cashflowItem.adjustmentType === AdjustmentType._0 &&
                (
                    cell.rowPath[1] === CategorizationPrefixes.AccountName + cashflowItem.accountId
                    || (cell.rowPath.length === 1 && cell.rowPath[0] === PT)
                ) &&
                this.cellIsInPeriod(cashflowItem.initialDate, cell.columnPath)
                && !this.cellStartsFromPeriod(cashflowItem.initialDate, cell.columnPath);
        });
    }

    private cellStartsFromPeriod(cellDate: moment.Moment, columnPath: string[]) {
        const period = this.formattingDate(columnPath);
        const startDate = moment.max(moment(this.requestFilter.startDate).utc(), period.startDate);
        return cellDate.isSame(startDate);
    }

    private cellIsInPeriod(cellDate: moment.Moment, columnPath: string[]): boolean {
        const period = this.formattingDate(columnPath);
        return cellDate.isBetween(period.startDate, period.endDate, 'days', '[]');
    }

    /**
     * whether or not the cell is balance sheet total data cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isStartingBalanceTotalDataColumn(cellObj): boolean {
        return cellObj.area === 'data' && cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath[0] === PSB &&
            (cellObj.cell.rowType === PT || cellObj.cell.rowPath.length === 1);
    }

    /**
     * whether cell is cashflow type header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isCashflowTypeRowTotal(cell, area): boolean {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace ? path.length === 1 : false;
        }
        return result;
    }

    isReportingSectionRowTotal(cell, area): boolean {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            if (path && !cell.isWhiteSpace && path[path.length - 1]) {
                const prefix = path[path.length - 1].slice(0, 2);
                result = prefix === CategorizationPrefixes.ReportingSection || prefix === CategorizationPrefixes.ReportingGroup;
            } else {
                result = false;
            }
        }
        return result;
    }

    isAccountingRowTotal(cell, area): boolean {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace && path[path.length - 1] ? path[path.length - 1].slice(0, 2) === CategorizationPrefixes.AccountingType : false;
        }
        return result;
    }

    cellIsUnclassified(cell, area) {
        let result = false;
        if (area === 'row' || area === 'data') {
            let path = cell.path || cell.rowPath;
            result = path && !cell.isWhiteSpace && path[path.length - 1] === undefined;
        }
        return result;
    }

    /**
     * whether or not the cell is income or expenses header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isIncomeOrExpensesChildCell(cell, area) {
        return area === 'row' && cell.path && cell.path.length > 1 && (cell.path[0] === PI || cell.path[0] === PE);
    }

    /**
     * whether the cell is income or expenses header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isIncomeOrExpensesChildHeaderCell(cellObj): boolean {
        return cellObj.area === 'row' && cellObj.cell.path && cellObj.cell.path.length > 1 &&
            (cellObj.cell.path[0] === PI || cellObj.cell.path[0] === PE);
    }

    /**
     * whether the cell is net change header cell
     * @param cell - info about cell
     * @param area - area of the cell ('data', 'row', 'column')
     * return {boolean}
     */
    isNetChangeTotalCell(cellObj) {
        let pathProperty = cellObj.area === 'row' ? 'path' : 'rowPath';
        return cellObj.cell[pathProperty] && !cellObj.cell.isWhiteSpace && cellObj.cell[pathProperty].length === 1 && cellObj.cell[pathProperty][0] === PNC;
    }

    isAccountHeaderCell(cell, area): boolean {
        return area === 'row' && cell.path && cell.path[1] && cell.path[1].slice(0, 2) === CategorizationPrefixes.AccountName;
    }

    /**
     * whether or not the cell is income or expenses data cell
     * @param cellObj - the object that pivot grid passes to the onCellPrepared event
     * return {boolean}
     */
    isIncomeOrExpensesDataCell(cell, area) {
        return area === 'data' && cell.rowPath !== undefined && cell.rowPath.length === 1 &&
            (cell.rowPath[0] === PI || cell.rowPath[0] === PE);
    }

    /** Whether the cell is the ending cash position header cell */
    isTotalEndingHeaderCell(cellObj) {
        return cellObj.cell.path !== undefined &&
            cellObj.cell.path.length === 1 &&
            cellObj.cell.path[0] === PT &&
            !cellObj.cell.isWhiteSpace;
    }

    isStartingBalanceWhiteSpace(cell) {
        return cell.isWhiteSpace &&
            cell.path.length === 1 &&
            cell.path[0] === PSB;
    }

    /** Whether the cell is the ending cash position data cell */
    isTotalEndingDataCell(cellObj) {
        return cellObj.cell.rowPath !== undefined &&
            cellObj.cell.rowPath.length === 1 &&
            (cellObj.cell.rowPath[0] === PT);
    }

    isAllTotalBalanceCell(cell) {
        return cell.rowPath !== undefined && (cell.rowPath[0] === PT || cell.rowPath[0] === PNC);
    }

    isTransactionRows(cell) {
        return cell.rowPath !== undefined &&
            cell.rowPath.length !== 1 &&
            (cell.rowPath[0] === PI || cell.rowPath[0] === PE || cell.rowPath[0] === PCTT);
    }

    isReconciliationRows(cell) {
        return cell.rowPath !== undefined && cell.rowPath[0] === PR;
    }

    /**
     * whether the cell is the historical cell
     * @param cellObj
     * @returns {boolean}
     */
    isHistoricalCell(cellObj) {
        return cellObj.area === 'column' && cellObj.rowIndex === 0;
    }

    createActionButton(name, attributes: object = {}) {
        let a = document.createElement('a');
        a.className = 'dx-link dx-link-' + name;
        a.innerText = this.ls.l(capitalize(name));
        if (attributes) {
            for (let key in attributes) {
                a.setAttribute(key, attributes[key]);
            }
        }
        return a;
    }

    applyOptionsToElement(element, ...optionsList) {
        for (let options of optionsList) {
            options.classes.length && element.classList.add(...options.classes);
            options.parentClasses.length && element.parentElement.classList.add(...options.parentClasses);
            if (Object.keys(options.attributes).length) {
                for (let attribute in options.attributes) {
                    element.setAttribute(attribute, options.attributes[attribute]);
                }
            }
            options.elementsToAppend.length && options.elementsToAppend.forEach(appendElement => element.appendChild(appendElement));
            options.childrenSelectorsToRemove.length && options.childrenSelectorsToRemove.forEach(selectorToRemove => element.querySelector(selectorToRemove).remove());
            if (Object.keys(options.eventListeners).length) {
                for (let listener in options.eventListeners) {
                    element[listener] = options.eventListeners[listener];
                }
            }
            options.eventsToTrigger.length && options.eventsToTrigger.forEach(eventName => element[eventName]());
            if (options.value !== null) {
                /** @todo add class to the span with actual value and get it */
                element.firstElementChild.innerHTML = options.value;
            }
        }
    }


    getCellInfo(cellObj, defaultValues: any = {}): CellInfo {
        const categoryId = this.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.Category);
        const subCategoryId = this.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.SubCategory);
        return {
            date: this.formattingDate(cellObj.cell.columnPath),
            fieldCaption: this.getLowestFieldCaptionFromPath(cellObj.cell.columnPath, this.getColumnFields()),
            cashflowTypeId: this.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.CashflowType)
            || this.getCashFlowTypeByCategory(subCategoryId || categoryId, this.categoryTree)
            || defaultValues.cashflowTypeId,
            categoryId: categoryId,
            subCategoryId: subCategoryId,
            transactionDescriptor: this.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor),
            accountingTypeId: this.getCategoryValueByPrefix(cellObj.cell.rowPath, CategorizationPrefixes.AccountingType)
        };
    }


    getLowestFieldCaptionFromPath(path, columnFields) {
        let lastOpenedColumnIndex = path.length - 1;
        let lastOpenedField = columnFields[lastOpenedColumnIndex];
        return lastOpenedField ? lastOpenedField.caption.toLowerCase() : null;
    }

    /**
     * Get the classes for the current cells such as currentYear, currentQuarter and currentMonth
     @todo refactor
     */
    getCurrentPeriodsClass(cell, area) {
        let className;
        const path = cell.path || cell.columnPath;
        if (area !== 'row' && path && path.length) {
            let fieldIndex = path.length - 1;
            let cellField = this.getColumnFields()[fieldIndex];
            let fieldCaption = cellField.caption.toLowerCase();
            let cellValue = path[fieldIndex];
            let currentDate = moment();
            if (cellField.dataType === 'date' || fieldCaption === 'week') {
                let periodFormat;
                switch (fieldCaption) {
                    case 'year'    : periodFormat = 'YYYY'; break;
                    case 'quarter' : periodFormat = 'YYYY.QQ'; break;
                    case 'month'   : periodFormat = 'YYYY.MM'; break;
                    case 'week'    : periodFormat = 'YYYY.MM.WW'; break;
                    case 'day'     : periodFormat = 'YYYY.MM.DD'; break;
                }
                let cellDate = this.getDateByPath(path, this.getColumnFields(), fieldCaption);
                let cellDateFormated = cellDate.format(periodFormat);
                let currentDateFormatted = currentDate.format(periodFormat);
                if (cellDateFormated === currentDateFormatted) {
                    className = `current${capitalize(fieldCaption)}`;
                } else if (cellDateFormated < currentDateFormatted) {
                    className = `prev${capitalize(fieldCaption)}`;
                } else if (cellDateFormated > currentDateFormatted) {
                    className = `next${capitalize(fieldCaption)}`;
                }
            } else if (fieldCaption === 'projected') {
                if (cellValue === Projected.Today) {
                    className = `current${capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Mtd || cellValue === Projected.PastTotal) {
                    className = `prev${capitalize(fieldCaption)}`;
                } else if (cellValue === Projected.Forecast || cellValue === Projected.FutureTotal) {
                    className = `next${capitalize(fieldCaption)}`;
                }
            } else if (fieldCaption === 'historical') {
                if (cellValue === Periods.Current) {
                    className = `current${capitalize(fieldCaption)}`;
                } else if (cellValue === Periods.Historical) {
                    className = `prev${capitalize(fieldCaption)}`;
                } else if (cellValue === Periods.Forecast) {
                    className = `next${capitalize(fieldCaption)}`;
                }
            }
        }
        return className;
    }

    /**
     * Return the date object from the cell
     * @param path
     * @param columnFields
     * @return {any}
     */
    getDateByPath(columnPath, columnFields, lowestCaption ?: string) {
        lowestCaption = lowestCaption || this.getLowestFieldCaptionFromPath(columnPath, columnFields);
        let date = moment.unix(0).tz('UTC');
        columnFields.every(dateField => {
            let areaIndex = this.getAreaIndexByCaption(dateField.caption, 'column');
            let fieldValue = columnPath[areaIndex];
            if (dateField.dataType === 'date') {
                let method = dateField.groupInterval === 'day' ? 'date' : dateField.groupInterval;
                if (fieldValue) {
                    fieldValue = dateField.groupInterval === 'month' ? fieldValue - 1 : fieldValue;
                    /** set the new interval to the moment */
                    date[method](fieldValue);
                }
            } else if (dateField.caption === 'Week') {
                let weekNumber = JSON.parse(fieldValue).weekNumber;
                date.isoWeek(weekNumber);
            } else if (dateField.caption === 'Projected') {
                let currentDate = moment().date();
                if (fieldValue) {
                    if (fieldValue === Projected.Today) {
                        date.date(currentDate);
                    } else if (fieldValue === Projected.Mtd || fieldValue === Projected.PastTotal) {
                        date.date(1);
                    } else if (fieldValue === Projected.Forecast || fieldValue === Projected.FutureTotal) {
                        date.date(currentDate + 1);
                    }
                }
            }
            return dateField.caption.toLowerCase() !== lowestCaption;
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

    /**
     * Creates historical cell in historical row
     * @param period
     */
    createHistoricalCell(period) {
        let positionMethod = period === 'next' ? 'after' : 'before',
            textKey = period === 'next' ? this.historicalTextsKeys[2] : this.historicalTextsKeys[0],
            text = this.ls.l(textKey);
        $('.historicalRow .currentHistorical')
            [positionMethod](function () {
            return `<td class="dx-pivotgrid-expanded historicalField ${period}Historical">${text.toUpperCase()}</td>`;
        });
    }


    /**
     * Return index in path for field for a row or column areas
     * @param {string} caption
     * @param {"row" | "column"} area
     * @return {any}
     */
    getAreaIndexByCaption(caption: string, area: 'row' | 'column') {
        let areaIndex = null;
        caption = caption.toLowerCase();
        this.apiTableFields.some(field => {
            if (field.area === area) {
                if (field.caption.toLowerCase() === caption) {
                    areaIndex = field.areaIndex;
                    return true;
                }
            }
        });
        return areaIndex;
    }


    /**
     * Gets the mtd or projected 0 or 1 from the path
     * @param projected
     */
    getProjectedValueByPath(path) {
        let projectedFieldIndex = this.getAreaIndexByCaption('projected', 'column');
        return projectedFieldIndex ? path[projectedFieldIndex] : undefined;
    }

    updateZeroAdjustmentsList() {
        this.zeroAdjustmentsList = this.adjustmentsList.filter(item => {
            return item.adjustmentType === AdjustmentType._0;
        });
    }

    /**
     * Check if date is weekend date
     * @param date
     */
    isWeekend(date) {
        /** if day number is 0 (sunday) or 6 (saturday) */
        return date.day() === 0 || date.day() === 6;
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
     * for every day that is absent in cashflow data add stub object
     * (hack to show all days, months and quarters for all years in cashflow data page)
     * @param {TransactionStatsDtoExtended[]} cashflowData
     * @return {TransactionStatsDtoExtended[]}
     */
    getStubsCashflowDataForAllPeriods(cashflowData: TransactionStatsDtoExtended[], period = GroupByPeriod.Monthly) {
        this.allYears = [];
        this.yearsAmount = 0;
        let existingPeriods: string[] = [],
            minDate: moment.Moment,
            maxDate: moment.Moment,
            periodFormat = period === GroupByPeriod.Monthly ? 'YYYY-MM' : 'YYYY-MM-DD';

        cashflowData.forEach(cashflowItem => {
            /** Move the year to the years array if it is unique */
            let date = cashflowItem.initialDate;
            let transactionYear = date.year();
            let formattedDate = date.utc().format(periodFormat);
            if (this.allYears.indexOf(transactionYear) === -1) this.allYears.push(transactionYear);
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
            if (!minDate || cashflowItem.date < minDate)
                minDate = moment(date);
            if (!maxDate || cashflowItem.date > maxDate)
                maxDate = moment(date);
        });
        this.allYears = this.allYears.sort();
        let stubsInterval = this.getStubsInterval(minDate, maxDate, existingPeriods, periodFormat);
        this.yearsAmount = stubsInterval.endDate.diff(stubsInterval.startDate, 'years') + 1;

        /** cycle from started date to ended date */
        /** added fake data for each date that is not already exists in cashflow data */
        let accountId = cashflowData[0] ? cashflowData[0].accountId : this.bankAccounts[0].id;
        let stubCashflowData = this.createStubsForPeriod(stubsInterval.startDate, stubsInterval.endDate, period, accountId, existingPeriods);
        if (this.requestFilter.dailyPeriods.length) {
            this.requestFilter.dailyPeriods.forEach(dailyPeriod => {
                let filterStart = this.requestFilter.startDate ? moment(this.requestFilter.startDate) : null;
                let filterEnd = this.requestFilter.endDate ? moment(this.requestFilter.endDate) : null;
                let start = filterStart && dailyPeriod.start.isBefore(filterStart) ? filterStart.utc() : dailyPeriod.start.utc();
                let end = filterEnd && dailyPeriod.end.isAfter(filterEnd) ? filterEnd.utc() : dailyPeriod.end.utc();
                let dailyStubs = this.createStubsForPeriod(start, end, GroupByPeriod.Daily, accountId, []);
                stubCashflowData = stubCashflowData.concat(dailyStubs);
            });
        }

        return stubCashflowData;
    }


    /**
     * Return stubs intervals
     * @param {moment.Moment} minDate
     * @param {moment.Moment} maxDate
     * @param {string[]} existingPeriods
     * @param {string} periodFormat
     * @return {{startDate: Moment.moment; endDate: Moment.moment}}
     */
    getStubsInterval(minDate: moment.Moment, maxDate: moment.Moment, existingPeriods: string[], periodFormat: string): { startDate: moment.Moment, endDate: moment.Moment } {

        let currentDate = this.getUtcCurrentDate();
        let filterStart = this.requestFilter.startDate;
        let filterEnd = this.requestFilter.endDate;

        /** If current date is not in existing - set min or max date as current */
        if (existingPeriods.indexOf(currentDate.format(periodFormat)) === -1) {
            if (currentDate.format(periodFormat) < minDate.format(periodFormat)) {
                minDate = currentDate;
                /** if endDate from filter */
            } else if (currentDate.format(periodFormat) > maxDate.format(periodFormat) &&
                (!filterEnd || (filterEnd && currentDate.isBefore(moment(filterEnd).utc())))
            ) {
                maxDate = currentDate;
            }
        }

        /** set max date to the end of year if current maxDate year is current year */
        if (maxDate.year() === currentDate.year()) {
            let endOfYear = maxDate.clone().endOf('year');
            if (!filterEnd || (filterEnd && endOfYear.isBefore(moment(filterEnd).utc()))) {
                maxDate = endOfYear;
            }
        }

        /** consider the filter */
        if (filterStart && (!minDate || moment(filterStart).utc().isAfter(minDate))) minDate = filterStart;
        if (filterEnd && (!maxDate || moment(filterEnd).utc().isAfter(maxDate))) maxDate = filterEnd;

        return { startDate: moment.utc(minDate), endDate: moment.utc(maxDate) };
    }


    createStubsForPeriod(startDate, endDate, groupingPeriod: GroupByPeriod, bankAccountId, existingPeriods = []): TransactionStatsDtoExtended[] {
        let stubs = [];
        let startDateCopy = moment(startDate),
            endDateCopy = moment(endDate),
            period: any = groupingPeriod === GroupByPeriod.Monthly ? 'month' : 'day',
            format = period === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        while (startDateCopy.isSameOrBefore(endDateCopy)) {
            let date = moment.tz(startDateCopy.format(format), format, 'utc');
            if (existingPeriods.indexOf(date.format(format)) === -1) {
                stubs.push(
                    this.createStubTransaction({
                        'cashflowTypeId': StartedBalance,
                        'accountId': bankAccountId,
                        'date': moment(date).add(date.toDate().getTimezoneOffset(), 'minutes'),
                        'initialDate': date
                    })
                );
            }
            startDateCopy.add(1, period);
        }
        return stubs;
    }


    /**
     * Return the stub transaction
     * @param stubObj - the object with own custom data for stub transaction
     * @param path
     * @return {TransactionStatsDto & any}
     */
    createStubTransaction(stubObj, path: string[] = []) {
        let stubTransaction = {
            'adjustmentType': null,
            'accountId': null,
            'currencyId': this.cfoPreferencesService.selectedCurrencyId,
            'amount': 0,
            'comment': null,
            'date': null,
            'initialDate': null,
            'forecastId': null,
            'isStub': true
        };
        if (path && path.length) {
            path.forEach(pathItem => {
                if (pathItem) {
                    let [ key, prefix ] = [ pathItem.slice(2), pathItem.slice(0, 2) ];
                    let categoryParams = this.getCategoryParams(prefix as CategorizationPrefixes);
                    stubTransaction[categoryParams['statsKeyName']] = key;
                }
            });
        }
        return this.addCategorizationLevels({ ...stubTransaction, ...stubObj });
    }

}
