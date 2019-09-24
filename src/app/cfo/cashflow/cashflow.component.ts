/** Core imports */
import { Component, OnInit, Injector, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ActionsSubject, select, Store } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import config from 'devextreme/core/config';
import TextBox from 'devextreme/ui/text_box';
import NumberBox from 'devextreme/ui/number_box';
import Button from 'devextreme/ui/button';
import Tooltip from 'devextreme/ui/tooltip';
import SparkLine from 'devextreme/viz/sparkline';
import ScrollView from 'devextreme/ui/scroll_view';
import * as moment from 'moment-timezone';
import { CacheService } from 'ng2-cache-service';
import { Observable, BehaviorSubject, Subject, forkJoin, combineLatest, of, merge } from 'rxjs';
import {
    tap,
    finalize,
    first,
    filter,
    pluck,
    mergeMap,
    mergeAll,
    map,
    mapTo,
    publishReplay,
    refCount,
    skip,
    switchMap,
    takeUntil,
    toArray,
    withLatestFrom
} from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';
import * as $ from 'jquery';
import * as underscore from 'underscore';
import capitalize from 'underscore.string/capitalize';
import dasherize from 'underscore.string/dasherize';

/** Application imports */
import { AppService } from '@app/app.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CalculatorService } from '@app/cfo/shared/calculator-widget/calculator-widget.service';
import { TransactionDetailInfoComponent } from '@app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import {
    CashflowServiceProxy,
    StatsFilter,
    CashFlowInitialData,
    StatsDetailFilter,
    TransactionStatsDto,
    CashFlowForecastServiceProxy,
    CategoryTreeServiceProxy,
    ClassificationServiceProxy,
    BankAccountsServiceProxy,
    GetCategoryTreeOutput,
    InstanceType,
    UpdateForecastInput,
    Status,
    AddForecastInput,
    BankAccountDto,
    GroupByPeriod,
    AdjustmentType,
    DiscardDiscrepanciesInput,
    CashFlowStatsDetailDto,
    Period,
    UpdateTransactionsCategoryWithFilterInput,
    UpdateForecastsInput,
    CreateForecastsInput,
    MonthPeriodScope,
    CategoryDto,
    UpdateTransactionsCategoryInput,
    UpdateCategoryInput,
    RenameForecastModelInput,
    CreateForecastModelInput,
    SyncAccountBankDto,
    ReportTemplate,
    GetReportTemplateDefinitionOutput,
    CashFlowGridSettingsDto
} from '@shared/service-proxies/service-proxies';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from 'shared/filters/bank-account-filter/bank-account-filter.model';
import { CellsCopyingService } from 'shared/common/xls-mode/cells-copying/cells-copying.service';
import { CategorizationPrefixes } from './enums/categorization-prefixes.enum';
import { GeneralScope } from './enums/general-scope.enum';
import { Periods } from './enums/periods.enum';
import { Projected } from './enums/projected.enum';
import { CashflowService } from './cashflow.service';
import { CellInfo } from './models/cell-info';
import { IExpandLevel } from './models/expand-level';
import { IEventDescription } from './models/event-description';
import { TransactionStatsDtoExtended } from './models/transaction-stats-dto-extended';
import { WeekInfo } from './models/week-info';
import { OperationsComponent } from './operations/operations.component';
import { UserPreferencesService } from './preferences-dialog/preferences.service';
import { PreferencesDialogComponent } from './preferences-dialog/preferences-dialog.component';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import {
    CfoStore,
    CurrenciesStoreActions,
    CurrenciesStoreSelectors,
    ForecastModelsStoreActions,
    ForecastModelsStoreSelectors
} from '@app/cfo/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { BankAccountStatus } from '@shared/cfo/bank-accounts/helpers/bank-accounts.status.enum';
import { CashflowTypes } from '@app/cfo/cashflow/enums/cashflow-types.enum';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { AppFeatures } from '@shared/AppFeatures';

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

/** @todo check error cell_options_1.CellOptions is not a constructor when import from separate file */
export class CellOptions {
    classes?: string[] = [];
    parentClasses?: string[] = [];
    attributes?: any = {};
    elementsToAppend?: HTMLElement[] = [];
    childrenSelectorsToRemove?: string[] = [];
    eventListeners?: object = {};
    eventsToTrigger?: string[] = [];
    value?: string = null;
    general?: any = {};
}

@Component({
    selector: 'app-cashflow',
    templateUrl: './cashflow.component.html',
    styleUrls: ['./cashflow.component.less'],
    providers: [ CashFlowForecastServiceProxy, CategoryTreeServiceProxy, ClassificationServiceProxy, UserPreferencesService, BankAccountsServiceProxy, CellsCopyingService, CashflowService, CurrencyPipe, LifecycleSubjectsService ]
})
export class CashflowComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxPivotGridComponent) pivotGrid: DxPivotGridComponent;
    @ViewChild(DxDataGridComponent) cashFlowGrid: DxDataGridComponent;
    @ViewChild(OperationsComponent) operations: OperationsComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;
    transactionId: any;
    selectedBankAccountsIds;

    allowChangingForecast: boolean;
    disableAddForecastButton = true;
    private noRefreshedAfterSync: boolean;

    /** Config of header */
    headlineConfig: any;

    /** The main data for cashflow table */
    stubsCashflowDataForEmptyCategories: TransactionStatsDto[];

    private activeBankAccounts: BankAccountDto[];

    private syncAccounts: SyncAccountBankDto[];

    /** Source of the cashflow table (data fields descriptions and data) */
    dataSource;

    dragImg;

    statsDetailFilter: StatsDetailFilter = new StatsDetailFilter();
    private _statsDetailResult: Subject<CashFlowStatsDetailDto[]> = new Subject<CashFlowStatsDetailDto[]>();
    statsDetailResult$: Observable<CashFlowStatsDetailDto[]> = this._statsDetailResult.asObservable();
    statsDetailResult: CashFlowStatsDetailDto[];
    private detailsTab: BehaviorSubject<string> = new BehaviorSubject<string>('all');
    detailsTab$: Observable<string> = this.detailsTab.asObservable();
    /** changed displayedStatsDetails every time when detailsTab$ change (it change all times when statsDetailResult change (see this.detailsTab.next()) + when certain tabs chosen (history or forecast or all))*/
    displayedStatsDetails$: Observable<CashFlowStatsDetailDto[]> = this.detailsTab$.pipe(
        withLatestFrom(this.statsDetailResult$),
        map(([tab, details]: [string, CashFlowStatsDetailDto[]]) => tab === 'all' ? details : details.filter(item => tab === 'history' ? !!item.date : !!item.forecastId))
    );
    displayedStatsDetails: CashFlowStatsDetailDto[];

    /** Whether stats details contains historical data */
    detailsContainsHistorical: boolean;
    detailsContainsForecasts: boolean;
    detailsPeriodIsHistorical: boolean;
    detailsSomeHistoricalItemsSelected: boolean;
    detailsSomeForecastsItemsSelected: boolean;

    private filterByChangeTimeout: any;

    private rowCellRightPadding = 10;

    private sparkLinesWidth = 64;

    private accountNumberWidth = 53;

    private _calculatorShowed = false;

    private expandBeforeIndex: number = null;

    private hasStaticInstance;

    public set calculatorShowed(value: boolean) {
        this._calculatorShowed = value;
    }

    public get calculatorShowed(): boolean {
        return this._calculatorShowed;
    }

    /** Paths that should be clicked in onContentReady */
    private fieldPathsToClick = [];

    private currencyId = 'USD';

    /** @todo create model */
    private userPreferencesHandlers = {
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
                    handleMethod: this.showNegativeValuesInRed
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

    private cellTypesCheckMethods = {
        [GeneralScope.TransactionRows]: this.cashflowService.isTransactionRows,
        [GeneralScope.TotalRows]: this.cashflowService.isIncomeOrExpensesDataCell,
        [GeneralScope.BeginningBalances]: this.cashflowService.isStartingBalanceDataColumn,
        [GeneralScope.EndingBalances]: this.cashflowService.isAllTotalBalanceCell
    };

    private getUserPreferencesForCell = underscore.memoize(
        (cell, area) => {
            let options: CellOptions = new CellOptions();
            let userPreferences = this.getUserPreferencesAppliedTo('cells');
            userPreferences.forEach(preference => {
                if (preference['sourceValue'] !== null && (!preference.areas.length || preference.areas.indexOf(area) !== -1)) {
                    let preferenceOptions = preference['handleMethod'].call(this, cell, area, preference);
                    this.mergeOptions(options, preferenceOptions);
                }
            });
            return options;
        },
        function() { return JSON.stringify(arguments); }
    );

    private getCellOptionsFromCell = underscore.memoize(
        (cell, area: 'row' | 'column' | 'data', rowIndex: number, isWhiteSpace: boolean): CellOptions => {
            let options: CellOptions = new CellOptions();

            /** Add day (MON, TUE etc) to the day header cells */
            if ((area === 'column' || area === 'data') && cell.text !== undefined && this.isDayCell(cell)) {
                let path = cell.path || cell.columnPath;
                let date = this.cashflowService.formattingDate(path);
                options.attributes['data-is-weekend'] = this.cashflowService.isWeekend(date.startDate);
            }

            if (this.cashflowService.isCategoryCell(cell, area)) {
                options.classes.push('isCategoryCell');
            }

            if (this.cashflowService.isStartingBalanceWhiteSpace(cell)) {
                options.classes.push('startedBalanceWhiteSpace');
            }

            /** If cell is cashflow type header total row - add css classes to parent tr */
            if (this.cashflowService.isCashflowTypeRowTotal(cell, area)) {
                let path = cell.path || cell.rowPath;
                options.parentClasses.push(path[0].slice(2).toLowerCase() + 'Row', 'totalRow', 'grandTotal');
            }

            if (this.cashflowService.cellIsUnclassified(cell, area)) {
                options.parentClasses.push('unclassifiedRow');
            }

            if (this.cashflowService.isAccountingRowTotal(cell, area)) {
                options.parentClasses.push('totalRow', 'accountingTotal');
            }

            if (this.cashflowService.isReportingSectionRowTotal(cell, area)) {
                options.parentClasses.push('totalRow', 'reportingSectionTotal');
            }

            if (this.cashflowService.isAccountingRowTotal(cell, area)) {
                options.parentClasses.push('totalRow', 'accountingTotal');
            }

            /** added css class to the income and outcomes columns */
            if (this.cashflowService.isIncomeOrExpensesChildCell(cell, area)) {
                let cssClass = `${cell.path[0] === PI ? 'income' : 'expenses'}ChildRow`;
                options.parentClasses.push(cssClass);
            }

            /** add account number to the cell */
            if (this.cashflowService.isAccountHeaderCell(cell, area)) {
                let accountId = cell.path[1].slice(2);
                let account = this.cashflowService.bankAccounts.find(account => account.id == accountId);
                if (account && account.accountNumber) {
                    /** @todo check for memory leak */
                    let accountNumberElement = document.createElement('span');
                    accountNumberElement.className = 'accountNumber';
                    accountNumberElement.innerText = account.accountNumber;
                    options.elementsToAppend.push(accountNumberElement);
                }
                options.general['isAccountHeaderCell'] = true;
            }

            /** add current classes for the cells that belongs to the current periods */
            if (area === 'data' || (area === 'column' || rowIndex >= 1)) {
                let currentPeriodClass = this.cashflowService.getCurrentPeriodsClass(cell, area);
                if (currentPeriodClass) {
                    options.classes.push(currentPeriodClass);
                }
            }

            /** add zeroValue class for the data cells that have zero values to style them with grey color */
            if (area === 'data' && cell.value === 0) {
                options.classes.push('zeroValue');
            }

            /** disable expanding and hide the plus button of the elements that has no children */
            if (area === 'row' && cell.path && !cell.isWhiteSpace && cell.path.length !== this.pivotGrid.instance.getDataSource().getAreaFields('row', true).length) {
                if (!this.hasChildsByPath(cell.path)) {
                    this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', cell.path);
                    options.classes.push('emptyChildren');
                    options.childrenSelectorsToRemove.push('.dx-expand-icon-container');
                    /** Handle click for categories in onCellClick method */
                    if (!this.cashflowService.isCategoryCell(cell, area)) {
                        options.eventListeners['onclick'] = function(event) {
                            event.stopImmediatePropagation();
                        };
                    }
                }
            }

            /** If there are some cells to click - click it! */
            if (area === 'column' && cell.path) {
                if (this.fieldPathsToClick.length) {
                    let index;
                    this.fieldPathsToClick.forEach((path, arrIndex) => { if (path.toString() === cell.path.toString()) index = arrIndex; });
                    if (index !== undefined) {
                        delete this.fieldPathsToClick[index];
                        if (!cell.expanded) {
                            options.eventsToTrigger.push('click');
                        }
                    }
                }
            }

            /** Show descriptors in Italic */
            if (this.isTransactionDetailHeader(cell, area)) {
                options.classes.push('descriptor');
            }

            /** add draggable and droppable attribute to the cells that can be dragged */
            if (this.userPreferencesService.localPreferences.value.showCategoryTotals && this.cellCanBeDragged(cell, area)) {
                options.attributes['draggable'] = 'true';
                options.attributes['droppable'] = 'false';
                if (!this.cellIsHistorical(cell)) {
                    const cellDateInterval = this.cashflowService.formattingDate(cell.columnPath);
                    const futureForecastsYearsAmount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));
                    if (!this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)) {
                        options.classes.push('outOfAllowedForecastsInterval');
                    }
                }
            }

            if (this.isInstanceAdmin && this.cashflowService.isReconciliationRows(cell) && cell.value !== 0) {
                let actionButton = this.cashflowService.createActionButton('discard');
                options.elementsToAppend.push(actionButton);
            }

            const isStartingBalanceAccountCell = this.cashflowService.isStartingBalanceDataColumn(cell, area);
            const isEndingBalanceAccountCell = this.cashflowService.isEndingBalanceDataColumn(cell, area);
            if (isStartingBalanceAccountCell || isEndingBalanceAccountCell) {
                let elements = isStartingBalanceAccountCell
                    ? this.cashflowService.getStartingBalanceAdjustments(cell)
                    : this.cashflowService.getEndingBalanceAdjustments(cell);
                if (elements.length) {
                    let sum = elements.reduce((x, y) => x + y.amount, 0);
                    options.classes.push('containsInfo', isStartingBalanceAccountCell ? 'starting-balance-info' : 'ending-balance-info');
                    let infoElement = this.cashflowService.createActionButton('info', {
                        'data-sum': sum
                    });
                    options.elementsToAppend.push(infoElement);
                }
            }

            /** headers manipulation (adding css classes and appending 'Totals text') */
            if (area === 'column' && cell.type !== GrandTotal && cell.path) {
                let fieldName, fieldObj = this.getFieldObjectByPath(cell.path);
                let columnNumber = cell.path.length ? cell.path.length  - 1 : 0;
                let fieldGroup = fieldObj.groupInterval ? 'dateField' : fieldObj.caption.toLowerCase() + 'Field';
                if (fieldGroup === 'dateField') {
                    fieldName = fieldObj.groupInterval;
                    if (fieldName === 'day') {
                        let dayNumber = cell.path.slice(-1)[0],
                            dayEnding = [, 'st', 'nd', 'rd'][ dayNumber % 100 >> 3 ^ 1 && dayNumber % 10] || 'th';

                        let dayEndingElement = document.createElement('span');
                        dayEndingElement.innerText = dayEnding;
                        dayEndingElement.className = 'dayEnding';
                        options.elementsToAppend.push(dayEndingElement);

                        let date = this.cashflowService.formattingDate(cell.path);
                        let dayNameElement = document.createElement('span');
                        dayNameElement.innerText = date.startDate.format('ddd').toUpperCase();
                        dayNameElement.className = 'dayName';
                        /** Add day name */
                        options.elementsToAppend.push(dayNameElement);
                    }
                } else if (fieldGroup === 'historicalField') {
                    fieldName = 'historical';
                } else if (fieldGroup === 'projectedField') {
                    fieldName = Projected[cell.path[columnNumber]];
                }

                /** add class to the cell */
                options.classes.push(fieldGroup, fieldName);

                /** hide projected field for not current months for mdk and projected */
                if (fieldGroup === 'projectedField') {
                    fieldName = 'projected';
                }

                /** add class to the whole row */
                options.parentClasses.push(`${fieldName}Row`);
            }

            return options;
        },
        function() { return JSON.stringify(arguments); }
    );

    private expandLevels: IExpandLevel[] = [
        {
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
    ];

    categoryToolbarConfig;

    footerToolbarConfig = [];

    private filters: FilterModel[] = new Array<FilterModel>();
    private rootComponent: any;

    private cachedColumnActivity: Map<string, boolean> = new Map();

    /** List of cached sparklines of rows of type Sparkline */
    private cachedRowsSparkLines: Map<string, SparkLine> = new Map();

    /** Total amount of transactions */
    private transactionsTotal = 0;

    /** Amount of transactions */
    private transactionsAmount = 0;

    /** Avereage amount of all transcations */
    private transactionsAverage = 0;

    /** Marker that change its value after content is fully rendering on cashflow */
    contentReady = false;

    private gridDataExists = false;

    /** Text box for modifying of the cell*/
    private modifyingCellNumberBox: NumberBox;

    private functionButton: any;

    private saveButton: any;

    /** Cell input padding */
    private oldCellPadding: string;

    /** Save the state of year headers */
    private quarterHeadersAreCollapsed = false;

    /** Save the state of year headers */
    private yearHeadersAreCollapsed = false;

    /** Selected cell on cashflow grid (dxPivotGridPivotGridCell) interface */
    private selectedCell;
    private doubleClickedCell;

    /** Cell to be copied (dxPivotGridPivotGridCell) interface */
    private copiedCell;

    private dateFilter: FilterModel = new FilterModel({
        component: FilterCalendarComponent,
        caption: 'Date',
        items: {from: new FilterItemModel(), to: new FilterItemModel()},
        options: {
            allowFutureDates: true,
            endDate: moment(new Date()).add(10, 'years').toDate()
        }
    });

    /** Row pathes of the months that had been already expanded and we don't need to load the days again */
    private monthsDaysLoadedPathes = [];

    /** Key to cache the transaction details height */
    private cashflowDetailsGridSessionIdentifier = `cashflow_forecastModel_${abp.session.tenantId}_${abp.session.userId}`;

    detailsSettingsIdentifier = `cashflow_details_settings_${abp.session.tenantId}_${abp.session.userId}`;

    /** If cashflow has some disperancy data */
    private hasDiscrepancyInData = false;

    /** Key for storing the state of the cashflow in local storage*/
    private stateStorageKey = `cashflow_state_storage_${abp.session.tenantId}_${abp.session.userId}`;

    /** Row paths list expanded by default */
    private rowDefaultExpandedPaths = [
        [PI],
        [PE]
    ];

    /** Columns paths list expanded by default */
    private columnDefaultExpandedPaths = [
        /** Expand current year */
        [Periods.Current, moment().year()],
        /** Expand all quarters of current year */
        [Periods.Current, moment().year(), 1],
        [Periods.Current, moment().year(), 2],
        [Periods.Current, moment().year(), 3],
        [Periods.Current, moment().year(), 4],
        /** Expand current month */
        [Periods.Current, moment().year(), moment().quarter(), moment().month() + 1],
    ];

    /** The width of the left pivot grid column (pixels) */
    private leftColumnWidth = 339;

    /** The height of the bottom toolbar (pixels) */
    private bottomToolbarHeight = 41;

    /** Tooltip instance to show adjustment info */
    private infoTooltip: Tooltip;

    /** Cashflow events descriptions */
    private cashflowEvents: IEventDescription[] = [
        {
            name: 'dragstart',
            handler: this.onDragStart.bind(this)
        },
        {
            name: 'dragend',
            handler: this.onDragEnd.bind(this)
        },
        {
            name: 'dragenter',
            handler: this.onDragEnter.bind(this)
        },
        {
            name: 'dragover',
            handler: this.onDragOver.bind(this)
        },
        {
            name: 'drop',
            handler: this.onDrop.bind(this)
        },
        {
            name: 'mouseover',
            handler: this.onMouseOver.bind(this),
            useCapture: true
        },
        {
            name: 'mouseout',
            handler: this.onMouseOut.bind(this),
            useCapture: true
        }
    ];

    /** Listener of keydown event */
    private keyDownEventHandler = this.keyDownListener.bind(this);

    /** Interval between state saving (ms) */
    public stateSavingTimeout = 1000;

    /** Whether the loading of data was performed with filter */
    public filteredLoad = false;

    private modifyingNumberBoxCellObj: any;
    private modifyingNumberBoxStatsDetailFilter: any;

    private detailsModifyingNumberBoxCellObj: any;

    private changeTransactionGridEditMode: boolean;

    tabularFontName;
    updateAfterActivation: boolean;
    updateCashflowPositionsAfterActivation: boolean;
    detailsTabs = [
        { text: this.l('ShowAll'), value: 'all' },
        { text: this.l('History'), value: 'history' },
        { text: this.l('Forecast'), value: 'forecast' }
    ];
    selectedDetailsTab$ = this.detailsTab$.pipe(
        map((chosenTab) => this.detailsTabs.find(tab => tab.value === chosenTab))
    );

    /**
     * Check if cell text is not fit to one row with other elements and if so - truncate it
     * @param e
     */
    private getNewTextWidth = underscore.memoize(
        (cellInnerWidth, textWidth, textPaddingLeft, isAccount): number => {
            let newTextWidth;
            /** Get the sum of widths of all cell children except text element width */
            let anotherChildrenElementsWidth: number = (this.userPreferencesService.localPreferences.value.showSparklines ?
                this.sparkLinesWidth : 0) + (isAccount ? this.accountNumberWidth : 0);
            let cellAvailableWidth: number = cellInnerWidth - this.rowCellRightPadding - textPaddingLeft - anotherChildrenElementsWidth;

            /** If text size is too big - truncate it */
            if (textWidth > cellAvailableWidth) {
                newTextWidth = cellAvailableWidth - 1;
            }
            return newTextWidth;
        },
        function() { return JSON.stringify(arguments); }
    );

    constructor(injector: Injector,
        private _cashflowServiceProxy: CashflowServiceProxy,
        private _filtersService: FiltersService,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
        public dialog: MatDialog,
        public userPreferencesService: UserPreferencesService,
        public appService: AppService,
        private _calculatorService: CalculatorService,
        private _cellsCopyingService: CellsCopyingService,
        public cashflowService: CashflowService,
        public bankAccountsService: BankAccountsService,
        private store$: Store<CfoStore.State>,
        private actions$: ActionsSubject,
        private _cfoPreferencesService: CfoPreferencesService,
        private _currencyPipe: CurrencyPipe,
        private _lifecycleService: LifecycleSubjectsService
    ) {
        super(injector);

        this._calculatorService.subscribePeriodChange((value) => {
            this.onCalculatorValueChange(value);
        });
        /** Subscribe to copying events */
        this._cellsCopyingService.selectedCellsToCopyChange$.subscribe(data => {
            this.handleCellsSelecting(data);
        });
        this._cellsCopyingService.selectedCellsToCopyFinished$.subscribe(targetCells => {
            this.handleCellsCopying(this._cellsCopyingService.copiedCell, targetCells);
        });

        this.hasStaticInstance = this._cfoService.hasStaticInstance;
    }

    ngOnInit() {
        this.initCategoryToolbar();
        this.displayedStatsDetails$.subscribe((details) => this.displayedStatsDetails = details);
        this.statsDetailResult$.subscribe(details => {
            let detailsAllowed = this.isInstanceAdmin || this.isMemberAccessManage;
            this.detailsContainsHistorical = detailsAllowed && details.some(item => !!item.date);
            this.detailsContainsForecasts = detailsAllowed && details.some(item => !!item.forecastId);
            this.statsDetailResult = details;
            this.detailsTab.next('all');
        });
        this.store$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());
        this.store$.pipe(
            select(ForecastModelsStoreSelectors.getSelectedForecastModelId),
            takeUntil(this.destroy$)
        ).subscribe((selectedForecastModelIdodelId: number) => {
            this.cashflowService.selectedForecastModelId = selectedForecastModelIdodelId;
        });
        this.store$.pipe(
            select(ForecastModelsStoreSelectors.getSelectedForecastModelId),
            skip(1),
            filter(() => this.componentIsActivated)
        ).subscribe(() => {
            this.loadGridDataSource();
        });

        this.cashflowService.requestFilter = new StatsFilter();
        this.cashflowService.requestFilter.groupByPeriod = GroupByPeriod.Monthly;

        this.userPreferencesService.removeLocalModel();
        this.bankAccountsService.load();

        const selectedCurrencyId$ = this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            takeUntil(this.destroy$),
            tap((selectedCurrencyId: string) => this.cashflowService.requestFilter.currencyId = selectedCurrencyId)
        );

        /** If component is activated and currency has changed - update grid  */
        selectedCurrencyId$.pipe(
            /** Skip first load and then react on currencies changes */
            skip(1),
            filter(() => this.componentIsActivated)
        ).subscribe(() => {
            this.refreshDataGrid();
        });

        /** If component is not activated - wait until it will activate and then reload */
        merge(
            selectedCurrencyId$,
            this.store$.pipe(select(ForecastModelsStoreSelectors.getSelectedForecastModelId))
        ).pipe(
            filter(() => !this.componentIsActivated)
        ).subscribe(() => {
            this.updateAfterActivation = true;
        });

        /** Create parallel operations */
        const cashFlowInitialData$: Observable<CashFlowInitialData> = this._cashflowServiceProxy.getCashFlowInitialData(InstanceType[this.instanceType], this.instanceId);
        const categoryTree$: Observable<GetCategoryTreeOutput> = this._categoryTreeServiceProxy.get(InstanceType[this.instanceType], this.instanceId, true);
        const reportSections$ = this._categoryTreeServiceProxy.getReportTemplateDefinition(InstanceType[this.instanceType], this.instanceId, ReportTemplate.Personal);
        const cashflowGridSettings$: Observable<CashFlowGridSettingsDto> = this.userPreferencesService.userPreferences$.pipe(first());
        const syncAccounts$: Observable<SyncAccountBankDto[]> = this.bankAccountsService.syncAccounts$.pipe(first());
        forkJoin(cashFlowInitialData$ , categoryTree$, reportSections$, cashflowGridSettings$, syncAccounts$)
            .subscribe(([initialData, categoryTree, reportSections, cashflowSettings, syncAccounts]:
                             [CashFlowInitialData, GetCategoryTreeOutput, GetReportTemplateDefinitionOutput, CashFlowGridSettingsDto, SyncAccountBankDto[]]) => {
                /** Initial data handling */
                this.handleCashFlowInitialResult(initialData, syncAccounts);

                /** Handle the get categories response */
                this.cashflowService.handleGetCategoryTreeResult(categoryTree);

                /** Handle reports sections response */
                this.cashflowService.reportSections = reportSections;

                /** Handle the get cashflow grid settings response*/
                this.handleGetCashflowGridSettingsResult(cashflowSettings);

                this.initFiltering();

                /** @todo fix double initial loading */
                this._cfoPreferencesService.dateRange$.pipe(
                    takeUntil(this.destroy$),
                    switchMap((dateRange) => this.componentIsActivated ? of(dateRange) : this._lifecycleService.activate$.pipe(first(), mapTo(dateRange)))
                ).subscribe((dateRange: CalendarValuesModel) => {
                    this.dateFilter.items = {
                        from: new FilterItemModel(dateRange.from.value),
                        to: new FilterItemModel(dateRange.to.value)
                    };
                    this.getCellOptionsFromCell.cache = {};
                    this._filtersService.change(this.dateFilter);
                });

                /** After selected accounts change */
                this.bankAccountsService.selectedBankAccountsIds$.pipe(first()).subscribe(() => {
                    this.setBankAccountsFilter(true);
                });
                this.bankAccountsService.selectedBankAccountsIds$.subscribe(() => {
                    /** filter all widgets by new data if change is on this component */
                    if (this.componentIsActivated) {
                        this.setBankAccountsFilter();
                        /** if change is on another component - mark this for future update */
                    } else {
                        this.updateAfterActivation = true;
                    }
                });
            });

        this.initHeadlineConfig();

        /** Add event listeners for cashflow component (delegation for cashflow cells mostly) */
        if (this.userPreferencesService.localPreferences.value.showCategoryTotals
            && (this.isInstanceAdmin || this._cfoService.classifyTransactionsAllowed)
        ) {
            this.cashflowService.addEvents(this.getElementRef().nativeElement, this.cashflowEvents);
            this.createDragImage();
            document.addEventListener('keydown', this.keyDownEventHandler, true);
        }

        this.userPreferencesService.categorizationPreferences$.pipe(
            takeUntil(this.destroy$),
            skip(1)
        ).subscribe(() => {
            this.updateCategorizationLevels();
        });

        this.userPreferencesService.showEmptyCategories$.pipe(
            takeUntil(this.destroy$),
            skip(1),
            tap(() => this.startLoading())
        ).subscribe((showEmptyCategories: boolean) => {
            if (showEmptyCategories) {
                this.showEmptyCategories();
            } else {
                this.hideEmptyCategories();
            }
            this.finishLoading();
        });

        this.userPreferencesService.showSparklines$.pipe(
            takeUntil(this.destroy$),
            skip(1)
        ).subscribe(() => {
            this.getNewTextWidth.cache = {};
            this.pivotGrid.instance.repaint();
        });
    }

    private showEmptyCategories() {
        if (!this.stubsCashflowDataForEmptyCategories.length) {
            this.stubsCashflowDataForEmptyCategories = this.getStubsCashflowDataForEmptyCategories(this.cashflowService.cashflowData[0].date, this.cashflowService.cashflowData[0].initialDate);
            this.cashflowService.cashflowData = this.cashflowService.cashflowData.concat(this.stubsCashflowDataForEmptyCategories);
            this.dataSource = this.getApiDataSource();
        }
    }

    private hideEmptyCategories() {
        if (this.stubsCashflowDataForEmptyCategories && this.stubsCashflowDataForEmptyCategories.length) {
            this.cashflowService.cashflowData = difference(this.cashflowService.cashflowData, this.stubsCashflowDataForEmptyCategories);
            this.stubsCashflowDataForEmptyCategories = [];
            this.dataSource = this.getApiDataSource();
        }
    }

    createDragImage() {
        this.dragImg = new Image();
        this.dragImg.src = './assets/common/icons/drag-icon.svg';
        this.dragImg.style.display = 'none';
        this.getElementRef().nativeElement.appendChild(this.dragImg);
    }

    /**
     * Override the native array push method for the cashflow that will add the total and netChange objects before pushing the income or expense objects
     */
    overrideCashflowDataPushMethod() {
        if (this.cashflowService.cashflowData.push) {
            this.cashflowService.cashflowData.push = cashflowItem => {
                if (cashflowItem.cashflowTypeId === Income || cashflowItem.cashflowTypeId === Expense) {
                    let totalObject = { ...cashflowItem };
                    totalObject.cashflowTypeId = Total;
                    [].push.call(this.cashflowService.cashflowData, this.cashflowService.addCategorizationLevels(totalObject));
                    if (this.cashflowService.cashflowGridSettings.general.showNetChangeRow) {
                        let netChangeObject = { ...cashflowItem };
                        netChangeObject.cashflowTypeId = NetChange;
                        [].push.call(this.cashflowService.cashflowData, this.cashflowService.addCategorizationLevels(netChangeObject));
                    }
                }

                this.cashflowService.anotherPeriodAccountsValues.clear();
                this.getUserPreferencesForCell.cache = {};
                return [].push.call(this.cashflowService.cashflowData, cashflowItem);
            };
        }
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Cashflow_mainTitle')],
            // onRefresh:  this._cfoService.hasStaticInstance ? undefined : this.refreshDataGrid.bind(this),
            toggleToolbar: this.toggleToolbar.bind(this),
            iconSrc: './assets/common/icons/chart-icon.svg'
        };
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => {
            if (this.pivotGrid && this.pivotGrid.instance)
                this.pivotGrid.instance.repaint();
        }, 0);
        this._filtersService.fixed = false;
        this._filtersService.disable();
        this.initToolbarConfig();
    }

    initFiltering() {
        this._filtersService.apply((filter) => {
            if (filter && filter.items.element) {
                if (filter.caption == 'BusinessEntity')
                    this.bankAccountsService.changeSelectedBusinessEntities(filter.items.element.value);
                this.bankAccountsService.applyFilter();
            }

            let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
            if (filterMethod)
                filterMethod(filter, this.cashflowService.requestFilter);
            else
                this.cashflowService.requestFilter[filter.field] = undefined;

            this.closeTransactionsDetail();
            this.filteredLoad = true;
            this.loadGridDataSource();
            this.initToolbarConfig();
        });
        /** Repaint pivot grid after closing the filter modal */
        this._filtersService.filterToggle$.subscribe(enabled => {
            enabled || setTimeout(this.repaintDataGrid.bind(this), 1000);
        });
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.operations.initToolbarConfig();
        }
    }

    /**
     * Add the handling of the click on the date header cells in pivot grid
     */
    headerExpanderClickHandler = $event => {
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
            this.synchronizeHeaderHeightWithCashflow();
        }
        clickedElement = null;
    }

    /**
     * Handle the subscription result from getInitialData Observable
     * @param initialDataResult
     */
    handleCashFlowInitialResult(initialDataResult: CashFlowInitialData, syncAccounts: SyncAccountBankDto[]) {
        this.cashflowService.initialData = initialDataResult;
        this.cashflowService.cashflowTypes = this.cashflowService.initialData.cashflowTypes;
        this.addCashflowType(Total, this.l('Ending Cash Balance'));
        this.addCashflowType(NetChange, this.l('Net Change'));
        this.cashflowService.bankAccounts = this.cashflowService.initialData.banks.map(x => x.bankAccounts).reduce((x, y) => x.concat(y), []);
        this.activeBankAccounts = this.cashflowService.bankAccounts.filter(b => b.isActive);
        this.syncAccounts = syncAccounts;
        this.createFilters(initialDataResult, syncAccounts);
        this.setupFilters(this.filters);
    }

    createFilters(initialData, syncAccounts) {
        this.filters = [
            new FilterModel({
                field: 'accountIds',
                component: BankAccountFilterComponent,
                caption: 'Account',
                items: {
                    element: new BankAccountFilterModel(
                        {
                            dataSource$: this.bankAccountsService.syncAccounts$.pipe(takeUntil(this.destroy$)),
                            selectedKeys$: this.bankAccountsService.selectedBankAccountsIds$.pipe(takeUntil(this.destroy$)),
                            nameField: 'name',
                            keyExpr: 'id'
                        }
                    )
                }
            }),
            this.dateFilter,
            new FilterModel({
                component: FilterCheckBoxesComponent,
                field: 'businessEntityIds',
                caption: 'BusinessEntity',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource$: this.bankAccountsService.sortedBusinessEntities$.pipe(takeUntil(this.destroy$)),
                        selectedKeys$: this.bankAccountsService.selectedBusinessEntitiesIds$.pipe(takeUntil(this.destroy$)),
                        nameField: 'name',
                        parentExpr: 'parent',
                        keyExpr: 'id'
                    })
                }
            })
        ];
    }

    setupFilters(filters) {
        this._filtersService.setup(filters);
    }

    initFooterToolbar() {
        combineLatest(
            this.store$.pipe(select(ForecastModelsStoreSelectors.getForecastModels), filter(Boolean)),
            this.store$.pipe(select(ForecastModelsStoreSelectors.getSelectedForecastModelIndex, filter(Boolean)))
        ).pipe(
            first()
        ).subscribe(([forecastModels, selectedForecastModelIndex]) => {
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
                                items: forecastModels,
                                selectedIndex: selectedForecastModelIndex,
                                accessKey: 'cashflowForecastSwitcher',
                                onItemClick: (e) => {
                                    this.cashflowService.handleDoubleSingleClick(e, this.changeSelectedForecastModelId.bind(this), this.handleForecastModelDoubleClick.bind(this));
                                }
                            }
                        },
                        {
                            name: 'forecastModelAdd',
                            visible: this.isInstanceAdmin || this.isMemberAccessManage,
                            action: (event) => {
                                if (!event.element.getElementsByClassName('addModel').length)
                                    this.showForecastAddingInput(event);
                            }
                        }
                    ]
                },
                {
                    location: 'after',
                    items: [
                        {
                            name: 'total',
                            html: `${this.ls('Platform', 'Total')} : <span class="value">${this._currencyPipe.transform(this.transactionsTotal, this._cfoPreferencesService.selectedCurrencyId, this._cfoPreferencesService.selectedCurrencySymbol)}</span>`
                        },
                        {
                            name: 'count',
                            html: `${this.l('Cashflow_BottomToolbarCount')} : <span class="value">${this.transactionsAmount}</span>`
                        },
                        {
                            name: 'average',
                            html: `${this.l('Cashflow_BottomToolbarAverage')} : <span class="value">${this._currencyPipe.transform(this.transactionsAverage, this._cfoPreferencesService.selectedCurrencyId, this._cfoPreferencesService.selectedCurrencySymbol)}</span>`
                        },
                        {
                            action: this.hideFooterBar.bind(this),
                            options: {
                                icon: './assets/common/icons/close.svg'
                            }
                        }
                    ]
                }
            ];
        });
    }

    /** @todo refactor change for the TextBox component */
    handleForecastModelDoubleClick(e) {
        let editElement = document.createElement('div');
        editElement.className = 'editModel';
        editElement.innerHTML = `<input value="${e.itemData.text}">`;
        e.itemElement.appendChild(editElement);
        let cashflowComponent = this;
        editElement.addEventListener('focusout', function() {
            let newName = this.querySelector('input').value;
            /** Rename forecast model if the name changed */
            if (e.itemData.text !== newName) {
                cashflowComponent.renameForecastModel(
                    new RenameForecastModelInput({
                        id: e.itemData.id,
                        newName: newName
                    })
                );
                cashflowComponent.actions$.pipe(
                    ofType(ForecastModelsStoreActions.ActionTypes.RENAME_FORECAST_MODEL_SUCCESS),
                    first()
                ).subscribe(() => {
                    e.itemElement.querySelector('.dx-tab-text').innerText = newName;
                    cashflowComponent.initFooterToolbar();
                });
            }
            this.remove();
        });
        editElement = null;
    }

    addForecastModel(modelName: CreateForecastModelInput) {
        this.store$.dispatch(new ForecastModelsStoreActions.AddForecastModelAction(modelName));
    }

    renameForecastModel(modelData: RenameForecastModelInput) {
        this.store$.dispatch(new ForecastModelsStoreActions.RenameForecastModelAction(modelData));
    }

    /** @todo continue implementing in other task */
    showForecastAddingInput(e) {
        let inputBlockElement = document.createElement('div');
        inputBlockElement.className = 'addModel';
        inputBlockElement.innerHTML = '<input value=""></div>';
        let thisComponent = this;
        inputBlockElement.addEventListener('focusout', function() {
            let modelName = this.querySelector('input').value;
            /** Add forecast model */
            if (modelName) {
                let createForecastModelInput: CreateForecastModelInput = new CreateForecastModelInput({ name: modelName });
                thisComponent.addForecastModel(createForecastModelInput);
                thisComponent.actions$.pipe(
                    ofType(ForecastModelsStoreActions.ActionTypes.ADD_FORECAST_MODEL_SUCCESS),
                    first()
                ).subscribe(
                    () => {
                        thisComponent.initFooterToolbar();
                        thisComponent.loadGridDataSource();
                    },
                    () => { console.log('unable to add forecast model'); }
                );
            }
            $(this).remove();
        });
        e.element.appendChild(inputBlockElement);
        inputBlockElement = null;
    }

    /**
     * Handle getCashflow grid settings result
     * @param cashflowSettingsResult
     */
    handleGetCashflowGridSettingsResult(cashflowSettingsResult) {
        this.cashflowService.cashflowGridSettings = cloneDeep(cashflowSettingsResult);
        this.applySplitMonthIntoSetting(this.cashflowService.cashflowGridSettings.general.splitMonthType);
        this.tabularFontName = this.userPreferencesService.getClassNameFromPreference({
            sourceName: 'fontName',
            sourceValue: this.cashflowService.cashflowGridSettings.visualPreferences.fontName
        });
        const thousandsSeparator = this.cashflowService.cashflowGridSettings.localizationAndCurrency.numberFormatting.indexOf('.') == 3 ? '.' : ',';
        /** Changed thousands and decimal separators */
        config({
            thousandsSeparator: thousandsSeparator,
            decimalSeparator: thousandsSeparator === '.' ? ',' : '.'
        });
    }

    applySplitMonthIntoSetting(splitMonthType: MonthPeriodScope) {
        let showWeeks = splitMonthType === MonthPeriodScope.Weeks;
        let weekField = this.cashflowService.apiTableFields.find(field => field.caption === 'Week');
        let projectedField = this.cashflowService.apiTableFields.find(field => field.caption === 'Projected');
        weekField.visible = showWeeks;
        projectedField.visible = !showWeeks;
    }

    /**
     * Change the forecast model to reuse later
     * @param modelObj - new forecast model
     */
    changeSelectedForecastModelId(modelObj) {
        if (!$(modelObj.element).find('.editModel').length) {
            this.store$.dispatch(new ForecastModelsStoreActions.ChangeForecastModelAction(modelObj.itemData.id));
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
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        /** Remove cashflow events handlers */
        this.cashflowService.removeEvents(this.getElementRef().nativeElement, this.cashflowEvents);
        this.appService.toolbarIsHidden = false;

        document.removeEventListener('keydown', this.keyDownEventHandler);
        super.ngOnDestroy();
    }

    loadGridDataSource(period: GroupByPeriod = GroupByPeriod.Monthly, completeCallback = null) {
        this.startLoading();
        this.cashflowService.requestFilter.groupByPeriod = period;
        if (period === GroupByPeriod.Monthly) {
            this.cashflowService.requestFilter.dailyPeriods = this.getDailyPeriods();
        }
        this.cashflowService.requestFilter.accountIds = this.bankAccountsService.state.selectedBankAccountIds;

        /** Clear cache of tree paths */
        this.cashflowService.treePathes = {};

        /** Clear cache for rows sparklines */
        this.cachedRowsSparkLines.forEach(sparkLine => {
            sparkLine.dispose();
        });
        this.cachedRowsSparkLines.clear();
        this.store$.pipe(
            select(ForecastModelsStoreSelectors.getSelectedForecastModelId),
            filter(Boolean),
            first(),
            switchMap((forecastModelId: number) => {
                this.cashflowService.requestFilter.forecastModelId = forecastModelId;
                return this._cashflowServiceProxy.getStats(InstanceType[this.instanceType], this.instanceId, this.cashflowService.requestFilter);
            }),
            pluck('transactionStats'),
            finalize(() => this.finishLoading())
        ).subscribe((transactions: TransactionStatsDto[]) => {
            this.handleCashflowData(transactions, period);
            /** override cashflow data push method to add totals and net change automatically after adding of cashflow */
            this.overrideCashflowDataPushMethod();
        },
            () => {},
        () => {
            if (!this.gridDataExists && (!this.cashflowService.cashflowData || !this.cashflowService.cashflowData.length)) {
                if (this.componentIsActivated)
                    this.appService.updateToolbar(null);
            } else {
                this.gridDataExists = true;
                this.dataSource = this.getApiDataSource();
            }

            this.initToolbarConfig();
            this.initFooterToolbar();

            if (completeCallback) {
                completeCallback.call(this);
            }
        });
    }

    handleCashflowData(transactions, period = GroupByPeriod.Monthly) {
        if (transactions && transactions.length) {
            /** categories - object with categories */
            this.cashflowService.cashflowData = this.getCashflowDataFromTransactions(transactions);
            /** Make a copy of cashflow data to display it in custom total group on the top level */
            const stubsCashflowDataForEndingCashPosition = this.getStubsCashflowDataForEndingCashPosition(this.cashflowService.cashflowData);
            const stubsCashflowDataForAllDays = this.cashflowService.getStubsCashflowDataForAllPeriods(this.cashflowService.cashflowData, period);
            this.stubsCashflowDataForEmptyCategories = this.userPreferencesService.localPreferences.value.showEmptyCategories
                ? this.getStubsCashflowDataForEmptyCategories(this.cashflowService.cashflowData[0].date, this.cashflowService.cashflowData[0].initialDate)
                : [];
            const cashflowWithStubsForEndingPosition = this.cashflowService.cashflowData.concat(stubsCashflowDataForEndingCashPosition);
            const stubsCashflowDataForAccounts = this.getStubsCashflowDataForAccounts(cashflowWithStubsForEndingPosition);

            /** concat initial data and stubs from the different hacks */
            this.cashflowService.cashflowData = cashflowWithStubsForEndingPosition.concat(
                this.stubsCashflowDataForEmptyCategories,
                stubsCashflowDataForAccounts,
                stubsCashflowDataForAllDays
            );
        } else {
            this.cashflowService.cashflowData = this.getCashflowDataFromTransactions(transactions);
        }
    }

    handleDailyCashflowData(transactions, startDate, endDate) {

        /** Remove old month transactions */
        if (this.cashflowService.cashflowData && this.cashflowService.cashflowData.length) {
            this.cashflowService.cashflowData.slice().forEach(item => {
                if (item.initialDate.format('MM.YYYY') === startDate.format('MM.YYYY') &&
                    item.adjustmentType != AdjustmentType._2
                ) {
                    this.cashflowService.cashflowData.splice(this.cashflowService.cashflowData.indexOf(item), 1);
                }
            });
        }

        if (this.cashflowService.adjustmentsList && this.cashflowService.adjustmentsList.length) {
            this.cashflowService.adjustmentsList.slice().forEach(item => {
                if (item.initialDate.format('MM.YYYY') === startDate.format('MM.YYYY') &&
                    item.adjustmentType != AdjustmentType._2) {
                    this.cashflowService.adjustmentsList.splice(this.cashflowService.adjustmentsList.indexOf(item), 1);
                }
            });
            this.cashflowService.updateZeroAdjustmentsList();
        }

        transactions = this.getCashflowDataFromTransactions(transactions, false);
        let existingPeriods = [];
        transactions.forEach(transaction => {
            /** Move the year to the years array if it is unique */
            let formattedDate = transaction.initialDate.format('YYYY-MM-DD');
            if (existingPeriods.indexOf(formattedDate) === -1) existingPeriods.push(formattedDate);
        });
        let accountId: number = transactions[0] ? +transactions[0].accountId : this.cashflowService.bankAccounts[0].id;
        let stubCashflowDataForAllDays = this.cashflowService.createStubsForPeriod(startDate, endDate, GroupByPeriod.Daily, accountId, existingPeriods);
        let stubCashflowDataForAccounts = this.getStubsCashflowDataForAccounts(transactions);

        /** concat initial data and stubs from the different hacks */
        transactions = transactions.concat(
            stubCashflowDataForAccounts,
            stubCashflowDataForAllDays
        );

        /** Simple arrays concat doesn't work with reload, so forEach is used*/
        transactions.forEach(transaction => {
            this.cashflowService.cashflowData.push(transaction);
        });
    }

    /**
     * Get the array of stub cashflow data to add stub empty columns for cashflow
     * @param {TransactionStatsDto[]} transactions
     */
    getStubsCashflowDataForAccounts(transactions) {
        let stubCashflowDataForAccounts = [],
            allAccountsIds: number[] = [],
            currentAccountsIds = {
                [StartedBalance]: [],
                [Total]: []
            },
            firstDate, firstInitialDate;
        if (this.hasDiscrepancyInData)
            currentAccountsIds[Reconciliation] = [];

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
        allAccountsIds.filter(Boolean).forEach(accountId => {
            for (let cashflowType in currentAccountsIds) {
                if (currentAccountsIds[cashflowType].indexOf(accountId) === -1) {
                    stubCashflowDataForAccounts.push(
                        this.cashflowService.createStubTransaction({
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

    getStubsCashflowDataForEmptyCategories(date, initialDate) {
        let stubs = [];
        for (let categoryId in this.cashflowService.categoryTree.categories) {
            const category: CategoryDto = this.cashflowService.categoryTree.categories[categoryId];
            /** Get category path in tree */
            const categoryPath: string[] = this.cashflowService.getCategoryFullPath(+categoryId, category, this.cashflowService.categoryTree);
            if (!this.cashflowService.categoryHasTransactions(this.cashflowService.treePathes, categoryPath)) {
                const parentExists: boolean = !!this.cashflowService.categoryTree.categories[category.parentId];
                const cashflowTypeId = this.cashflowService.categoryTree.accountingTypes[category.accountingTypeId].typeId;
                if (cashflowTypeId) {
                    /** Create stub for category */
                    const stubTransaction = this.cashflowService.createStubTransaction({
                        'cashflowTypeId': cashflowTypeId,
                        'accountingTypeId': category.accountingTypeId,
                        'categoryId': category.parentId && parentExists ? category.parentId : categoryId,
                        'subCategoryId': category.parentId && parentExists ? categoryId : undefined,
                        'amount': 0,
                        'date': date,
                        'initialDate': initialDate
                    });
                    stubs.push(stubTransaction);
                }
            }
        }
        return stubs;
    }

    updateCategorizationLevels() {
        this.startLoading();
        setTimeout(() => {
            this.cashflowService.treePathes = {};
            this.getCellOptionsFromCell.cache = {};
            this.cashflowService.cashflowData.forEach(cashflowItem => {
                this.cashflowService.addCategorizationLevels(cashflowItem);
            });
            this.dataSource = this.getApiDataSource();
            this.finishLoading();
        });
    }

    /**
     * Get the cashflow data from the transactions from the server
     * @param {TransactionStatsDto[]} cashflowData
     * @return {TransactionStatsDto[]}
     */
    /** @todo refactor */
    getCashflowDataFromTransactions(transactions, reset = true) {
        if (reset) {
            this.transactionsAmount = 0;
            this.transactionsTotal = 0;
            this.transactionsAverage = 0;
            this.cashflowService.adjustmentsList = [];
            this.hasDiscrepancyInData = false;
        }

        const data = transactions.reduce((result, transactionObj) => {
            if (!this.hasDiscrepancyInData && transactionObj.cashflowTypeId == Reconciliation)
                this.hasDiscrepancyInData = true;
            transactionObj.categorization = {};
            transactionObj.date.utc();
            transactionObj.initialDate = moment(transactionObj.date);
            transactionObj.date.add(transactionObj.date.toDate().getTimezoneOffset(), 'minutes');
            let isAccountTransaction = transactionObj.cashflowTypeId === StartedBalance || transactionObj.cashflowTypeId === Reconciliation;
            /** change the second level for started balance and reconciliations for the account id */
            if (isAccountTransaction) {
                /** @todo Remove adjustment list for the months and create another for days */
                if (transactionObj.cashflowTypeId === StartedBalance) {
                    this.cashflowService.adjustmentsList.push({...transactionObj});
                    if (transactionObj.adjustmentType == AdjustmentType._0) {
                        transactionObj.cashflowTypeId = Total;
                    }
                }
            } else {
                /** @todo change reset for some normal prop */
                if (!transactionObj.forecastId && reset) {
                    this.transactionsTotal += transactionObj.amount;
                    this.transactionsAmount = this.transactionsAmount + transactionObj.count;
                }
            }
            this.cashflowService.addCategorizationLevels(transactionObj);
            result.push(transactionObj);
            return result;
        }, []);

        this.cashflowService.updateZeroAdjustmentsList();
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
        this.cashflowService.cashflowTypes[key] = value;
    }

    /**
     * Get the Income and Expense transactions, clone and change the cashflowTypeId to total
     * (hack to show ending balances with the ability to expand them into accounts)
     * @param {TransactionStatsDto[]} cashflowData
     * @return {TransactionStatsDto[]}
     */
    getStubsCashflowDataForEndingCashPosition(cashflowData) {
        let stubCashflowDataForEndingCashPosition = [];
        cashflowData.forEach(cashflowDataItem => {
            /** clone transaction to another array */
            if (cashflowDataItem.cashflowTypeId === Income || cashflowDataItem.cashflowTypeId === Expense) {
                let clonedTransaction = this.cashflowService.createStubTransaction({
                    'cashflowTypeId': Total,
                    'amount': cashflowDataItem.amount,
                    'forecastId': cashflowDataItem.forecastId,
                    'accountId': cashflowDataItem.accountId,
                    'date': cashflowDataItem.date,
                    'initialDate': cashflowDataItem.initialDate
                });
                stubCashflowDataForEndingCashPosition.push(clonedTransaction);

                /** add net change row if user choose preference */
                if (this.cashflowService.cashflowGridSettings.general.showNetChangeRow) {
                    stubCashflowDataForEndingCashPosition.push(
                        this.cashflowService.createStubTransaction({
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

    getStubForNetChange(cashflowData: TransactionStatsDto[]) {
        let stubCashflowDataForEndingCashPosition: TransactionStatsDto[] = [];
        if (!cashflowData.some(item => item.cashflowTypeId === NetChange)) {
            cashflowData.forEach(cashflowDataItem => {
                if (cashflowDataItem.cashflowTypeId === Income || cashflowDataItem.cashflowTypeId === Expense) {
                    /** add net change row if user choose preference */
                    if (this.cashflowService.cashflowGridSettings.general.showNetChangeRow) {
                        stubCashflowDataForEndingCashPosition.push(
                            this.cashflowService.createStubTransaction({
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

    showRefreshButton() {
        this.noRefreshedAfterSync = true;
        this.initHeadlineConfig();
    }

    refreshDataGrid() {
        this.startLoading();
        this.noRefreshedAfterSync = false;
        this.getUserPreferencesForCell.cache = {};
        this.getCellOptionsFromCell.cache = {};
        this.getNewTextWidth.cache = {};
        this.monthsDaysLoadedPathes = [];
        this.cashflowService.anotherPeriodAccountsValues.clear();
        this.reloadCategoryTree();
        this.bankAccountsService.load(true, false).subscribe(() => {
            this.setBankAccountsFilter(true);
            this.finishLoading();
        });
        this.initHeadlineConfig();
    }

    repaintDataGrid() {
        if (this.pivotGrid) {
            let pivotGridInstance = <any>this.pivotGrid.instance;
            if (this.pivotGrid.instance && pivotGridInstance.$element().children().length) {
                this.pivotGrid.instance.updateDimensions();
            }
        }
    }

    refreshDataGridWithPreferences(options) {
        const preferences = options.model;
        const updateWithNetChange = preferences.general.showNetChangeRow !== this.cashflowService.cashflowGridSettings.general.showNetChangeRow;
        const updateWithDiscrepancyChange = preferences.general.showBalanceDiscrepancy !== this.cashflowService.cashflowGridSettings.general.showBalanceDiscrepancy;
        const updateMonthSplitting = preferences.general.splitMonthType !== this.cashflowService.cashflowGridSettings.general.splitMonthType;
        const updateCurrency = preferences.localizationAndCurrency.currency !== this.cashflowService.cashflowGridSettings.localizationAndCurrency.currency;
        this.handleGetCashflowGridSettingsResult(preferences);
        this.closeTransactionsDetail();
        this.startLoading();

        /** @todo refactor - move to the showNetChangeRow and call here all
         *  appliedTo data methods before reloading the cashflow
         */

        const dataSource = this.pivotGrid && this.pivotGrid.instance.getDataSource();
        /** Clear user preferences cache */
        this.getUserPreferencesForCell.cache = {};
        if (updateMonthSplitting) {
            /** Changed showing of week and projected fields */
            let showWeeks = preferences.general.splitMonthType === MonthPeriodScope.Weeks;
            const projectedUpdatedProps = { visible: !showWeeks, expanded: !showWeeks };
            const weekUpdatedProps = { visible: showWeeks };
            if (dataSource) {
                dataSource.field('Projected', projectedUpdatedProps);
                dataSource.field('Week', weekUpdatedProps);
            } else {
                let projectedConfigIndex, weekConfigIndex;
                let projectedConfig = this.cashflowService.apiTableFields.find((field, index) => {
                    projectedConfigIndex = index;
                    return field.caption === 'Projected';
                });
                let weekConfig = this.cashflowService.apiTableFields.find((field, index) => {
                    weekConfigIndex = index;
                    return field.caption === 'Week';
                });
                this.cashflowService.apiTableFields[projectedConfigIndex] = { ...projectedConfig, ...projectedUpdatedProps };
                this.cashflowService.apiTableFields[weekConfigIndex] = { ...weekConfig, ...weekUpdatedProps };
            }
        }

        /** @todo refactor (move to the userPreferencesHandlers to avoid if else structure) */
        if (updateCurrency) {
            this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(this.cashflowService.cashflowGridSettings.localizationAndCurrency.currency));
            /** Hide spinner if nothing change to prevent infinite loading */
            if (this.cashflowService.cashflowGridSettings.localizationAndCurrency.currency === this._cfoPreferencesService.selectedCurrencyId) {
                this.finishLoading();
            }
        } else {
            if (updateWithDiscrepancyChange) {
                dataSource ? dataSource.reload() : this.refreshDataGrid();
            }
            if (!updateWithNetChange && !updateWithDiscrepancyChange && !updateMonthSplitting) {
                this.pivotGrid ? this.pivotGrid.instance.repaint() : this.refreshDataGrid();
            } else {
                if (!updateWithNetChange) {
                    dataSource ? dataSource.reload() : this.refreshDataGrid();
                } else {
                    if (updateWithNetChange) {
                        /** If user choose to show net change - then add stub data to data source */
                        if (preferences.general.showNetChangeRow) {
                            this.cashflowService.cashflowData = this.cashflowService.cashflowData.concat(this.getStubForNetChange(this.cashflowService.cashflowData));
                            /** else - remove the stubbed net change data from data source */
                        } else {
                            this.cashflowService.cashflowData = this.cashflowService.cashflowData.filter(item => item.cashflowTypeId !== NetChange);
                        }
                    }
                    this.dataSource = this.getApiDataSource();
                }
            }
            this.pivotGrid && this.pivotGrid.instance.updateDimensions();
            this.handleBottomHorizontalScrollPosition();
        }
        this.notify.info(this.l('AppliedSuccessfully'));
    }

    getApiDataSource() {
        return {
            fields: this.cashflowService.apiTableFields,
            store: this.cashflowService.cashflowData
        };
    }

    /**
     * Event that happens when the content renders
     * @param event
     */
    onContentReady(event) {

        if (this.expandBeforeIndex !== null) {
            this.startLoading();
            let res = this.expandAll(this.expandBeforeIndex);
            if (res) {
                this.expandBeforeIndex = null;
            }
        }

        /** If amount of years is 1 and it is collapsed - expand it to the month */
        if (this.cashflowService.allYears && this.cashflowService.allYears.length && this.cashflowService.allYears.length === 1 && this.cashflowService.yearsAmount === 1) {
            /** Check if the year was expanded, if no - expand to months for better user experience */
            let yearWasExpanded = this.pivotGrid.instance.getDataSource().state().columnExpandedPaths.some(path => {
                return path.indexOf(this.cashflowService.allYears[0]) !== -1;
            });
            if (!yearWasExpanded) {
                this.expandYear(this.cashflowService.allYears[0]);
                this.cashflowService.allYears = undefined;
            }
        }

        /** Get the groupBy element and append the dx-area-description-cell with it */
        let areaDescription = event.element.querySelector('.dx-area-description-cell');
        if (areaDescription) areaDescription.appendChild(document.querySelector('.sort-options'));

        /** Calculate the amount current cells to cut the current period current cell to change current from
         *  current for year to current for the grouping period */
        let lowestOpenedCurrentInterval = this.getLowestOpenedCurrentInterval();
        $('.lowestOpenedCurrent').removeClass('lowestOpenedCurrent');
        let targetCell = lowestOpenedCurrentInterval === 'year' && $(`.dx-pivotgrid-expanded.current${capitalize(lowestOpenedCurrentInterval)}`).length ?
                         $(`.current${capitalize(lowestOpenedCurrentInterval)}.dx-total`) :
                         $(`.current${capitalize(lowestOpenedCurrentInterval)}:not(.dx-pivotgrid-expanded)`);
        targetCell.addClass('lowestOpenedCurrent');

        this.changeHistoricalColspans(lowestOpenedCurrentInterval);
        this.hideProjectedFields();

        /** Clear cache with columns activity */
        this.cachedColumnActivity.clear();
        this.applyUserPreferencesForAreas();

        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();

        /** update dimensions as cells font sizes might be changed in user preferences and cells widths don't correspond
         *  to the new font sizes */
        if (!this.contentReady) {
            setTimeout(() => { this.pivotGrid.instance.updateDimensions(); }, 0);
        }

        this.contentReady = true;
        if (this.pivotGrid && this.pivotGrid.instance != undefined && !this.pivotGrid.instance.getDataSource().isLoading()) {
            this.finishLoading();
        }

    }

    keyDownListener(e) {
        if (e.target.nodeName == 'INPUT')
            return;

        if (this.selectedCell) {
            let nextElement: HTMLElement;
            let direction: string;
            switch (e.keyCode) {
                case 37: //left
                    nextElement = this.selectedCell.cellElement.previousElementSibling;
                    direction = 'left';
                    break;
                case 38: //up
                    let prevSibling = this.selectedCell.cellElement.parentElement.previousElementSibling;
                    nextElement = prevSibling ? prevSibling.querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                    direction = 'up';
                    break;
                case 39: //right
                    nextElement = this.selectedCell.cellElement.nextElementSibling;
                    direction = 'right';
                    break;
                case 40: //down
                    let nextSibling = this.selectedCell.cellElement.parentElement.nextElementSibling;
                    nextElement = nextSibling ? nextSibling.querySelector(`td:nth-child(${this.selectedCell.columnIndex + 1})`) : undefined;
                    direction = 'down';
                    break;
                case 67: // ctrl + c
                    if (
                        this.userPreferencesService.localPreferences.value.showCategoryTotals
                        && this.selectedCell
                        && this.isCopyable(this.selectedCell)
                        && (e.ctrlKey || e.metaKey)
                    ) {
                        this.onCopy(e);
                    }
                    break;
                case 86: // ctrl + v
                    if (this.userPreferencesService.localPreferences.value.showCategoryTotals) {
                        if (this.copiedCell && this.isCopyable(this.copiedCell) && (e.ctrlKey || e.metaKey))
                            this.onPaste();
                    } else
                        this.notify.error(this.l('EnableCategoryTotals'));
                    break;
                case 46: // delete
                    if (this.userPreferencesService.localPreferences.value.showCategoryTotals) {
                        if (this.statsDetailResult && e.target.closest('#cashflowGridContainer'))
                            this.onDetailsRowDelete(e);
                        else
                            this.onDelete(e);
                    } else
                        this.notify.error(this.l('EnableCategoryTotals'));
                    break;
                default:
                    return;
            }

            e.stopPropagation();
            if (nextElement) {
                let scrollValue = this.calculateScrollValue(this.selectedCell.cellElement, nextElement, direction);
                if (scrollValue) {
                    let scrollable = direction == 'up' || direction == 'down'
                        ? ScrollView.getInstance(this.getElementRef().nativeElement.querySelector('.cashflow .cashflow-scroll'))
                        : this.pivotGrid.instance['$element']().find('.dx-scrollable').last().dxScrollable('instance');

                    scrollable.scrollBy(scrollValue);
                }

                this.pivotGrid.instance['clickCount'] = 0;
                nextElement.click();
                this.pivotGrid.instance['clickCount'] = 0;
            }
        }
    }

    expandYear(year: number) {
        let historicalValue = this.cashflowService.getYearHistoricalSelectorWithCurrent()({date: moment.unix(0).tz('UTC').year(year)});
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 1]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 2]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 3]);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', [historicalValue, year, 4]);
    }

    calculateScrollValue(cell: HTMLElement, nextCell: HTMLElement, direction: string): number {
        let parentRect: ClientRect;
        let cellRect: ClientRect = cell.getBoundingClientRect();

        switch (direction) {
            case 'right':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-pivotgrid-area-data').getBoundingClientRect();
                return cellRect.right + cell.offsetWidth > parentRect.right ? nextCell.offsetWidth : 0;
            case 'left':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-pivotgrid-area-data').getBoundingClientRect();
                return cellRect.left - cell.offsetWidth < parentRect.left ? -nextCell.offsetWidth : 0;
            case 'up':
                parentRect = this.getElementRef().nativeElement.querySelector('.dx-area-column-cell').getBoundingClientRect();
                return cellRect.top - cell.offsetHeight < parentRect.bottom ? -nextCell.offsetHeight : 0;
            case 'down':
                parentRect = document.body.getBoundingClientRect();
                return cellRect.bottom + cell.offsetHeight * 2 > parentRect.bottom ? nextCell.offsetHeight : 0;
        }

        return 0;
    }

    onScroll(e) {
        this.handleBottomHorizontalScrollPosition();
    }

    synchronizeHeaderHeightWithCashflow() {
        let descriptionCellElement = document.querySelector('.dx-area-description-cell');
        let headerElement = descriptionCellElement ? descriptionCellElement.parentElement : undefined;
        if (headerElement) {
            let headerElementHeight = headerElement.clientHeight;
            let bottomRow = <HTMLElement>document.getElementsByClassName('dx-bottom-row')[0];
            /** Set the top padding for bottom row children depends on header element height */
            for (let i = 0; i < bottomRow.children.length; i++) {
                let childTd = <HTMLTableCellElement>bottomRow.children[i];
                if (childTd.style.paddingTop !== headerElementHeight + 'px') {
                    childTd.style.paddingTop = headerElementHeight + 'px';
                } else {
                    break;
                }
                childTd = null;
            }
        }
        headerElement = null;
    }

    handleBottomHorizontalScrollPosition() {
        let scrollElement = $('.dx-pivotgrid-area-data .dx-scrollable-scrollbar');
        let cashflowWrapper = document.getElementsByClassName('pivot-grid-wrapper')[0];
        if (cashflowWrapper && (cashflowWrapper.getBoundingClientRect().bottom > window.innerHeight || this.statsDetailResult)) {
            scrollElement.addClass('fixedScrollbar');
            let minusValue = scrollElement.height();

            if (this.statsDetailResult) {
                let height = $('.cashflow-wrap').outerHeight();
                minusValue += height || 0;
            } else if (this.cashflowService.cashflowGridSettings.visualPreferences.showFooterBar) {
                minusValue += $('#cashflowFooterToolbar').length ? $('#cashflowFooterToolbar').height() : this.bottomToolbarHeight;
            }
            const marginLeft: any = $('.fixed-filters').css('marginLeft');
            let fixedFiltersWidth: number = $('.fixed-filters').length ? parseInt(marginLeft) : 0;
            /** Set new offset to stick the scrollbar to the bottom of the page */
            scrollElement.offset({
                top: window.innerHeight - minusValue,
                left: this.leftColumnWidth + fixedFiltersWidth
            });
        } else {
            scrollElement.removeClass('fixedScrollbar');
            scrollElement.css({left: 'auto', top: 'auto'});
        }
        scrollElement = null;
        cashflowWrapper = null;
    }

    handleVerticalScrollPosition() {
        let cashflowScroll = $('.cashflow-scroll');
        if (this.statsDetailResult) {
            let cashflowElement = $('.cashflow');
            cashflowScroll.height(innerHeight - cashflowElement.offset().top - $('.cashflow-wrap').outerHeight());
        } else {
            cashflowScroll.height('');
        }
    }

    @HostListener('window:resize', ['$event']) onResize() {
        if (this.componentIsActivated) {
            this.updateCashflowPositions();
        } else {
            this.updateCashflowPositionsAfterActivation = true;
        }
    }

    private updateCashflowPositions() {
        this.synchronizeHeaderHeightWithCashflow();
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    getDataItemsByCell(cellObj): TransactionStatsDtoExtended[] {
        return this.cashflowService.cashflowData.filter(cashflowItem => {
            let rowPathPropertyName = cellObj.area === 'data' ? 'rowPath' : 'path';
            let columnPathPropertyName = cellObj.area === 'data' ? 'columnPath' : 'path';
            return cashflowItem.amount &&
                   (cellObj.area === 'column' || cellObj.cell[rowPathPropertyName].every((fieldValue, index) => (!fieldValue && !cashflowItem['levels'][`level${index}`]) || fieldValue === cashflowItem['levels'][`level${index}`])) &&
                   (cellObj.area === 'row' || cellObj.cell[columnPathPropertyName].every((fieldValue, index) => {
                        let field = this.pivotGrid.instance.getDataSource().getAreaFields('column', true)[index];
                        if (field.caption === 'Projected' && fieldValue !== Projected.PastTotal && fieldValue !== Projected.FutureTotal) {
                            return this.cashflowService.projectedSelector(cashflowItem) === fieldValue;
                        }
                        if (field.caption === 'Week') {
                            const weekInfo = JSON.parse(fieldValue);
                            return cashflowItem.initialDate.isBetween(weekInfo.startDate, weekInfo.endDate, 'days', '[]');
                        }
                        let dateMethod = field.groupInterval === 'day' ? 'date' : field.groupInterval;
                        return field.dataType !== 'date' ||
                               (field.groupInterval === 'month' ?
                                cashflowItem.initialDate[dateMethod]() + 1 :
                                cashflowItem.initialDate[dateMethod]()
                               ) === fieldValue;
                   }));
        });
    }

    /**
     * Changes historical colspans depend on current, previous and forecast periods using jquery dates columns colspans
     * and historical classes that added in onCellPrepared to the dates that belongs to the current periods like
     * currentYear, currentQuarter, currentMonth or currentDay
     */
    changeHistoricalColspans(lowestOpenedCurrentInterval) {
        /** Get the colspans values for the prev, current and forecast historical td that should be counted to
         * correctly display different historical periods */
        let colspanAmountForPrevious = this.getIntervalColspansAmount(lowestOpenedCurrentInterval, 'prev');
        let colspanAmountForCurrent =  this.getIntervalColspansAmountForCurrent(lowestOpenedCurrentInterval);
        let colspanAmountForForecast = this.getIntervalColspansAmount(lowestOpenedCurrentInterval, 'next');

        let currentHasRowspan = $('.historicalRow .currentHistorical').attr('rowspan');
        /** Hide current cell if there is no current opened lowest period and change the colspan */
        if (colspanAmountForCurrent === 0 && !currentHasRowspan) {
            $('.historicalRow .currentHistorical').hide();
        }
        /** If historical cell is absent - create it */
        if (!$('.historicalRow .prevHistorical').length && colspanAmountForPrevious) {
            this.cashflowService.createHistoricalCell('prev');
        }
        /** If forecast cell is absent - create it */
        if (!$('.historicalRow .nextHistorical').length && colspanAmountForForecast) {
            this.cashflowService.createHistoricalCell('next');
        }
        /** Change the colspan for the historical period */
        $('.historicalRow .prevHistorical').attr('colspan', (colspanAmountForPrevious));
        if (!currentHasRowspan) {
            $('.historicalRow .currentHistorical').attr('colspan', colspanAmountForCurrent);
        }
        /** Change colspan for forecast cell */
        $('.historicalRow .nextHistorical').attr('colspan', (colspanAmountForForecast));
    }

    getIntervalColspansAmountForCurrent(lowestColumnCaption) {
        let colspanAmount = 0;
        while (lowestColumnCaption) {
            let currentElement = $(`.dx-pivotgrid-horizontal-headers .lowestOpenedCurrent.current${capitalize(lowestColumnCaption)}`);
            if (currentElement.length) {
                colspanAmount = +currentElement.attr('colspan') || 1;
                break;
            } else {
                lowestColumnCaption = this.getPrevColumnField(lowestColumnCaption);
            }
            currentElement = null;
        }
        return colspanAmount;
    }

    /**
     * Get lowest opened interval
     */
    getLowestOpenedCurrentInterval(): string {
        let lowestInterval;
        if (this.pivotGrid && this.pivotGrid.instance) {
            let columnsTree = this.pivotGrid.instance.getDataSource().getData().columns;
            this.cashflowService.getColumnFields().some(column => {
                let currentColumnValue = this.getColumnFieldValueForCurrent(column);
                columnsTree = columnsTree.find(item => item.value === currentColumnValue);
                if (columnsTree && columnsTree.children) {
                    columnsTree = columnsTree.children;
                } else {
                    lowestInterval = column.caption.toLowerCase();
                    return true;
                }
            });
        }

        return lowestInterval;
    }

    getColumnFieldValueForCurrent(columnField) {
        let columnFieldValueForCurrent;
        if (columnField.caption === 'Projected') {
            columnFieldValueForCurrent = Projected.Today;
        } else if (columnField.caption === 'Historical') {
            columnFieldValueForCurrent = Periods.Current;
        } else {
            let currentDate = this.cashflowService.getUtcCurrentDate();
            if (columnField.dataType === 'date') {
                let method = columnField.groupInterval === 'day' ? 'date' : columnField.groupInterval;
                columnFieldValueForCurrent = method === 'month' ? currentDate[method]() + 1 : currentDate[method]();
            }
            if (columnField.caption === 'Week') {
                columnFieldValueForCurrent = JSON.stringify(new WeekInfo(currentDate));
            }
        }
        return columnFieldValueForCurrent;
    }

    getIntervalColspansAmount(groupInterval, period) {
        let colspansAmount = 0;
        let dataAreaElement = this.getElementRef().nativeElement.querySelector('.dx-area-data-cell');
        let currentElement = dataAreaElement.querySelector(`.current${capitalize(groupInterval)}`);
        if (dataAreaElement) {
            const tr = dataAreaElement.querySelector('tr');
            if (tr) {
                let allCellsAmount = tr.childElementCount;
                if (!currentElement) {
                    if (dataAreaElement.querySelector(`[class*=${[period]}]`)) {
                        colspansAmount = allCellsAmount;
                    }
                } else {
                    colspansAmount = period === 'prev' ? currentElement.cellIndex : allCellsAmount - currentElement.cellIndex - 1;
                }
            }
        }
        return colspansAmount;
    }

    getPrevColumnField(columnField) {
        let columnFields = this.cashflowService.getColumnFields();
        let currentIndex = columnFields.map(item => item.caption.toLowerCase()).indexOf(columnField);
        return currentIndex > 0 ? columnFields[currentIndex - 1].caption.toLowerCase() : null;
    }

    expandAll(itemIndex) {
        let result = false;
        if (this.pivotGrid) {
            let dataSource = this.pivotGrid.instance.getDataSource();
            this.cashflowService.getColumnFields().forEach(item => {
                /** exclude historical field */
                if (item.dataType === 'date') {
                    if (item.areaIndex <= itemIndex) {
                        dataSource.expandAll(item.index);
                    } else {
                        dataSource.collapseAll(item.index);
                    }
                }
            });
            result = true;
        }
        return result;
    }

    changeGroupBy(event) {
        this.startLoading();
        let itemIndex = event.itemData.itemIndex !== undefined ? event.itemData.itemIndex : event.itemIndex;
        /** Change historical field for different date intervals */
        this.closeTransactionsDetail();
        if (this.pivotGrid) {
            if (this.expandAll(itemIndex)) {
                this.pivotGrid.instance.repaint();
            }
        } else {
            /** Update later when new pivot grid reinit */
            this.expandBeforeIndex = itemIndex;
            this.finishLoading();
        }
    }

    downloadData(event) {
        let format = event.itemData.format;
        if (format === 'xls') {
            this.pivotGrid.export.fileName = this.exportService.getFileName();
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
                this.pivotGrid.instance.getDataSource().collapseAll(levelIndex + 1);
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
        for (let child of rows){
            let childPath = path.slice();
            childPath.push(child.value);
            if (this.hasChildsByPath(childPath)) {
                let dataSource = this.pivotGrid.instance.getDataSource();
                dataSource.expandHeaderItem('row', childPath);

                this.pivotGrid.instance.getDataSource().load().then((d) => {
                    let dataSourceChild = this.cashflowService.getDataSourceItemByPath(dataSource.getData().rows, childPath.slice());
                    if (currentDepth != stopDepth)
                        this.expandRows(dataSourceChild, stopDepth, childPath, currentDepth + 1);
                });
            }
        }
    }

    isDayCell(cell) {
        let result = false;
        if (this.pivotGrid) {
            let dayIndex = this.cashflowService.getAreaIndexByCaption('day', 'column');
            let path = cell.path || cell.columnPath;
            if (path) {
                result = path.length === (dayIndex + 1);
            }
        }
        return result;
    }

    isMonthHeaderCell(cellObj): boolean {
        let isMonthHeaderCell = false;
        if (this.pivotGrid) {
            let monthIndex = this.cashflowService.getAreaIndexByCaption('month', 'column');
            isMonthHeaderCell = cellObj.area === 'column' && cellObj.cell.path && cellObj.cell.path.length === (monthIndex + 1);
        }
        return isMonthHeaderCell;
    }

    isCopyable(cellObj) {
        return this.isInstanceAdmin && cellObj.area === 'data' &&
            (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE || cellObj.cell.rowPath[0] === PCTT) && cellObj.cell.value;
    }

    isProjectedHeaderCell(cellObj) {
        let projectedField = this.pivotGrid.instance.getDataSource().field('Projected');
        let projectedAreaIndex = this.cashflowService.getAreaIndexByCaption('Projected', 'column');
        return cellObj.area === 'column' && cellObj.cell.path && projectedField.visible && cellObj.cell.path.length === projectedAreaIndex + 1;
    }

    getIndexByCaption(caption: string) {
        let index;
        this.cashflowService.apiTableFields.some((item, itemIndex) => {
            if (item.caption.toLowerCase() === caption.toLowerCase()) {
                 index = itemIndex;
                 return true;
            }
            return false;
        });
        return index;
    }

    isTransactionDetailHeader(cell, area) {
        let result = false;
        if (area === 'row' && !cell.isWhiteSpace && cell.path) {
            let prefix = this.getPrefixFromPath(cell.path);
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

    cellCanBeDragged(cell, area) {
        return area === 'data' && (cell.rowPath[0] === PI || cell.rowPath[0] === PE || cell.rowPath[0] === PCTT) &&
               !(cell.rowPath.length && cell.rowPath.length === 2 && (cell.rowPath[1] && this.isNotCategoryOrDescriptorCell(cell.rowPath[1]))) &&
               cell.rowPath.length !== 1;
    }

    private isNotCategoryOrDescriptorCell(rowPathItem: string): boolean {
        const prefix = rowPathItem.slice(0, 2);
        return prefix !== CategorizationPrefixes.Category && prefix !== CategorizationPrefixes.TransactionDescriptor;
    }

    getCellObjectFromCellElement(cellElement: HTMLTableCellElement) {
        let pivotGridObject = <any>this.pivotGrid.instance;
        return pivotGridObject._createCellArgs(cellElement);
    }

    /**
     * Event that runs before rendering of every cell of the pivot grid
     * @param e - the object with the cell info
     * https://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxPivotGrid/Events/#cellPrepared
     */
    onCellPrepared(e) {

        /** Apply user preferences to the data showing */
        let preferencesOptions = this.getUserPreferencesForCell(e.cell, e.area);

        let options = this.getCellOptionsFromCell(e.cell, e.area, e.rowIndex, e.isWhiteSpace);

        /** added charts near row titles */
        if (this.userPreferencesService.localPreferences.value.showSparklines && e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path) {
            this.addChartToRow(e);
        }

        /** Apply all cell options to the cellElement */
        this.cashflowService.applyOptionsToElement(e.cellElement, options, preferencesOptions);

        /** hide long text for row headers and show '...' instead with the hover and long text */
        if (e.area === 'row' && !e.cell.isWhiteSpace && e.cell.path && e.cell.text) {
            let textElement: HTMLSpanElement = e.cellElement.parentElement.querySelector(`td:nth-child(${e.cellElement.cellIndex + 1}) > span`);
            let cellClientRect = e.cellElement.getBoundingClientRect();
            let textClientRect = textElement.getBoundingClientRect();
            let textWidth: number = Math.round(textClientRect.width);
            let textPaddingLeft = Math.round(textClientRect.left - cellClientRect.left);
            let descriptionClientRect = document.querySelector('.dx-area-description-cell').getBoundingClientRect();
            let cellWidth = descriptionClientRect.left + descriptionClientRect.width - cellClientRect.left;
            let newTextWidth = this.getNewTextWidth(cellWidth, textWidth, textPaddingLeft, options.general.isAccountHeaderCell);
            if (newTextWidth) {
                this.applyNewTextWidth(e, textElement, newTextWidth);
            }
        }

        if (e.area === 'column' && e.cell.type !== GrandTotal && e.cell.path) {
            let fieldObj = this.getFieldObjectByPath(e.cell.path);
            let fieldName = fieldObj.groupInterval;
            /** Added 'Total' text to the year and quarter headers */
            if (fieldName === 'year' || fieldName === 'quarter') {
                let hideHead = (e.cellElement.classList.contains('dx-pivotgrid-expanded') &&
                    (fieldName === 'quarter' || e.cellElement.parentElement.children.length >= 6)) ||
                    (fieldName === 'quarter' && this.quarterHeadersAreCollapsed) ||
                    (fieldName === 'year' && this.yearHeadersAreCollapsed);
                e.cellElement.onclick = this.headerExpanderClickHandler;
                e.cellElement.innerHTML = this.getMarkupForExtendedHeaderCell(e, hideHead, fieldName);
            }
        }

        if (this.cashflowService.filterBy && this.cashflowService.filterBy.length && e.area === 'row' && e.cell.text && e.cell.isLast) {
            this.highlightFilteredResult(e);
        }
    }

    applyNewTextWidth(cellObj, element, newCellWidth) {
        cellObj.cellElement.setAttribute('title', cellObj.cell.text.toUpperCase());
        /** Extend text to the whole cell */
        element.style.whiteSpace = 'nowrap';
        element.classList.add('truncated');
        /** created another span inside to avoid inline-flex and text-overflow: ellipsis conflicts */
        element.innerHTML = `<span>${element.textContent}</span>`;
        /** Set new width to the text element */
        element.style.width = newCellWidth + 'px';
    }

    addChartToRow(e) {
        let rowKey = e.cell.path.toString();
        let cachedSparkLine = this.cachedRowsSparkLines.get(rowKey);
        if (cachedSparkLine) {
            e.cellElement.appendChild(cachedSparkLine.element());
        } else {
            let allData: any;
            allData = this.pivotGrid.instance.getDataSource().getData();
            let chartData = [];
            for (let i in allData.columns) {
                if (allData.columns[i].children) {
                    let years = allData.columns[i].children;
                    years.forEach(obj => {
                        let rObj = {};
                        let value = allData.values[e.cell.dataSourceIndex][obj.index];
                        rObj['year'] = obj.value;
                        rObj['value'] = value.length ? Math.abs(value[0]) : Math.abs(value);
                        chartData.push(rObj);
                    });
                }
            }
            if (chartData.length > 1) {
                let spanChart = document.createElement('div');
                spanChart.className = 'chart';
                e.cellElement.appendChild(spanChart);
                let chartOptions = {
                    dataSource: chartData,
                    type: 'area',
                    argumentField: 'year',
                    valueField: 'value',
                    lineWidth: 1,
                    lineColor: '#fab800',
                    showMinMax: false,
                    showFirstLast: false,
                    tooltip: {
                        enabled: false
                    }
                };
                if (e.cell.path[0] === PI) {
                    chartOptions.lineColor = '#61c670';
                }
                if (e.cell.path[0] === PE) {
                    chartOptions.lineColor = '#e7326a';
                }
                let sparkLineInstance = new SparkLine(spanChart, chartOptions);
                this.cachedRowsSparkLines.set(rowKey, sparkLineInstance);
            }
        }
    }

    getFieldObjectByPath(path) {
        let columnFields = this.pivotGrid.instance.getDataSource().getAreaFields('column', false);
        let columnNumber = path.length ? path.length  - 1 : 0;
        return columnFields.find(field => field.areaIndex === columnNumber && field.visible);
    }

    highlightFilteredResult(e) {
        let filterByLower = this.cashflowService.filterBy.toLocaleLowerCase();
        let cellText = e.cell.text.toLocaleLowerCase();
        if (cellText.includes(filterByLower)) {
            let resultElement = '';
            let usedPosition = 0;
            let position = cellText.indexOf(filterByLower);
            while (position > -1) {
                resultElement = resultElement + e.cell.text.substr(usedPosition, position)
                    + '<span class="filter-text">' + e.cell.text.substr(usedPosition + position, filterByLower.length) + '</span>';
                usedPosition = usedPosition + position + filterByLower.length;
                cellText = cellText.substr(position + filterByLower.length);
                position = cellText.indexOf(filterByLower);
            }
            resultElement = resultElement + e.cell.text.substr(usedPosition);
            $(e.cellElement).find('> span:first-of-type').text('');
            $(e.cellElement).find('> span:first-of-type').before(resultElement);
        }
    }

    cellIsHistorical(cell) {
        let path = cell.path || cell.columnPath;
        let cellInterval = this.cashflowService.formattingDate(path);
        let currentDate = this.cashflowService.getUtcCurrentDate();
        return cellInterval.endDate.isBefore(currentDate);
    }

    getCellElementFromTarget(target: Element): HTMLTableCellElement | null {
        let element;
        if (target.nodeType === Node.TEXT_NODE) {
            target = target.parentElement;
        }
        element = target.closest('.dx-scrollable-content > table td');
        return element;
    }

    onDragStart(e) {
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.cashflowService.elementIsDataCell(targetCell)) {
            let cellObj = this.getCellObjectFromCellElement(targetCell);

            if (cellObj.cell.value) {

                /** add selected class */
                if (!targetCell.classList.contains('selectedCell')) {
                    $('.selectedCell').removeClass('selectedCell');
                    this.hideModifyingNumberBox();
                    targetCell.classList.add('selectedCell');
                }

                let items = this.getDataItemsByCell(cellObj);
                /** If there are some forecasts for this cell */
                let moveOnlyHistorical = !items.some(item => !!item.forecastId);
                e.dataTransfer.setData('movedCell', JSON.stringify(cellObj));
                e.dataTransfer.setData('moveOnlyHistorical', moveOnlyHistorical);

                this.dragImg.style.display = '';
                e.dataTransfer.setDragImage(this.dragImg, -10, -10);
                e.dataTransfer.dropEffect = 'none';

                $('[droppable]').attr('droppable', 'false');

                let $targetCell = $(targetCell);
                let $targetCellParent = $targetCell.parent();
                let $availableRows = $targetCellParent.add($targetCellParent.prevUntil('.bRow.grandTotal')).add($targetCellParent.nextUntil('.ncRow.grandTotal'));
                /** Highlight cells where we can drop cell */
                if (moveOnlyHistorical) {
                    this.highlightHistoricalTargetCells($targetCell, $availableRows);
                } else {
                    this.highlightForecastsTargetCells($targetCell, $availableRows);
                }

                document.addEventListener('dxpointermove', this.stopPropagation, true);
           }
        }
        targetCell = null;
    }

    highlightHistoricalTargetCells($targetCell, $availableRows) {
        $availableRows.find(`[droppable]:nth-child(${$targetCell.index() + 1})`).attr('droppable', 'true');
    }

    highlightForecastsTargetCells($targetCell, $availableRows) {
        /** Exclude cells that are not in allowed forecasts amount interval */
        const allowedForecastsYearAmount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));

        /** Exclude next current total row from droppable */
        let closestYearColumnTotalSelector = !$targetCell.hasClass('dx-total')
            ? `:not(:nth-child(${$targetCell.nextAll('.dx-total').index() + 1}))`
            : '';
        let nextCellsSelectors = `[droppable][class*="next"]:not(.outOfAllowedForecastsInterval):not(.selectedCell)${closestYearColumnTotalSelector}`;
        $availableRows.find(nextCellsSelectors).attr('droppable', 'true');
        $availableRows.find(`[droppable][class*="current"]:not(.outOfAllowedForecastsInterval):not(.selectedCell):not(.currentYear.dx-total)`).attr('droppable', 'true');
        $availableRows.find(`[droppable]:not(.outOfAllowedForecastsInterval):not(.selectedCell) > span`).attr('droppable', 'true');
    }

    stopPropagation(e) {
        e.stopPropagation();
    }

    onDragEnd(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetCell = this.getCellElementFromTarget(e.target);
        if (this.userPreferencesService.localPreferences.value.showCategoryTotals &&
            targetCell && this.cashflowService.elementIsDataCell(targetCell)
        ) {
            const hoveredElements = document.querySelectorAll(':hover');
            const lastHoveredElement = hoveredElements[hoveredElements.length - 1];
            const hoveredCell = this.getCellElementFromTarget(lastHoveredElement);
            if (hoveredCell && this.cashflowService.elementIsDataCell(hoveredCell) && hoveredCell !== targetCell
                && hoveredCell.getAttribute('droppable') !== 'true') {
                /** Show messages */
                const targetCellObj = this.getCellObjectFromCellElement(hoveredCell);
                const targetInterval = this.cashflowService.formattingDate(targetCellObj.cell.columnPath);
                const currentDate = this.cashflowService.getUtcCurrentDate();
                const forecastsYearCount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));
                if (targetInterval.endDate.isBefore(currentDate)) {
                    this.notify.error(this.l('SelectFutureDate'));
                } else if (!this.cashflowService.cellIsAllowedForAddingForecast(targetInterval, forecastsYearCount)) {
                    this.notify.error(this.l('ForecastIsProjectedTooFarAhead'));
                } else {
                    this.notify.error(this.l('SelectCategory'));
                }
            }

            targetCell.classList.remove('dragged');
            $('[droppable]').removeClass('currentDroppable');
            $('[droppable]').attr('droppable', 'false');
        }
        this.dragImg.style.display = 'none';
        document.removeEventListener('dxpointermove', this.stopPropagation);
    }

    onDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.cashflowService.elementIsDataCell(targetCell) && !targetCell.classList.contains('selectedCell')) {
            /** change the class for the target cell */
            if (targetCell.getAttribute('droppable') === 'true') {
                $('[droppable]').removeClass('currentDroppable');
                targetCell.classList.add('currentDroppable');
            }
        }
        targetCell = null;
    }

    onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.cashflowService.elementIsDataCell(targetCell) && !targetCell.classList.contains('selectedCell')) {
            /** change the class for the target cell */
            if (targetCell.getAttribute('droppable') === 'true') {
                $('[droppable]').removeClass('currentDroppable');
                targetCell.classList.add('currentDroppable');
            } else {
                e.dataTransfer.dropEffect = 'none';
            }
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
        targetCell = null;
    }

    onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        let targetCell = this.getCellElementFromTarget(e.target);
        if (targetCell && this.cashflowService.elementIsDataCell(targetCell)) {
            let cellObj = this.getCellObjectFromCellElement(targetCell);
            const movedCell = JSON.parse(e.dataTransfer.getData('movedCell'));
            let targetCellData = this.cashflowService.getCellInfo(cellObj, {
                cashflowTypeId: this.cashflowService.getCategoryValueByValue(movedCell.cell.value)
            });
            /** Get the transactions of moved cell if so */
            let sourceCellInfo = this.cashflowService.getCellInfo(movedCell);
            this.statsDetailFilter = this.cashflowService.getDetailFilterFromCell(movedCell);
            let statsDetails$ = this._cashflowServiceProxy.getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter).pipe(publishReplay(), refCount(), mergeAll());
            const forecasts$ = statsDetails$.pipe(
                filter((transaction: any) => <any>!!transaction.forecastId),
                toArray()
            );
            const historicals$ = statsDetails$.pipe(
                filter(transaction => <any>!transaction.forecastId),
                toArray()
            );
            forkJoin(
                historicals$.pipe(mergeMap(historicalTransactions => {
                    const historicalTransactionsExists = historicalTransactions && historicalTransactions.length && cellObj.cellElement.className.indexOf('next') === -1;
                    return historicalTransactionsExists ? this.moveHistorical(movedCell, targetCellData) : of('empty');
                })),
                forecasts$.pipe(mergeMap(forecastsTransactions => {
                    if (forecastsTransactions && forecastsTransactions.length) {
                        let moveForecastsModels = this.createMovedForecastsModels(forecastsTransactions, sourceCellInfo, targetCellData);
                        return <any>this.moveForecasts(moveForecastsModels);
                    } else {
                        return of('empty');
                    }
                }))
            ).subscribe(
                res => {
                    if (res) {
                        let itemsToMove = this.getDataItemsByCell(movedCell);
                        if (res[0] !== 'empty') {
                            let historicalItems = itemsToMove.filter(item => !item.forecastId);
                            this.updateMovedHistoricals(historicalItems, targetCellData);
                        }
                        if (res[1] !== 'empty') {
                            let forecastItems = itemsToMove.filter(item => item.forecastId);
                            this.updateMovedForecasts(forecastItems, sourceCellInfo, targetCellData);
                        }
                    }
                },
                e => { console.log(e); this.notify.error(e); },
                () => {
                    this.updateDataSource()
                        .then(() => {
                            this.notify.success(this.l('Cell_moved'));
                        });
                }
            );
        }
        targetCell = null;
    }

    onMouseOver(e) {
        let targetCell = this.getCellElementFromTarget(e.target);
        let relatedTargetCell = e.relatedTarget && this.getCellElementFromTarget(e.relatedTarget);
        if (targetCell && this.cashflowService.elementIsDataCell(targetCell) && targetCell !== relatedTargetCell) {
            let infoButton = targetCell.getElementsByClassName('dx-link-info');
            if (infoButton.length) {
                let sum = parseFloat(infoButton[0].getAttribute('data-sum'));
                let infoTooltip = document.createElement('div');
                infoTooltip.className = 'tootipWrapper';
                this.infoTooltip = new Tooltip(infoTooltip, {
                    target: targetCell,
                    contentTemplate: `
                        <div>New account ${targetCell.classList.contains('starting-balance-info') ? 'included' : 'added' }: ${this.cashflowService.formatAsCurrencyWithLocale(sum)}</div>
                    `,
                });
                targetCell.appendChild(infoTooltip);
                this.infoTooltip.show();
            }
        }
    }

    onMouseOut(e) {
        if (this.infoTooltip) {
            let targetCell = this.getCellElementFromTarget(e.target);
            let relatedTargetCell = e.relatedTarget && this.getCellElementFromTarget(e.relatedTarget);
            if (targetCell && targetCell !== relatedTargetCell) {
                let infoTooltipParent = this.infoTooltip.element().parentElement;
                this.infoTooltip.dispose();
                this.infoTooltip = undefined;
                if (infoTooltipParent) {
                    infoTooltipParent.removeChild(infoTooltipParent.querySelector('.tootipWrapper'));
                }
            }
        }
    }

    moveHistorical(movedCell, targetCellData): Observable<any> {
        let filter = this.cashflowService.getDetailFilterFromCell(movedCell);
        let destinationCategoryId = targetCellData.subCategoryId || targetCellData.categoryId;
        return this._classificationServiceProxy.updateTransactionsCategoryWithFilter(
            InstanceType[this.instanceType],
            this.instanceId,
            UpdateTransactionsCategoryWithFilterInput.fromJS({
                transactionFilter: filter,
                destinationCategoryId: destinationCategoryId,
                standardDescriptor: destinationCategoryId
                    ? (targetCellData.transactionDescriptor ? targetCellData.transactionDescriptor : filter.transactionDescriptor)
                    : 'Unclassified',
                suppressCashflowMismatch: true
            })
        );
    }

    updateMovedHistoricals(items: TransactionStatsDtoExtended[], targetData: CellInfo) {
        items.forEach((item: TransactionStatsDtoExtended) => {
            this.cashflowService.updateTreePathes(item, true);
            item.cashflowTypeId = targetData.cashflowTypeId;
            item.categoryId = targetData.categoryId;
            item.accountingTypeId = targetData.accountingTypeId;
            item.subCategoryId = targetData.subCategoryId;
            item.transactionDescriptor = targetData.transactionDescriptor || item.transactionDescriptor;
            this.cashflowService.addCategorizationLevels(item);
        });
    }

    createMovedForecastsModels(forecasts: CashFlowStatsDetailDto[], sourceData: CellInfo, targetData: CellInfo): UpdateForecastsInput {
        let date, forecastModel;
        let forecastModels = {'forecasts': []};
        const moveCategoryToCategory = sourceData.categoryId === targetData.categoryId && sourceData.subCategoryId === targetData.subCategoryId;
        forecasts.forEach(forecast => {
            date = this.getDateForForecast(targetData.fieldCaption, targetData.date.startDate, targetData.date.endDate, forecast.forecastDate.utc());
            forecastModel = new UpdateForecastInput({
                cashflowTypeId: targetData.cashflowTypeId,
                id: forecast.forecastId,
                date: moment(date),
                amount: forecast.debit !== null ? -forecast.debit : forecast.credit,
                categoryId: moveCategoryToCategory && forecast.categoryId != targetData.categoryId
                    ? forecast.categoryId
                    : targetData.subCategoryId || targetData.categoryId,
                transactionDescriptor: targetData.transactionDescriptor || forecast.descriptor,
                bankAccountId: forecast.accountId,
                description: forecast.description
            });

            if (forecastModel)
                forecastModels.forecasts.push(forecastModel);
        });

        return new UpdateForecastsInput(forecastModels);
    }

    moveForecasts(forecastsModels: UpdateForecastsInput): Observable<void> {
        return this._cashFlowForecastServiceProxy.updateForecasts(
            InstanceType[this.instanceType],
            this.instanceId,
            UpdateForecastsInput.fromJS(forecastsModels)
        );
    }

    copyForecasts(forecastsModels: CreateForecastsInput) {
        return this._cashFlowForecastServiceProxy.createForecasts(
            InstanceType[this.instanceType],
            this.instanceId,
            CreateForecastsInput.fromJS(forecastsModels)
        );
    }

    createCopyItemsModels(transactions: CashFlowStatsDetailDto[], sourceCellInfo: CellInfo, targetsData: CellInfo[], isHorizontalCopying: boolean): CreateForecastsInput {
        let forecastsItems: AddForecastInput[] = [];
        let activeAccountIds = this.cashflowService.getActiveAccountIds(this.cashflowService.bankAccounts, this.cashflowService.requestFilter.accountIds);
        targetsData.forEach(targetData => {
            transactions.forEach(transaction => {
                let target = { ...targetData };
                let transactionDate = transaction.forecastDate || transaction.date;
                let date = this.getDateForForecast(target.fieldCaption, target.date.startDate, target.date.endDate, transactionDate.utc());
                let transactionAccountId = this.cashflowService.bankAccounts.find(account => account.accountNumber === transaction.accountNumber).id;
                let accountId = this.cashflowService.getActiveAccountId(activeAccountIds, transactionAccountId);
                let data = {
                    forecastModelId: this.cashflowService.selectedForecastModelId,
                    bankAccountId: accountId,
                    date: moment(date),
                    startDate: target.date.startDate,
                    endDate: target.date.endDate,
                    currencyId: this._cfoPreferencesService.selectedCurrencyId,
                    amount: transaction.debit !== null ? -transaction.debit : transaction.credit
                };
                /** To update local data */
                if (isHorizontalCopying) {
                    target.transactionDescriptor = transaction.descriptor;
                    if (this.cashflowService.isSubCategory(transaction.categoryId, this.cashflowService.categoryTree)) {
                        target.subCategoryId = transaction.categoryId;
                    }
                }
                /** Get target descriptor or if we copy to category - get transaction description */
                target.transactionDescriptor = this.cashflowService.isUnclassified(target) && !isHorizontalCopying ? null : target.transactionDescriptor || transaction.descriptor;
                data['target'] = target;
                let categorizationData = this.cashflowService.getCategorizationFromForecastAndTarget(sourceCellInfo, target);
                let combinedData = <any>{ ...data, ...categorizationData };
                let forecastModel = new AddForecastInput(combinedData);
                if (forecastModel) {
                    forecastsItems.push(forecastModel);
                }
            });
        });
        return new CreateForecastsInput({
            forecasts: forecastsItems
        });
    }

    updateMovedForecasts(forecasts: TransactionStatsDtoExtended[], sourceCellData: CellInfo, targetData: CellInfo) {
        const moveCategoryToCategory = sourceCellData.categoryId === targetData.categoryId && sourceCellData.subCategoryId === targetData.subCategoryId;
        /** if the operation is update - then also remove the old objects (income or expense, net change and total balance) */
        forecasts.forEach((forecastInCashflow, index) => {
            /** Add stub to avoid hiding of old period from cashflow */
            let stubCopy = { ...forecastInCashflow };
            stubCopy.amount = 0;
            stubCopy.forecastId = null;
            stubCopy.transactionDescriptor = null;
            this.cashflowService.cashflowData.push(this.cashflowService.createStubTransaction(stubCopy));

            let date = moment(targetData.date.startDate).utc();
            let timezoneOffset = date.toDate().getTimezoneOffset();
            let correctedDate = date.add(timezoneOffset, 'minutes');

            /** Update pathTree before forecast has changed */
            this.cashflowService.updateTreePathes(forecastInCashflow, true);

            /** Change forecast locally */
            forecastInCashflow.cashflowTypeId = targetData.cashflowTypeId;
            forecastInCashflow.accountingTypeId = targetData.accountingTypeId;
            forecastInCashflow.categoryId = targetData.categoryId || targetData.subCategoryId;
            forecastInCashflow.subCategoryId = targetData.subCategoryId
                || (moveCategoryToCategory ? forecastInCashflow.subCategoryId : undefined);
            forecastInCashflow.transactionDescriptor = targetData.transactionDescriptor || forecastInCashflow.transactionDescriptor;

            /** Update forecast, its totals and net change items with new date if date changed */
            if (!forecastInCashflow.date.isSame(correctedDate)) {
                this.cashflowService.cashflowData.forEach(item => {
                    if (item.forecastId === forecastInCashflow.forecastId) {
                        item.date = correctedDate;
                        item.initialDate = targetData.date.startDate.utc();
                    }
                });
            }
            forecasts[index] = this.cashflowService.addCategorizationLevels(forecastInCashflow);
        });

    }

    createForecastsFromCopiedItems(copiedForecastsIds: number[], forecasts: AddForecastInput[], sourceData: CellInfo) {
        let activeAccountIds = this.cashflowService.getActiveAccountIds(this.cashflowService.bankAccounts, this.cashflowService.requestFilter.accountIds);
        forecasts.forEach((forecast, index) => {
            let timezoneOffset = forecast.date.toDate().getTimezoneOffset();
            let accountId = this.cashflowService.getActiveAccountId(activeAccountIds, forecast.bankAccountId);
            let data = {
                accountId: accountId,
                count: 1,
                amount: forecast.amount,
                date: moment(forecast.date).add(timezoneOffset, 'minutes'),
                initialDate: forecast.date,
                forecastId: copiedForecastsIds[index]
            };
            let categorizationData = this.cashflowService.getCategorizationFromForecastAndTarget(sourceData, forecast['target'], false);
            this.cashflowService.cashflowData.push(this.cashflowService.createStubTransaction({...data, ...categorizationData}));
        });
    }

    getDateForForecast(targetCaption, targetStartDate, targetEndDate, sourceDate) {
        let date = moment(targetStartDate);
        sourceDate = sourceDate.utc();
        /** if targetCellDate doesn't have certain month or day - get them from the copied transactions */
        if (['year', 'quarter', 'month'].indexOf(targetCaption) !== -1) {
            if (targetCaption === 'quarter') {
                date.month(date.month() + (sourceDate.month() % 3));
            }
            if (targetCaption === 'year') {
                date.month(sourceDate.month());
            }
            let dayNumber = sourceDate.date() < date.daysInMonth() ? sourceDate.date() : date.daysInMonth();
            date.date(dayNumber);
        }

        /** If current date is in target interval and is bigger then forecast date - then use current date as current */
        let currentDate = this.cashflowService.getUtcCurrentDate();
        if (currentDate.isBetween(date, targetEndDate, 'days', '(]')) {
            date = currentDate;
        } else {
            /** If date is after allowed last date for forecasts year feature - get this last date */
            const forecastsYearCount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));
            if (forecastsYearCount) {
                const allowedForecastsInterval = this.cashflowService.getAllowedForecastsInterval(forecastsYearCount);
                if (date.isAfter(allowedForecastsInterval.endDate)) {
                    date = allowedForecastsInterval.endDate;
                }
            }
        }

        /** @todo discuss and handle situation if end of filter is before current day and we move or copy to the current quarter/month etc */
        /** If date is after filter end date - use filter end date */
        // if (this.cashflowService.requestFilter.endDate && date.isAfter(this.cashflowService.requestFilter.endDate)) {
        //     date = this.cashflowService.requestFilter.endDate;
        // }

        return date;
    }

    mergeOptions(initialOptions: CellOptions, options: CellOptions) {
        for (let optionName in options) {
            let optionValue = options[optionName];
            if (optionValue === null) {
                continue;
            }
            if (Array.isArray(optionValue)) {
                initialOptions[optionName] = [ ...initialOptions[optionName], ...options[optionName] ];
                continue;
            }
            if (typeof optionValue === 'string') {
                initialOptions[optionName] = optionValue;
                continue;
            }
            if (typeof optionValue === 'object') {
                initialOptions[optionName] = { ...initialOptions[optionName], ...options[optionName] };
            }
        }
    }

    /**
     * Get user preferences by applyTo type
     * @param {"cells" | "areas"} applyTo
     */
    getUserPreferencesAppliedTo(applyTo: 'cells' | 'areas') {
        let userPreferences = [];
        for (let preferencesType of Object.keys(this.userPreferencesHandlers)) {
            let preferences = this.userPreferencesHandlers[preferencesType]['preferences'];
            for (let preferenceName of Object.keys(preferences)) {
                let preferenceApplyTo;
                if (preferences[preferenceName].applyTo) {
                    preferenceApplyTo = preferences[preferenceName].applyTo;
                } else {
                    preferenceApplyTo = this.userPreferencesHandlers[preferencesType]['applyTo'];
                }
                if (applyTo === preferenceApplyTo) {
                    preferences[preferenceName]['sourceName'] = preferenceName;
                    preferences[preferenceName]['sourceValue'] = this.cashflowService.cashflowGridSettings ? this.cashflowService.cashflowGridSettings[preferencesType][preferenceName] : null;
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
    showAmountsWithDecimals(cell, area, preference): CellOptions {
        let options: CellOptions = { attributes: {}, value: null };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (!isCellMarked) {
                options.value = this.cashflowService.formatAsCurrencyWithLocale(Math.round(cell.value), 0);

                /** add title to the cells that has too little value and shown as 0 to show the real value on hover */
                if (cell.value > -1 && cell.value < 1 && cell.value !== 0 && Math.abs(cell.value) >= 0.01) {
                    options.attributes.title = this.cashflowService.formatAsCurrencyWithLocale(cell.value, 2);
                }
            }
        }

        return options;
    }

    hideZeroValuesInCells(cell, area, preference): CellOptions {
        let options: CellOptions = { value: null, classes: [] };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && (cell.value > -0.01 && cell.value < 0.01)) {
                options.value = '';
                options.classes.push('hideZeroValues');
            }
        }
        return options;
    }

    showNegativeValuesInRed(cell, area, preference): CellOptions {
        let options: CellOptions = { classes: [] };
        let cellType = this.getCellType(cell, area);
        if (cellType) {
            let isCellMarked = this.userPreferencesService.isCellMarked(preference['sourceValue'], cellType);
            if (isCellMarked && cell.value < -0.01) {
                options.classes.push('red');
            }
        }
        return options;
    }

    addPreferenceClass(preference) {
        const className = this.userPreferencesService.getClassNameFromPreference(preference);
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).removeClass((index, classes) => {
                /** remove old setting class */
                const start = classes.indexOf(preference['sourceName']),
                      end = classes.indexOf(' ', start) === -1 ? classes.length + 1 : classes.indexOf(' ', start);
                return classes.slice(start, end);
            });
            $(`.dx-area-${area}-cell`).addClass(className);
        }
    }

    addPreferenceStyle(preference) {
        const cssProperty = dasherize(preference['sourceName']);
        for (let area of preference.areas) {
            $(`.dx-area-${area}-cell`).css(cssProperty, preference['sourceValue']);
        }
    }

    reformatCell(cell, area, preference): CellOptions {
        return { value: this.cashflowService.formatAsCurrencyWithLocale(cell.value) };
    }

    hideFooterBar() {
        this.cashflowService.cashflowGridSettings.visualPreferences.showFooterBar = false;
        this.userPreferencesService.removeLocalModel();
        this.handleBottomHorizontalScrollPosition();
        this.userPreferencesService.saveRemotely(this.cashflowService.cashflowGridSettings)
            .subscribe(() => {});
    }

    /** @todo refactor */
    getCellType(cell, area) {
        let cellType;
        if (this.cellTypesCheckMethods) {
            for (let type of Object.keys(this.cellTypesCheckMethods)) {
                let method = <any>this.cellTypesCheckMethods[type];
                if (method(cell, area)) {
                    cellType = type;
                    break;
                }
            }
        }
        return cellType;
    }

    getMarkupForExtendedHeaderCell(cellObj, hideHead, fieldName) {
        let value = cellObj.cell.path[cellObj.cell.path.length - 1];
        value = fieldName === 'quarter' ? 'Q' + value : value;
        return `<div class="head-cell-expand ${hideHead ? 'closed' : ''}">
                    <div class="main-head-cell">
                        ${cellObj.cellElement.innerHTML}
                        <div class="totals">${this.l('Totals').toUpperCase()}</div>
                    </div>
                    <div class="closed-head-cell" title="${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}">
                        ${this.l('Cashflow_ClickToGroupBy', value).toUpperCase()}
                    </div>
                </div>`;
    }

    /**
     * Hide projected row if all projected columns are expanded (except current)
     * @param cellObj
     */
    hideProjectedFields() {
        let projectedFields = this.getElementRef().nativeElement.querySelectorAll('.projectedField');
        if (projectedFields && projectedFields.length) {
            let allProjectedFieldsAreExpanded: boolean = [].every.call(projectedFields, projectedCell => {
                return projectedCell.classList.contains('dx-pivotgrid-expanded');
            });
            if (allProjectedFieldsAreExpanded) {
                /** Hide projected row */
                projectedFields[0].parentElement.classList.add('hidden');
                let dayRowElement = projectedFields[0].parentElement.nextElementSibling;
                if (dayRowElement) {
                    let currentDayElement = dayRowElement.querySelector('.currentDay');
                    if (currentDayElement) {
                        currentDayElement.classList.add('topBorder');
                    }
                }
            }
        }
    }

    /**
     * initialize the click trigger for the cell column if user click for the left empty cell
     * @param cellObj
     */
    bindCollapseActionOnWhiteSpaceColumn(cellObj) {
        let rowSpan = cellObj.cellElement.rowSpan || 1;
        let totalCell = $(cellObj.cellElement).parent().nextAll().eq(rowSpan - 1).first().find('td.dx-total');
        setTimeout(() => totalCell.trigger('click'));
    }

    getRequestFilterFromPath(path) {
        let requestFilter: StatsFilter = Object.assign({}, this.cashflowService.requestFilter);
        const datePeriod = this.cashflowService.formattingDate(path);
        /** if somehow user click on the cell that is not in the filter date range - return */
        if (this.cashflowService.requestFilter.startDate && datePeriod.endDate < this.cashflowService.requestFilter.startDate ||
            this.cashflowService.requestFilter.endDate && datePeriod.startDate > this.cashflowService.requestFilter.endDate) {
            return;
        }
        requestFilter.groupByPeriod = GroupByPeriod.Daily;
        requestFilter.startDate = this.cashflowService.requestFilter.startDate && moment(this.cashflowService.requestFilter.startDate).utc().isAfter(datePeriod.startDate) ? moment(this.cashflowService.requestFilter.startDate).utc() : datePeriod.startDate;
        requestFilter.endDate = this.cashflowService.requestFilter.endDate && moment(this.cashflowService.requestFilter.endDate).utc().isBefore(datePeriod.endDate ) ? moment(this.cashflowService.requestFilter.endDate).utc() : datePeriod.endDate;
        requestFilter.calculateStartingBalance = false;
        return requestFilter;
    }

    getDailyPeriods() {
        let dailyPeriods = [];
        let state = this.pivotGrid ? this.pivotGrid.instance.getDataSource().state() : this.stateLoad();
        if (state && state.columnExpandedPaths.length) {
            let monthIndex = this.cashflowService.getAreaIndexByCaption('month', 'column');
            state.columnExpandedPaths.forEach(columnPath => {
                if (columnPath.length === monthIndex + 1) {
                    this.monthsDaysLoadedPathes.push(columnPath);
                    let datePeriod = this.cashflowService.formattingDate(columnPath);
                    let dailyPeriod: Period = Period.fromJS({ start: datePeriod.startDate, end: datePeriod.endDate });
                    dailyPeriods.push(dailyPeriod);
                }
            });
        }
        return dailyPeriods;
    }

    isProjectedCellOfCurrentMonth(cellObj) {
        const projectedField = this.pivotGrid.instance.getDataSource().field('Projected');
        return cellObj.cell.path[projectedField.areaIndex] !== Projected.FutureTotal && cellObj.cell.path[projectedField.areaIndex] !== Projected.PastTotal;
    }

    onCellClick(cellObj) {

        let isProjectedHeaderCell = this.isProjectedHeaderCell(cellObj);
        let isProjectedCellOfCurrentMonth = isProjectedHeaderCell ? this.isProjectedCellOfCurrentMonth(cellObj) : false;

        /** If user double click on category - open edit field */
        if (this.isInstanceAdmin && this.cashflowService.isCategoryCell(cellObj.cell, cellObj.area)) {
            /** Cancel all clicks types - single and double */
            cellObj.cancel = true;
            /** Handle double click */
            this.cashflowService.handleDoubleSingleClick(
                cellObj,
                () => {
                    /** Expand or collapse field for single click */
                    if (this.hasChildsByPath(cellObj.cell.path)) {
                        cellObj.cell.expanded
                            ? this.pivotGrid.instance.getDataSource().collapseHeaderItem('row', cellObj.cell.path)
                            : this.pivotGrid.instance.getDataSource().expandHeaderItem('row', cellObj.cell.path);
                    }
                },
                () => {
                    /** Open edit field for double click */
                    this.cashflowService.openEditField(cellObj, {
                        currencySymbol: this._cfoPreferencesService.selectedCurrencySymbol,
                        type: 'text',
                        onValueChanged: this.updateCategory
                    });
                }
            );
        }

        /** Disallow collapsing of total projected and historical fields */
        if (((isProjectedHeaderCell && !isProjectedCellOfCurrentMonth) || this.cashflowService.isHistoricalCell(cellObj)) && cellObj.event.isTrusted) {
            cellObj.cancel = true;
        }

        /** If user clicks on current projected field expand all current projected */
        if (isProjectedHeaderCell && isProjectedCellOfCurrentMonth && !cellObj.cell.expanded) {
            cellObj.cancel = true;
            this.expandCurrentMonthProjectedColumns(cellObj.cell.path.slice(0));
        }

        /** If user click to the month header - then sent new getStats request for this month to load data for that month */
        let isMonthHeaderCell = this.isMonthHeaderCell(cellObj);
        if (isMonthHeaderCell) {
            let requestFilter = this.getRequestFilterFromPath(cellObj.cell.path);
            let monthIsCurrent = requestFilter.startDate.format('MM.YYYY') === moment().format('MM.YYYY');
            if (!cellObj.cell.expanded) {
                let pathForMonth = isMonthHeaderCell ? cellObj.cell.path : cellObj.cell.path.slice(0, -1);
                if (!this.monthsDaysLoadedPathes.some(arr => arr.toString() === pathForMonth.toString())) {
                    this.startLoading();
                    /** Prevent default expanding */
                    this._cashflowServiceProxy
                        .getStats(InstanceType[this.instanceType], this.instanceId, requestFilter)
                        .pipe(pluck('transactionStats'))
                        .subscribe(
                            (transactions: any) => {

                                /** Update cashflow data with the daily transactions */
                                this.handleDailyCashflowData(transactions, requestFilter.startDate, requestFilter.endDate);

                                /** Reload the cashflow */
                                this.pivotGrid.instance.getDataSource().reload();

                                /** Mark the month as already expanded to avoid double data loading */
                                this.monthsDaysLoadedPathes.push(pathForMonth);

                                /** If month is not current month - expand it into days instead of total */
                                if (!monthIsCurrent && this.projectedFieldIsVisible()) {
                                    this.expandMonthProjectedChilds(cellObj);
                                }
                            },
                            () => {},
                            () => this.finishLoading()
                        );
                } else {
                    /** If month is not current month - expand it into days instead of total */
                    if (!monthIsCurrent && this.projectedFieldIsVisible()) {
                        this.expandMonthProjectedChilds(cellObj);
                    }
                }

            } else {
                /** If we collapse month - collapse projected columns of current month to show them after next expand of the month */
                if (monthIsCurrent) {
                    let projectedRow = cellObj.cellElement.closest('table').querySelector('.projectedRow');
                    if (projectedRow) {
                        let collapseMonth = !projectedRow.classList.contains('hidden');
                        if (!collapseMonth) {
                            cellObj.cancel = true;
                        }
                        this.collapseCurrentMonthProjectedColums(cellObj.cell.path.slice(), collapseMonth);
                    }
                }
            }
        }

        /** If user click to Reconciliation button - call reconcile method */
        if (cellObj.event.target.classList.contains('dx-link-discard')) {
            this.discardDiscrepancy(cellObj);
        }

        /** bind the collapse action on white space column */
        if (cellObj.cell.isWhiteSpace) {
            this.bindCollapseActionOnWhiteSpaceColumn(cellObj);
        }

        if (cellObj.area === 'data') {
            if (!cellObj.cellElement.classList.contains('selectedCell')) {
                $('.selectedCell').removeClass('selectedCell');
                this.hideModifyingNumberBox();
                cellObj.cellElement.classList.add('selectedCell');
            }

            if (this.userPreferencesService.localPreferences.value.showCategoryTotals && this.isCopyable(cellObj)) {
                let crossMovingTriangle = this._cellsCopyingService.getCrossMovingTriangle();
                cellObj.cellElement.appendChild(crossMovingTriangle);
            } else if (this._cellsCopyingService.elem) {
                this._cellsCopyingService.elem.remove();
            }
            this.selectedCell = cellObj;
            this.cashflowService.handleDoubleSingleClick(cellObj, null, () => {
                this.doubleClickedCell = this.selectedCell;
                this.handleDataCellDoubleClick(cellObj);
            });
        }
    }

    private updateCategory = (e, cellObj) => {
        const categoryId = this.cashflowService.getCategoryValueByPrefix(cellObj.cell.path, CategorizationPrefixes.Category);
        const subCategoryId = this.cashflowService.getCategoryValueByPrefix(cellObj.cell.path, CategorizationPrefixes.SubCategory);
        const id = +(subCategoryId || categoryId);
        this.cashflowService.valueIsChanging = true;
        this._categoryTreeServiceProxy.updateCategory(
            InstanceType[this.instanceType],
            this.instanceId,
            new UpdateCategoryInput({
                id: id,
                parentId: this.cashflowService.categoryTree.categories[id].parentId,
                accountingTypeId: this.cashflowService.categoryTree.categories[id].accountingTypeId,
                name: e.value,
                coAID: this.cashflowService.categoryTree.categories[id].coAID
            })
        ).pipe(
            finalize(() => {
                this.cashflowService.removeModifyingCellInput();
                this.cashflowService.valueIsChanging = false;
            })
        ).subscribe(() => {
            this.reloadCategoryTree();
            this.cashflowService.categoryTree.categories[id].name = e.value;
            this.cashflowService.modifyingInputObj.cell.text = e.value;
            this.pivotGrid.instance.getDataSource().reload();
        });
    }

    private reloadCategoryTree() {
        this._categoryTreeServiceProxy.get(InstanceType[this.instanceType], this.instanceId, true)
            .subscribe((categoryTreeResult: GetCategoryTreeOutput) => {
                this.cashflowService.handleGetCategoryTreeResult(categoryTreeResult);
            });
    }

    projectedFieldIsVisible() {
        return this.pivotGrid && this.pivotGrid.instance.getDataSource().field('Projected').visible;
    }

    handleCellsSelecting(cellsToCopy) {
        this.getElementRef().nativeElement.querySelectorAll('.selectedCell').forEach(cell => {
            if (cell !== this._cellsCopyingService.copiedCell) {
                cell.classList.remove('selectedCell');
            }
        });
        if (cellsToCopy && cellsToCopy.length) {
            cellsToCopy.forEach(cell => {
                let cellObj = this.getCellObjectFromCellElement(cell);
                if (this.cellCanBeTargetOfCopy(cellObj)) {
                    /** Add selected cell */
                    cell.classList.add('selectedCell');
                }
            });
        }
    }

    handleCellsCopying(sourceCell: any, targetCells: any[]) {
        if (targetCells && targetCells.length) {
            let sourceCellObject = sourceCell instanceof HTMLTableCellElement ? this.getCellObjectFromCellElement(sourceCell) : sourceCell;

            /** Create forecasts for the cell */
            let targetCellsObj = [];
            targetCells.forEach(cell => {
                let cellObj = cell instanceof HTMLTableCellElement ? this.getCellObjectFromCellElement(cell) : cell;
                if (this.cellCanBeTargetOfCopy(cellObj)) {
                    targetCellsObj.push(cellObj);
                }
            });

            let copyItemsModels;
            if (targetCellsObj.length) {
                let sourceCellInfo = this.cashflowService.getCellInfo(sourceCellObject);
                let targetsData = targetCellsObj.map(cell => this.cashflowService.getCellInfo(cell, {
                    cashflowTypeId: this.cashflowService.getCategoryValueByValue(sourceCellObject.cell.value)
                }));
                const isHorizontalCopying = this.cashflowService.isHorizontalCopying(sourceCellObject, targetCellsObj);
                this.statsDetailFilter = this.cashflowService.getDetailFilterFromCell(sourceCellObject);
                this._cashflowServiceProxy
                    .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                    .pipe(
                        map(transactions => {
                            copyItemsModels = transactions && transactions.length ? this.createCopyItemsModels(transactions, sourceCellInfo, targetsData, isHorizontalCopying) : null;
                            return copyItemsModels;
                        }),
                        mergeMap(forecastModels => this.copyForecasts(forecastModels))
                    )
                    .subscribe(
                        res => {
                            if (copyItemsModels && copyItemsModels.forecasts && copyItemsModels.forecasts.length) {
                                this.createForecastsFromCopiedItems(res, copyItemsModels.forecasts, sourceCellInfo);
                                this.updateDataSource()
                                    .then(() => {
                                        this.notify.success(this.l('Cell_pasted'));
                                    });
                            }
                        }
                    );
            }
        }
    }

    updateDataSource(): Promise<any> & JQueryPromise<any> {
        this.getUserPreferencesForCell.cache = {};
        this.getCellOptionsFromCell.cache = {};
        this.getNewTextWidth.cache = {};
        return this.pivotGrid.instance.getDataSource().reload();
    }

    /**
     * Expands projected child columns of current month
     * @param {number[]} path
     */
    expandCurrentMonthProjectedColumns(path: number[]) {
        let monthPath = path.slice(0, path.length - 1);
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Mtd]));
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Today]));
        this.pivotGrid.instance.getDataSource().expandHeaderItem('column', monthPath.concat([Projected.Forecast]));
    }

    /**
     * Collapse projected child columns of current month
     * @param {number[]} path
     */
    collapseCurrentMonthProjectedColums(path: number[], collapseMonth: boolean) {
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Mtd]));
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Today]));
        this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path.concat([Projected.Forecast]));
        if (collapseMonth) {
            this.pivotGrid.instance.getDataSource().collapseHeaderItem('column', path);
        }
    }

    expandMonthProjectedChilds(cellObj) {
        let pathCopy = cellObj.cell.path.slice();
        let projectedValue = cellObj.cellElement.className.indexOf('prev') !== -1 ? Projected.PastTotal : Projected.FutureTotal;
        /** Save expanding of month in state to expand it on content ready  */
        this.fieldPathsToClick.push(pathCopy.concat([projectedValue]));
    }

    onCopy(ev) {
        this.copiedCell = this.selectedCell;
        this.notify.info(this.l('Cell_Copied'));
    }

    onPaste() {
        this.handleCellsCopying(this.copiedCell, [this.selectedCell]);
    }

    onDelete(ev) {
        let cellObj = this.selectedCell;
        let clickedCellPrefix = cellObj.cell.rowPath.slice(-1)[0] ? cellObj.cell.rowPath.slice(-1)[0].slice(0, 2) : undefined;
        if (
            this.cashflowService.cellIsNotHistorical(cellObj) &&
            clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
            clickedCellPrefix !== CategorizationPrefixes.AccountName
        ) {
            /** If we delete another cell then opened in details we get statsDetails for this cell, else - get already loaded details */
            let statsDetails$ = of(this.statsDetailResult);
            if (this.selectedCell !== this.doubleClickedCell) {
                this.statsDetailFilter = this.cashflowService.getDetailFilterFromCell(cellObj);
                statsDetails$ = this._cashflowServiceProxy.getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter);
            }
            statsDetails$
                .pipe(
                    filter(result => result.length !== 0),
                    switchMap(result => this.removeForecasts(result))
                ).subscribe(() => {
                    /** If we delete cell that opened in details */
                    if (this.selectedCell && this.doubleClickedCell && this.selectedCell.cellElement === this.doubleClickedCell.cellElement) {
                        /** Clear details result to show No Data instead of deleted rows */
                        this._statsDetailResult.next([]);
                    }
                });
        }
    }

    removeForecasts(forecasts: CashFlowStatsDetailDto[]): Observable<any> {
        let result$ = of(null);
        let forecastIds: number[] = [];
        let forecastDates = [];
        forecasts.forEach(item => {
            if (item.forecastId) {
                forecastIds.push(item.forecastId);
                if (!underscore.contains(forecastDates, item.forecastDate))
                    forecastDates.push(item.forecastDate);
            }
        });
        if (forecastIds.length) {
            result$ = this._cashFlowForecastServiceProxy
                .deleteForecasts(InstanceType[this.instanceType], this.instanceId, forecastIds).pipe(
                    publishReplay(),
                    refCount()
                );
            result$.subscribe(() => {
                let temp = {};
                for (let i = this.cashflowService.cashflowData.length - 1; i >= 0; i--) {
                    let item = this.cashflowService.cashflowData[i];

                    if (underscore.contains(forecastIds, item.forecastId)) {
                        this.cashflowService.cashflowData.splice(i, 1);
                        if (!temp[item.forecastId])
                            temp[item.forecastId] = { 'affectedTransactions': [] };

                        temp[item.forecastId]['affectedTransactions'].push(item);
                    } else {
                        let itemForRemoveIndex = 0;
                        forecastDates.forEach((date, i) => {
                            if (moment(date).utc().isSame(item.date)) {
                                itemForRemoveIndex = i;
                            }
                        });
                        if (itemForRemoveIndex)
                            forecastDates.splice(itemForRemoveIndex, 1);
                    }
                }

                forecastDates.forEach(() => {
                    forecastIds.forEach(id => {
                        temp[id]['affectedTransactions'].forEach(item => {
                            this.cashflowService.cashflowData.push(
                                this.cashflowService.createStubTransaction({
                                    date: item.date,
                                    initialDate: (<any>item).initialDate,
                                    amount: 0,
                                    accountingTypeId: item.accountingTypeId,
                                    cashflowTypeId: item.cashflowTypeId,
                                    categoryId: item.categoryId,
                                    subCategoryId: item.subCategoryId,
                                    accountId: item.accountId
                                }));
                            /** If forecast has description - then remove it from the cashflow tree */
                            this.cashflowService.updateTreePathes(item, item.transactionDescriptor);
                        });
                    });
                });

                this.updateDataSource()
                    .then(() => {
                        this.notify.success(this.l('Forecasts_deleted'));
                    });
            });
        }
        return result$;
    }

    cellCanBeTargetOfCopy(cellObj): boolean {
        const cellDateInterval = this.cashflowService.formattingDate(cellObj.cell.columnPath);
        const futureForecastsYearsAmount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));
        return (cellObj.cell.rowPath[0] === PI || cellObj.cell.rowPath[0] === PE || cellObj.cell.rowPath[0] === PCTT)
            && !this.cashflowService.isCashflowTypeRowTotal(cellObj.cell, cellObj.area)
            && !this.cashflowService.isAccountingRowTotal(cellObj.cell, cellObj.area)
            && this.cashflowService.cellIsNotHistorical(cellObj)
            && this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)
            && cellObj.cell.columnType !== Total;
    }

    handleDataCellDoubleClick(cellObj) {
        this.statsDetailFilter = this.cashflowService.getDetailFilterFromCell(cellObj);
        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
            .subscribe(result => {
                /**
                 * If the cell is not historical
                 * If cell is current - if amount of results is 0 - add, > 1 - show details
                 * If cell is forecast - if amount of results is 0 - add, > 1 - show details
                 */
                let clickedCellPrefix = cellObj.cell.rowPath.slice(-1)[0] ? cellObj.cell.rowPath.slice(-1)[0].slice(0, 2) : undefined;
                const cellIsNotHistorical = this.cashflowService.cellIsNotHistorical(cellObj);
                if (this.isInstanceAdmin &&
                    /** disallow adding if category totals is deactivated */
                    this.userPreferencesService.localPreferences.value.showCategoryTotals &&
                    /** disallow adding historical periods */
                    cellIsNotHistorical &&
                    /** allow adding only for empty cells */
                    result.length === 0 &&
                    /** disallow adding of these levels */
                    clickedCellPrefix !== CategorizationPrefixes.CashflowType &&
                    clickedCellPrefix !== CategorizationPrefixes.ReportingGroup &&
                    clickedCellPrefix !== CategorizationPrefixes.ReportingSection &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountingType &&
                    clickedCellPrefix !== CategorizationPrefixes.AccountName &&
                    /** allow adding if checked active accounts */
                    this.allowChangingForecast
                ) {
                    const cellDateInterval = this.cashflowService.formattingDate(cellObj.cell.columnPath);
                    const futureForecastsYearsAmount = parseInt(this.feature.getValue(AppFeatures.CFOFutureForecastsYearCount));
                    if (futureForecastsYearsAmount && !this.cashflowService.cellIsAllowedForAddingForecast(cellDateInterval, futureForecastsYearsAmount)) {
                        this.notify.error(this.l('ForecastIsProjectedTooFarAhead'));
                    } else {
                        this.handleForecastAdding(cellObj);
                    }
                } else {
                    this.detailsPeriodIsHistorical = !cellIsNotHistorical;
                    this.showTransactionDetail(result);
                }
            });
    }

    handleForecastAdding(cellObj) {
        let element: HTMLElement = cellObj.cellElement;
        /** if the modifying input has already exists */
        if (this.modifyingCellNumberBox) {
            this.removeModifyingCellNumberBox();
        }
        if (!element.querySelector('span'))
            $(element).wrapInner('<span></span>');
        $(element).children().hide();
        this.oldCellPadding = window.getComputedStyle(element).padding;
        element.style.padding = '0';

        let wrapper = document.createElement('div');
        wrapper.onclick = function(ev) {
            ev.stopPropagation();
        };
        let wrapperButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };

        this.modifyingCellNumberBox = new NumberBox(wrapper, {
            value: cellObj.cell.value,
            height: element.clientHeight,
            format: this._cfoPreferencesService.selectedCurrencySymbol + ' #,###.##',
            onEnterKey: this.saveForecast.bind(this, cellObj)
        });
        this.functionButton = new Button(wrapperButton, {
            iconSrc: './assets/common/icons/fx.svg',
            onClick: this.toggelCalculator.bind(this, event),
            elementAttr: { 'class' : 'function-button'}
        });
        element.appendChild(this.functionButton.element());
        element.appendChild(this.modifyingCellNumberBox.element());
        this.modifyingCellNumberBox.element().querySelector('input.dx-texteditor-input')['style'].fontSize = this.cashflowService.cashflowGridSettings.visualPreferences.fontSize;
        this.modifyingCellNumberBox.focus();
        element = null;
        this.modifyingNumberBoxCellObj = cellObj;
        this.modifyingNumberBoxStatsDetailFilter = this.statsDetailFilter;
    }

    removeModifyingCellNumberBox() {
        let parentTD = this.modifyingCellNumberBox.element().parentElement;
        this.modifyingCellNumberBox.dispose();
        this.modifyingCellNumberBox.element().remove();
        this.modifyingCellNumberBox = null;
        this.functionButton.dispose();
        this.functionButton.element().remove();
        this.functionButton = null;
        if (this.saveButton) {
            this.saveButton.dispose();
            this.saveButton.element().remove();
            this.saveButton = null;
        }

        let editor = $('.dx-editor-cell.calculator-number-box');
        editor = editor.removeClass('calculator-number-box');
        if (!parentTD.parentElement.classList.contains('dx-row-inserted')) {
            editor.removeClass('dx-editor-cell');
        }
        $(parentTD).children().show();
        /** Remove inner span wrapper in the cell */
        parentTD.innerHTML = parentTD.firstElementChild.innerHTML;
        parentTD.style.padding = this.oldCellPadding;
        this.closeCalculator();
        this.modifyingNumberBoxCellObj = null;
        this.modifyingNumberBoxStatsDetailFilter = null;
        this.detailsModifyingNumberBoxCellObj = null;
    }

    showTransactionDetail(details) {
        this._statsDetailResult.next(details.map(detail => {
            this.removeLocalTimezoneOffset(detail.date);
            this.removeLocalTimezoneOffset(detail.forecastDate);
            return detail;
        }));
        /** If period is historical*/
        this.disableAddForecastButton = this.detailsPeriodIsHistorical
            || !this.userPreferencesService.localPreferences.value.showCategoryTotals
            /** Or not category, subcategory or descriptor */
            || (
                !this.statsDetailFilter.categoryId
                && !this.statsDetailFilter.subCategoryId
                && !this.statsDetailFilter.transactionDescriptor
            )
            /** Or not income or expense*/
            || (
                this.statsDetailFilter.cashflowTypeId != Income
                && this.statsDetailFilter.cashflowTypeId != Expense
            );

        setTimeout(() => {
            let height = this._cacheService.get(this.cashflowDetailsGridSessionIdentifier);
            if (height) {
                let cashflowWrapElement = <HTMLElement>document.querySelector('.cashflow-wrap');
                cashflowWrapElement.style.height = height + 'px';
            }
            this.handleBottomHorizontalScrollPosition();
            this.handleVerticalScrollPosition();
        }, 0);
    }

    onTransactionDetailsResize($event) {
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    onTransactionDetailsResizeEnd($event) {
        this._cacheService.set(this.cashflowDetailsGridSessionIdentifier, $event.height);
    }

    saveForecast() {
        let [savedCellObj, event] = Array.from(arguments);
        savedCellObj = savedCellObj || this.modifyingNumberBoxCellObj;
        let newValue = event ? event.component.option('value') : this.modifyingCellNumberBox.option('value');

        if (+newValue !== 0) {
            let forecastModel;
            let categoryId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.Category);
            let subCategoryId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.SubCategory);
            let cashflowTypeId = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.CashflowType)
                || this.cashflowService.getCashFlowTypeByCategory(subCategoryId || categoryId, this.cashflowService.categoryTree)
                || this.cashflowService.getCategoryValueByValue(+newValue);
            let transactionDescriptor = this.cashflowService.getCategoryValueByPrefix(savedCellObj.cell.rowPath, CategorizationPrefixes.TransactionDescriptor);
            let currentDate = this.cashflowService.getUtcCurrentDate();
            let targetDate = this.modifyingNumberBoxStatsDetailFilter.startDate.isSameOrAfter(currentDate) ? moment(this.modifyingNumberBoxStatsDetailFilter.startDate).utc() : currentDate;
            let activeBankAccountsIds = this.cashflowService.getActiveAccountIds(this.cashflowService.bankAccounts, this.modifyingNumberBoxStatsDetailFilter.accountIds);
            let accountId = activeBankAccountsIds && activeBankAccountsIds.length ? activeBankAccountsIds[0] : (this.modifyingNumberBoxStatsDetailFilter.accountIds[0] || this.cashflowService.bankAccounts[0].id);
            forecastModel = new AddForecastInput({
                forecastModelId: this.cashflowService.selectedForecastModelId,
                bankAccountId: accountId,
                date: targetDate,
                startDate: this.modifyingNumberBoxStatsDetailFilter.startDate,
                endDate: this.modifyingNumberBoxStatsDetailFilter.endDate,
                cashFlowTypeId: cashflowTypeId,
                categoryId: subCategoryId || categoryId,
                transactionDescriptor: transactionDescriptor,
                currencyId: this._cfoPreferencesService.selectedCurrencyId,
                amount: newValue,
                description: null
            });

            this._cashFlowForecastServiceProxy.addForecast(
                InstanceType[this.instanceType],
                this.instanceId,
                forecastModel
            ).subscribe(
                res => {
                    let dateWithOffset = moment(targetDate).add(new Date(<any>targetDate).getTimezoneOffset(), 'minutes');
                    /** Update data locally */
                    this.cashflowService.cashflowData.push(this.cashflowService.createStubTransaction({
                        accountId: accountId,
                        count: 1,
                        amount: newValue,
                        date: dateWithOffset,
                        cashflowTypeId: cashflowTypeId,
                        initialDate: targetDate,
                        forecastId: res
                    }, savedCellObj.cell.rowPath));
                    this.getApiDataSource();
                    this.pivotGrid.instance.getDataSource().reload()
                        .then(() => {
                            this.notify.success(this.l('Forecasts_added'));
                            abp.ui.clearBusy();
                        });

                });
        }
        this.removeModifyingCellNumberBox();
    }

    customCurrency = value => {
        return this.cashflowService.formatAsCurrencyWithLocale(value);
    }

    closeTransactionsDetail() {
        this.statsDetailResult = undefined;
        this.cashflowService.showAllVisible = false;
        this.cashflowService.showAllDisable = false;
        this.disableAddForecastButton = true;
        this.doubleClickedCell = null;
        this.handleBottomHorizontalScrollPosition();
        this.handleVerticalScrollPosition();
    }

    reclassifyTransactions($event) {
        /** get only transactions, filter out forecasts and adjustments */
        let transactions = this.cashFlowGrid.instance.getSelectedRowKeys().filter(item => item.date && item.cashflowTypeId !== StartedBalance);
        if (transactions.length) {
            let config: any = {
                panelClass: 'slider',
                data: {
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
            };
            this.dialog.open(RuleDialogComponent, config).afterClosed().subscribe(() => { });
        }
    }

    /**
     * Find if the group has childs by path and fields list
     * @param path - the array with the path
     * @return {boolean}
     */
    hasChildsByPath(path): boolean {
        let cellPath = path.join(',');
        let keys = Object.keys(this.cashflowService.treePathes);
        const containsUnclassified = !path.slice(-1)[0];
        return keys.some(path => {
            let currentPathIndex = path.indexOf(cellPath);
            return (!containsUnclassified && currentPathIndex !== -1 && path.split(',').length > cellPath.split(',').length)
                   || (containsUnclassified && path.indexOf(cellPath + ',') !== -1);
        });
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

    addLocalTimezoneOffset(date) {
        if (date) {
            let offset = new Date(date).getTimezoneOffset();
            date.add(-offset, 'minutes');
        }
    }

    showPreferencesDialog() {
        this.dialog.open(PreferencesDialogComponent, {
            panelClass: 'slider',
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
        sortOptions.sortOrder = event.itemElement.classList.contains('desc') ? 'asc' : 'desc';
        $(event.itemElement.parentElement).children().removeClass('asc desc');
        event.itemElement.classList.add(sortOptions.sortOrder);
        this.cashflowService.apiTableFields.filter(field => field.resortable).forEach(field => {
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
        super.startLoading();
        let pivotGridElement = document.querySelector('.pivot-grid');
        if (pivotGridElement) pivotGridElement.classList.add('invisible');
        pivotGridElement = null;
    }

    /** Finish loading animation */
    finishLoading() {
        setTimeout(() => {
            super.finishLoading();
            let pivotGridElement = document.querySelector('.pivot-grid');
            if (pivotGridElement) pivotGridElement.classList.remove('invisible');
        }, 1000);
    }

    searchValueChange(value) {
        this.detailsStartLoading();
        this.searchValue = value;
        if (this.searchValue) {
            this.cashflowService.showAllVisible = true;
            this.cashflowService.showAllDisable = true;
            this.disableAddForecastButton = true;
            let filterParams = {
                startDate: this.cashflowService.requestFilter.startDate,
                endDate: this.cashflowService.requestFilter.endDate,
                currencyId: this._cfoPreferencesService.selectedCurrencyId,
                accountIds: this.cashflowService.requestFilter.accountIds || [],
                businessEntityIds: this.cashflowService.requestFilter.businessEntityIds || [],
                searchTerm: this.searchValue,
                forecastModelId: this.cashflowService.selectedForecastModelId
            };
            this.statsDetailFilter = StatsDetailFilter.fromJS(filterParams);
            this._cashflowServiceProxy
                .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
                .pipe(finalize(() => this.detailsFinishLoading()))
                .subscribe(result => {
                    this.showTransactionDetail(result);
                });
        } else {
            this.statsDetailResult = null;
            this.closeTransactionsDetail();
        }
    }

    refreshTransactionDetail(showAll = true) {
        this.cashflowService.showAllVisible = this.searchValue && !showAll ?  true : false;
        this.statsDetailFilter.searchTerm = showAll ? '' : this.searchValue;

        this._cashflowServiceProxy
            .getStatsDetails(InstanceType[this.instanceType], this.instanceId, this.statsDetailFilter)
            .subscribe(result => {
                this.showTransactionDetail(result);
            });
    }

    detailsCellIsEditable(e) {
        return e.data && ((e.column.dataField == 'descriptor') || (e.data.forecastId && ['forecastDate', 'description', 'debit', 'credit'].indexOf(e.column.dataField) !== -1));
    }

    onDetailsCellPrepared(e) {
        if (e.rowType === 'data') {
            if (this.detailsCellIsEditable(e)) {
                e.cellElement.classList.add('editable');
            }

            if (e.column.dataField === 'status') {
                e.cellElement.classList.add('statusField', e.data.status.toLowerCase());
            }

            if (e.column.dataField === 'cashflowTypeId') {
                let className;
                switch (e.data.cashflowTypeId) {
                    case Income: className = 'inflows'; break;
                    case Expense: className = 'outflows'; break;
                }
                if (className) {
                    e.cellElement.classList.add(className);
                }
            }
        }
    }

    addNewForecast() {
        this.cashFlowGrid.instance.addRow();
    }

    onDetailsCellClick(e) {
        if (!e.event.target.closest('.calculator-number-box'))
            this.hideModifyingNumberBox();

        this.cashflowService.handleDoubleSingleClick(e, this.onDetailsCellSingleClick.bind(this),
            this.isInstanceAdmin || this._cfoService.classifyTransactionsAllowed ? this.onDetailsCellDoubleClick.bind(this) : Function());

        if (e.rowType === 'data' && !e.column.command) {
            if (!e.cellElement.classList.contains('selectedCell')) {
                $(e.element).find('.selectedCell').removeClass('selectedCell');
                e.cellElement.classList.add('selectedCell');
            }
        }
    }

    onDetailsCellSingleClick(e) {
        if (e.rowType === 'data' && e.column.dataField == 'description' && !e.key.forecastId && !e.row.inserted && e.data.cashflowTypeId !== Reconciliation && e.data.cashflowTypeId !== StartedBalance) {
            this.transactionId = e.data.id;
            this.showTransactionDetailsInfo();
        } else if (this.isInstanceAdmin && e.row && e.row.inserted && (e.column.dataField == 'debit' || e.column.dataField == 'credit'))
            this.onAmountCellEditStart(e);
    }

    onDetailsCellDoubleClick(e) {
        if (e.column && (e.column.dataField == 'forecastDate' || e.column.dataField == 'description' || e.column.dataField == 'descriptor' || e.column.dataField == 'accountNumber'))
            e.component.editCell(e.rowIndex, e.column.dataField);

        if (this.isInstanceAdmin && e.column && e.component.option('editing.mode') != 'row' && (e.column.dataField == 'debit' || e.column.dataField == 'credit'))
            this.onAmountCellEditStart(e);

        if (e.rowType === 'data' && this._cfoService.classifyTransactionsAllowed && e.column.dataField == 'categoryName' && e.data.categoryId) {
            this.dialog.open(RuleDialogComponent, {
                panelClass: 'slider',
                data: {
                    categoryId: e.data.categoryId,
                    categoryCashflowTypeId: e.cashflowTypeId,
                    transactions: [e.data],
                    transactionIds: [e.data.id],
                    refershParent: this.refreshTransactionDetail.bind(this)
                }
            }).afterClosed().subscribe();
        }
    }

    /**
     * Editing only for forecasts and transaction descriptor
     * @param e
     */
    onDetailsEditingStart(e) {
        if (e.data.date && e.column.dataField != 'descriptor') {
            e.cancel = true;
        }
    }

    onEditorPreparing(event) {
        if (event.dataField == 'debit' || event.dataField == 'credit') {
            event.editorName = 'dxNumberBox';
            event.editorOptions['format'] = this._cfoPreferencesService.selectedCurrencySymbol + ' #,###.##';
        }
    }

    /** If date is lower then the current date - return false */
    validateForecastDate = e => {
        if (e.data.date) //ignore for historical
            return true;

        if (!e.value || e.value == '') {
            e.rule.message = '';
            return false;
        }

        e.rule.message = this.l('ForecastDateUpdating_validation_message');
        let currentDate = this.cashflowService.getUtcCurrentDate();
        let timezoneOffset = e.value.getTimezoneOffset();
        let forecastDate = moment(e.value).utc().subtract(timezoneOffset, 'minutes');
        let dateIsValid = forecastDate.isSameOrAfter(currentDate);

        return dateIsValid;
    }

    onDetailsRowPrepared(e) {
        if (e.rowType === 'data' && !e.data.date) {
            e.rowElement.classList.add('forecastRow');
        }

        if (e.rowType === 'data' && e.data.status === Status.Projected) {
            e.rowElement.classList.add('projected');
        }

        if (e.rowType === 'data' && e.data.cashflowTypeId === StartedBalance) {
            e.rowElement.classList.add('adjustmentRow');
        }
    }

    onInitNewRow(e) {
        let dataGrid = e.component;

        dataGrid.beginUpdate();
        dataGrid.option('editing.mode', 'row');
        dataGrid.columnOption('command:edit', { width: 50 });
        dataGrid.columnOption('forecastDate', { allowEditing: true });
        dataGrid.columnOption('description', { allowEditing: true });
        dataGrid.columnOption('descriptor', { allowEditing: true });
        dataGrid.columnOption('debit', { allowEditing: true });
        dataGrid.columnOption('credit', { allowEditing: true });
        dataGrid.columnOption('accountNumber', { allowEditing: true });
        dataGrid.endUpdate();
        this.changeTransactionGridEditMode = true;

        let data: CashFlowStatsDetailDto = e.data;

        data.id = -1;
        data.forecastId = -1;
        data.status = Status.Projected;
        data.cashflowTypeId = this.statsDetailFilter.cashflowTypeId;
        data.categoryId = this.statsDetailFilter.subCategoryId || this.statsDetailFilter.categoryId;
        data.descriptor = this.statsDetailFilter.transactionDescriptor;

        let currentDate = this.cashflowService.getUtcCurrentDate();
        data.forecastDate = this.statsDetailFilter.startDate.isSameOrAfter(currentDate) ? moment(this.statsDetailFilter.startDate).utc() : currentDate;
        data.currencyId = this._cfoPreferencesService.selectedCurrencyId;

        let activeBankAccountsIds = this.cashflowService.getActiveAccountIds(this.cashflowService.bankAccounts, this.statsDetailFilter.accountIds);
        let accountId = activeBankAccountsIds && activeBankAccountsIds.length ? activeBankAccountsIds[0] : (this.statsDetailFilter.accountIds[0] || this.cashflowService.bankAccounts[0].id);
        let bankAccount = this.cashflowService.bankAccounts.filter((v) => v.id == accountId)[0];

        data.accountId = accountId;
        data.accountName = bankAccount.accountName;
        data.accountNumber = bankAccount.accountNumber;
    }

    onRowInserting(e) {
        this.detailsStartLoading();
        let data: CashFlowStatsDetailDto = e.data;
        if (data.debit && data.credit || !data.debit && !data.credit) {
            this.notify.error('Either debit or credit should be specified');
            e.cancel = true;
            this.detailsFinishLoading();
            return;
        }
        /** if data.forecastDate is Date - then convert it to the utc moment */
        let momentDate = data.forecastDate.format ? data.forecastDate : moment.tz(data.forecastDate.getFullYear() + '-' + (data.forecastDate.getMonth() + 1) + '-' +  data.forecastDate.getDate(), 'UTC');
        let startDate = this.statsDetailFilter.startDate;
        let endDate = this.statsDetailFilter.endDate;
        if (!momentDate.isBetween(this.statsDetailFilter.startDate, this.statsDetailFilter.endDate, null, '[]')) {
            startDate = moment(momentDate).toDate();
            endDate = moment(momentDate).add(1, 'days').subtract(1, 'seconds').toDate();
        }
        let category: CategoryDto = this.cashflowService.categoryTree.categories[data.categoryId];
        let forecastModel = new AddForecastInput({
            forecastModelId: this.cashflowService.selectedForecastModelId,
            bankAccountId: data.accountId,
            date: momentDate.toDate(),
            startDate: startDate,
            endDate: endDate,
            cashFlowTypeId: data.cashflowTypeId,
            categoryId: category && data.categoryId,
            transactionDescriptor: data.descriptor,
            currencyId: this._cfoPreferencesService.selectedCurrencyId,
            amount: data.debit ? -data.debit : data.credit,
            description: data.description
        });

        let deferred = $.Deferred();
        e.cancel = deferred.promise();

        this._cashFlowForecastServiceProxy.addForecast(
            InstanceType[this.instanceType],
            this.instanceId,
            forecastModel
        ).subscribe(
            res => {
                e.data.id = res;
                e.data.forecastId = res;
                let localForecastData = {
                    forecastId: res,
                    accountId: forecastModel.bankAccountId,
                    count: 1,
                    amount: forecastModel.amount,
                    date: moment(forecastModel.date).utc(),
                    initialDate: moment(forecastModel.date).utc().subtract((<Date>forecastModel.date).getTimezoneOffset(), 'minutes'),
                    cashflowTypeId: forecastModel.cashFlowTypeId,
                    categoryId: category && data.categoryId,
                    subCategoryId: this.statsDetailFilter.subCategoryId,
                    accountingTypeId: category && category.accountingTypeId,
                    transactionDescriptor: forecastModel.transactionDescriptor,
                    isStub: true
                };

                this.cashflowService.cashflowData.push(this.cashflowService.addCategorizationLevels(localForecastData));
                this.getCellOptionsFromCell.cache = {};
                this.pivotGrid.instance.getDataSource().reload()
                    .then(() => {
                        deferred.resolve(false);
                        this.notify.success(this.l('Forecasts_added'));
                        this.detailsFinishLoading();
                    });
            }, () => {
                deferred.resolve(true);
                e.component.cancelEditData();
                this.detailsFinishLoading();
            });
    }

    detailsStartLoading() {
        const gridElement = this.cashFlowGrid && this.cashFlowGrid.instance.element();
        if (gridElement) {
            super.startLoading(null, gridElement);
        }
    }

    detailsFinishLoading() {
        const gridElement = this.cashFlowGrid && this.cashFlowGrid.instance.element();
        if (gridElement) {
            super.finishLoading(null, gridElement);
        }
    }

    onDetailsRowUpdating(e) {
        this.detailsStartLoading();
        /** Send request for updating the row */
        let paramName = Object.keys(e.newData)[0];
        /** add minus sign for debit values */
        let paramValue = paramName === 'debit' ? -e.newData[paramName] : e.newData[paramName];
        if (e.newData[paramName] !== null) {
            let paramNameForUpdateInput = this.mapParamNameToUpdateParam(paramName);
            let apiMethod: Observable<void>;
            let oldData: CashFlowStatsDetailDto = e.oldData;
            let isHistoricalTransaction = !!oldData.date;
            if (isHistoricalTransaction) { //historical transaction edit
                if (paramName == 'descriptor') {
                    if (paramValue == '') paramValue = null;
                    const updateModel = new UpdateTransactionsCategoryInput({
                        transactionIds: [oldData.id],
                        categoryId: oldData.categoryId,
                        standardDescriptor: paramValue,
                        descriptorAttributeTypeId: null,
                        suppressCashflowMismatch: true
                    });

                    apiMethod = this._classificationServiceProxy.updateTransactionsCategory(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        updateModel
                    );
                } else {
                    e.component.cancelEditData();
                    this.detailsFinishLoading();
                    return;
                }
            } else {
                let data = new UpdateForecastInput();
                data.id = e.key.id;
                data[paramNameForUpdateInput] = paramValue;
                data.cashflowTypeId = oldData.cashflowTypeId;
                data.description = paramName == 'description' ? paramValue : oldData.description;
                data.transactionDescriptor = paramName == 'descriptor' ? paramValue : oldData.descriptor;

                if (data.date) {
                    let momentDate = moment(data.date);
                    this.addLocalTimezoneOffset(momentDate);
                    data.date = momentDate.toDate();
                }

                if (data.amount === 0) {
                    if (this.userPreferencesService.localPreferences.value.showCategoryTotals)
                        apiMethod = this._cashFlowForecastServiceProxy
                            .deleteForecast(
                                InstanceType[this.instanceType],
                                this.instanceId,
                                data.id
                            );
                    else {
                        this.detailsFinishLoading();
                        this.notify.error(this.l('EnableCategoryTotals'));
                        e.component.cancelEditData();
                        return e.cancel = true;
                    }

                } else {
                    /* Set forecast category */
                    let forecastData = this.cashflowService.cashflowData.find(x => {
                        return x.forecastId == e.key.id && (x.cashflowTypeId === Income || x.cashflowTypeId === Expense);
                    });
                    data.categoryId = forecastData.subCategoryId || forecastData.categoryId;
                    apiMethod = this._cashFlowForecastServiceProxy
                        .updateForecast(
                            InstanceType[this.instanceType],
                            this.instanceId,
                            data
                        );
                }
            }

            let deferred = $.Deferred();
            e.cancel = deferred.promise();
            apiMethod.subscribe(() => {
                /** Remove opposite cell */
                if (paramName === 'debit' || paramName === 'credit') {
                    let oppositeParamName = paramName === 'debit' ? 'credit' : 'debit';
                    if (e.oldData[oppositeParamName] !== null) {
                        let rowKey = this.cashFlowGrid.instance.getRowIndexByKey(e.key);
                        /** remove the value of opposite cell */
                        this.cashFlowGrid.instance.cellValue(rowKey, oppositeParamName, null);
                    }
                }

                let hideFromCashflow = paramNameForUpdateInput == 'accountId' && !underscore.contains(this.selectedBankAccountsIds, paramValue);
                if (isHistoricalTransaction) {
                    if (paramName == 'descriptor')
                        oldData.isDescriptorCalculated = !paramValue;

                    this.updateHistoricalStatsDescriptor(paramValue, oldData);
                } else
                    this.deleteStatsFromCashflow(paramNameForUpdateInput, paramValue, e.key.id, e.oldData[paramName], hideFromCashflow);

                this.getCellOptionsFromCell.cache = {};
                this.pivotGrid.instance.getDataSource().reload();
                deferred.resolve().done(() => {
                    if (paramNameForUpdateInput == 'amount' && paramValue == 0) {
                        this.statsDetailResult.every((v, index) => {
                            if (v == e.key) {
                                this.statsDetailResult.splice(index, 1);
                                return false;
                            }
                            return true;
                        });
                    }
                    this.detailsFinishLoading();
                });
            }, error => {
                deferred.resolve(true);
                this.detailsFinishLoading();
                e.component.cancelEditData();
            });
        } else {
            this.detailsFinishLoading();
        }
    }

    updateHistoricalStatsDescriptor(descriptor, oldData: CashFlowStatsDetailDto) {
        let targetStat: TransactionStatsDto;

        let targetDate = moment(oldData.date);
        this.addLocalTimezoneOffset(targetDate);
        let yearStart = targetDate.clone().startOf('year');

        let possibleCashflowDataItems: TransactionStatsDto[] = [];

        let amount = oldData.credit || -oldData.debit;
        for (let i = this.cashflowService.cashflowData.length - 1; i >= 0; i--) {
            let item: TransactionStatsDto = this.cashflowService.cashflowData[i];

            if (item.accountId == oldData.accountId &&
                item.cashflowTypeId == oldData.cashflowTypeId &&
                (item.subCategoryId || item.categoryId) == oldData.categoryId &&
                item.currencyId == oldData.currencyId &&
                item['initialDate'] >= yearStart && item['initialDate'] <= targetDate &&
                (item.transactionDescriptor == oldData.descriptor || !item.transactionDescriptor)) {
                if (item['initialDate'] == targetDate && item.transactionDescriptor == oldData.descriptor && item.amount == amount) {
                    targetStat = item;
                    break;
                } else {
                    possibleCashflowDataItems.push(item);
                }
            }
        }

        if (!targetStat && possibleCashflowDataItems.length) {
            possibleCashflowDataItems = underscore.chain(possibleCashflowDataItems)
                .sortBy(x => x.amount == amount)
                .sortBy(x => !!x.transactionDescriptor)
                .sortBy(x => x.initialDate).value();
            targetStat = possibleCashflowDataItems[possibleCashflowDataItems.length - 1];
        }

        if (targetStat) {
            if (targetStat.count == 1) {
                targetStat.transactionDescriptor = descriptor;
                this.cashflowService.updateTreePathes(targetStat, true);
                this.cashflowService.addCategorizationLevels(targetStat);
            } else {
                targetStat.count--;
                targetStat.amount -= amount;
                let newStat = { ...targetStat };
                newStat.count = 1;
                newStat.amount = amount;
                newStat.transactionDescriptor = descriptor;

                this.cashflowService.cashflowData.push(this.cashflowService.createStubTransaction(newStat));
            }
        }
    }

    deleteStatsFromCashflow(paramNameForUpdateInput, paramValue, key, oldDataDate, hideFromCashflow) {
        hideFromCashflow = hideFromCashflow || (paramNameForUpdateInput == 'amount' && paramValue == 0);

        let affectedTransactions: TransactionStatsDto[] = [];
        let sameDateTransactionExist = false;
        for (let i = this.cashflowService.cashflowData.length - 1; i >= 0; i--) {
            let item = this.cashflowService.cashflowData[i];

            if (item.forecastId == key) {
                if (hideFromCashflow) {
                    this.cashflowService.cashflowData.splice(i, 1);
                }
                affectedTransactions.push(item);
            } else if (paramNameForUpdateInput == 'date' && moment(oldDataDate).utc().isSame(item.date)) {
                sameDateTransactionExist = true;
            }
        }

        affectedTransactions.forEach(item => {
            if (!sameDateTransactionExist && (paramNameForUpdateInput == 'date' || hideFromCashflow)) {
                this.cashflowService.cashflowData.push(
                    this.cashflowService.createStubTransaction({
                        date: item.date,
                        initialDate: (<any>item).initialDate,
                        amount: 0,
                        cashflowTypeId: item.cashflowTypeId,
                        accountId: item.accountId
                    })
                );
                sameDateTransactionExist = true;
            }

            if (paramNameForUpdateInput == 'transactionDescriptor' || hideFromCashflow) {
                this.cashflowService.updateTreePathes(item, true);
            }

            if (paramNameForUpdateInput == 'date') {
                item[paramNameForUpdateInput] = moment(paramValue).utc();
                item['initialDate'] = moment(paramValue).utc().subtract((<Date>paramValue).getTimezoneOffset(), 'minutes');
            } else {
                item[paramNameForUpdateInput] = paramValue;
            }

            if (paramNameForUpdateInput == 'transactionDescriptor') {
                this.cashflowService.addCategorizationLevels(item);
            }
        });
    }

    mapParamNameToUpdateParam(paramName) {
        let detailsParamsToUpdateParams = {
            'forecastDate': 'date',
            'credit': 'amount',
            'debit': 'amount',
            'descriptor': 'transactionDescriptor',
            'description': 'description',
            'accountId': 'bankAccountId'
        };

        return detailsParamsToUpdateParams[paramName];
    }

    detailsDescriptorColumnWidth() {
        return window.innerWidth > 1920 ? '30%' : '20%';
    }

    detailsDescriptionColumnWidth() {
        const buttonsWidthWithCommentsTitle = 340;
        let commentsWidth = window.innerWidth * 0.23;
        return commentsWidth > buttonsWidthWithCommentsTitle ? window.innerWidth > 1600 ? '33%' : '23%' : buttonsWidthWithCommentsTitle;
    }

    setBankAccountsFilter(emitFilterChange = false) {
        this.bankAccountsService.setBankAccountsFilter(this.filters, this.syncAccounts, emitFilterChange);
        this.allowChangingForecast = this.bankAccountsService.state.statuses.indexOf(BankAccountStatus.Active) >= 0;
    }

    discardDiscrepancy(cellObj) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: this.l('DiscardDiscrepancy_WarningHeader'),
                message: this.l('DiscardDiscrepancy_WarningMessage')
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                const filterDetails = this.cashflowService.getDetailFilterFromCell(cellObj);
                const discardDiscrepanciesInput = DiscardDiscrepanciesInput.fromJS({
                    bankAccountIds: filterDetails.accountIds,
                    currencyId: filterDetails.currencyId,
                    startDate: filterDetails.startDate,
                    endDate: filterDetails.endDate
                });

                this._bankAccountsServiceProxy.discardDiscrepancies(InstanceType[this.instanceType], this.instanceId, discardDiscrepanciesInput)
                    .subscribe(() => { this.refreshDataGrid(); });
            }
            document.documentElement.scrollTop = 0;
        });
    }

    stateLoad = () => {
        let state = this._cacheService.get(this.stateStorageKey);
        if (state && String(state) !== 'undefined') {
            state = JSON.parse(state);
            if (state.headersAreCollapsed) {
                this.yearHeadersAreCollapsed = state.headersAreCollapsed.year;
                this.quarterHeadersAreCollapsed = state.headersAreCollapsed.quarter;
            }
        } else {
            /** Set default expanded columns */
            state = {};
            state.columnExpandedPaths = this.columnDefaultExpandedPaths;
            state.rowExpandedPaths = this.rowDefaultExpandedPaths;
            this.yearHeadersAreCollapsed = true;
            this.quarterHeadersAreCollapsed = true;
        }
        return state;
    }

    stateSave = state => {
        state.headersAreCollapsed = {'year': this.yearHeadersAreCollapsed, 'quarter': this.quarterHeadersAreCollapsed };
        this._cacheService.set(this.stateStorageKey, JSON.stringify(state));
    }

    @HostListener('window:click', ['$event']) toogleSearchInput(event) {
        if (!event.target.closest('#findInputBlock')) {
            const findInput = document.getElementById('findInputBlock');
            if (findInput) {
                findInput.style.display = 'none';
            }
        }
    }

    closeCalculator() {
        this.calculatorShowed = false;
        if (this.modifyingCellNumberBox) {
            this.modifyingCellNumberBox.focus();
        }
    }

    toggelCalculator(e) {
        if (this.calculatorShowed) {
            this.closeCalculator();
        } else {
            this.calculatorShowed = true;
            let val = this.modifyingCellNumberBox.option('value');
            this._calculatorService.valueChanged(val);
        }
    }

    onCalculatorValueChange(value) {
        this.modifyingCellNumberBox.option('value', value);
    }

    hideModifyingNumberBox() {
        if (this.modifyingNumberBoxCellObj) {
            this.saveForecast();
            this.closeCalculator();
        } else {
            if (this.modifyingCellNumberBox) {
                this.removeModifyingCellNumberBox();
            }
        }
    }

    onAmountCellEditStart(e) {
        if (this.detailsModifyingNumberBoxCellObj === e.key)
            return;
        else
            this.hideModifyingNumberBox();

        if (!(e.data && e.data.forecastId && ['debit', 'credit'].indexOf(e.column.dataField) !== -1)) {
            return;
        }

        let element = e.component.getCellElement(e.component.getRowIndexByKey(e.key), e.column.dataField);
        $(element).addClass('dx-editor-cell calculator-number-box');
        if (!element.querySelector('span'))
            $(element).wrapInner('<span></span>');
        $(element).children().hide();

        let wrapper = document.createElement('div');
        wrapper.onclick = function (ev) {
            ev.stopPropagation();
        };
        let wrapperButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };
        let wrapperSaveButton = document.createElement('div');
        wrapperButton.onclick = function (ev) {
            ev.stopPropagation();
        };
        this.modifyingCellNumberBox = new NumberBox(wrapper, {
            value: e.data[e.column.dataField],
            format: this._cfoPreferencesService.selectedCurrencySymbol + ' #,###.##',
            width: '86%',
            onEnterKey: this.updateForecastCell.bind(this, e),
            onKeyDown: function(e) {
                if ((e.event as any).keyCode === 37 || (e.event as any).keyCode === 39) {
                    e.event.stopPropagation();
                }
            }
        });
        this.functionButton = new Button(wrapperButton, {
            iconSrc: './assets/common/icons/fx.svg',
            onClick: this.toggelCalculator.bind(this, event),
            elementAttr: { 'class': 'function-button' }
        });

        this.saveButton = new Button(wrapperSaveButton, {
            iconSrc: './assets/common/icons/check.svg',
            onClick: this.updateForecastCell.bind(this, e),
            elementAttr: { 'class': 'save-forecast-button' }
        });
        element.appendChild(this.functionButton.element());
        element.appendChild(this.modifyingCellNumberBox.element());
        element.appendChild(this.saveButton.element());
        this.modifyingCellNumberBox.focus();
        element = null;

        this.detailsModifyingNumberBoxCellObj = e.key;
    }

    getBankAccountId(cell) {
        return this.cashflowService.bankAccounts.find(account => account.accountNumber === cell.data.accountNumber)['id'];
    }

    accountChanged(e, cell) {
        if (e.value !== e.previousValue) {

            let rowKey = this.cashFlowGrid.instance.getRowIndexByKey(cell.key);
            /** remove the value of opposite cell */
            this.cashFlowGrid.instance.cellValue(rowKey, 'accountId', e.value);

            let newAccountNumber = this.cashflowService.bankAccounts.find(account => account.id === e.value)['accountNumber'];
            cell.setValue(newAccountNumber);
        }
    }

    updateForecastCell(e) {
        let value = this.modifyingCellNumberBox.option('value');
        e.component.cellValue(e.rowIndex, e.columnIndex, value);
        if (!e.row.inserted) {
            e.component.saveEditData();
        } else {
            if (value) {
                let oppositColumnField = e.column.dataField == 'credit' ? 'debit' : 'credit';
                this.cashFlowGrid.instance.cellValue(e.row.rowIndex, oppositColumnField, null);
            }
        }
        this.hideModifyingNumberBox();
    }

    onTransactionDetailContentReady(e) {
        this.hideModifyingNumberBox();
        /** To update width of selection column */
        if (e.component.shouldSkipNextReady) {
            e.component.shouldSkipNextReady = false;
        } else {
            e.component.shouldSkipNextReady = true;
            e.component.columnOption('command:select', 'width', 28);
            e.component.updateDimensions();
        }

        if (this.changeTransactionGridEditMode && !e.element.getElementsByClassName('dx-row-inserted').length) {
            let dataGrid = e.component;
            dataGrid.beginUpdate();
            dataGrid.option('editing.mode', 'cell');
            dataGrid.columnOption('forecastDate', { allowEditing: false });
            dataGrid.columnOption('description', { allowEditing: false });
            dataGrid.columnOption('descriptor', { allowEditing: false });
            dataGrid.columnOption('debit', { allowEditing: false });
            dataGrid.columnOption('credit', { allowEditing: false });
            dataGrid.columnOption('accountNumber', { allowEditing: false });
            dataGrid.endUpdate();

            this.changeTransactionGridEditMode = false;
        }
    }

    onDetailsRowDelete(e) {
        let selectedRecords = this.cashFlowGrid.instance.getSelectedRowKeys();
        if (selectedRecords && selectedRecords.length) {
            selectedRecords.forEach((record, i) => {
                if (record.forecastId) {
                    abp.ui.setBusy();
                    if (record.forecastDate) {
                        let momentDate = moment(record.forecastDate);
                        this.addLocalTimezoneOffset(momentDate);
                        record.forecastDate = momentDate.toDate();
                    }

                    this._cashFlowForecastServiceProxy
                        .deleteForecast(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        record.forecastId
                    ).subscribe(res => {
                        this.deleteStatsFromCashflow('amount', 0, record.forecastId, record.forecastDate, false);
                        this.getCellOptionsFromCell.cache = {};
                        this.pivotGrid.instance.getDataSource().reload()
                            .then(() => { abp.ui.clearBusy(); });
                        this.statsDetailResult.every((v, index) => {
                            if (v.forecastId == record.forecastId) {
                                this.statsDetailResult.splice(index, 1);
                                return false;
                            }
                            return true;
                        });
                        this._statsDetailResult.next(this.statsDetailResult);
                    }, error => {
                        abp.ui.clearBusy();
                    });
                }
            });
        }
    }

    toggleGridOpacity() {
        if (this.pivotGrid) {
            let style = this.pivotGrid.instance.element().parentNode['style'];
            style.opacity = style.opacity == '0' ? 1 : 0;
        }
    }

    activate() {
        this.initToolbarConfig();
        this.setupFilters(this.filters);
        this.initFiltering();
        if (this.pivotGrid && this.pivotGrid.instance) {
            this.pivotGrid.instance.repaint();
            setTimeout(() => this.toggleGridOpacity());
        }
        this._lifecycleService.activate.next();

        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setBankAccountsFilter();
            this.loadGridDataSource();
            this.updateAfterActivation = false;
        }

        if (this.updateCashflowPositionsAfterActivation) {
            this.updateCashflowPositions();
            this.updateCashflowPositionsAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        this.toggleGridOpacity();
        this.dialog.closeAll();
        this.appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.rootComponent.overflowHidden();
    }

    getBankAccountName(bankAccount) {
        return (bankAccount.accountName || '(no name)') + ': ' + bankAccount.accountNumber;
    }

    changeDetailsTab(e) {
        this.detailsTab.next(e.addedItems[0].value);
    }

    deleteSelectedForecasts() {
        this.detailsStartLoading();
        /** get only forecasts, filter out forecasts and adjustments */
        const forecasts = this.cashFlowGrid.instance.getSelectedRowKeys().filter(item => item.forecastId);
        this.removeForecasts(forecasts)
            .pipe(finalize(() => this.detailsFinishLoading()))
            .subscribe(() => {
                /** Update stats details */
                this._statsDetailResult.next(difference(this.statsDetailResult, forecasts));
            });
    }

    onDetailsSelectionChanged(e) {
        this.detailsSomeHistoricalItemsSelected = e.selectedRowKeys.some(item => !!item.date);
        this.detailsSomeForecastsItemsSelected = e.selectedRowKeys.some(item => item.forecastId);
    }

    showTransactionDetailsInfo() {
        this.dialog.open(TransactionDetailInfoComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                transactionId$: of(this.transactionId)
            }
        });
    }

    private initCategoryToolbar() {
        this.categoryToolbarConfig = [
            {
                location: 'center', items: [
                    {
                        name: 'find',
                        action: (event) => {
                            event.event.stopPropagation();
                            event.event.preventDefault();
                            let toolbarElement = event.element.closest('.dx-area-description-cell');
                            if (!toolbarElement.querySelector('#findInputBlock')) {
                                let searchInputBlock = document.createElement('div');
                                searchInputBlock.id = 'findInputBlock';
                                searchInputBlock.innerHTML = '<div></div>';
                                new TextBox(searchInputBlock.children[0], {
                                    showClearButton: true,
                                    mode: 'search',
                                    onFocusOut: () => {
                                        searchInputBlock.style.display = 'none';
                                    },
                                    onInput: e => {
                                        clearTimeout(this.filterByChangeTimeout);
                                        this.filterByChangeTimeout = setTimeout(() => {
                                            this.cashflowService.cachedRowsFitsToFilter.clear();
                                            this.cashflowService.filterBy = e.element.querySelector('input').value;
                                            this.pivotGrid.instance.getDataSource().reload();
                                            this.pivotGrid.instance.updateDimensions();
                                        }, 300);
                                    }
                                });
                                toolbarElement.appendChild(searchInputBlock);
                            } else {
                                toolbarElement.querySelector('#findInputBlock').style.display = '';
                            }
                            toolbarElement.querySelector('input').focus();
                            toolbarElement = null;
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
                            items: this.expandLevels
                        }
                    },
                    {
                        name: 'follow',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Show'),
                            items: [
                                {
                                    type: 'header',
                                    text: this.l('Show'),
                                    action: (event) => {
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'showCashflowTypeTotals',
                                    checked: this.userPreferencesService.localPreferences.value.showCashflowTypeTotals,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowCashflowTypeTotals'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showCashflowTypeTotals: !this.userPreferencesService.localPreferences.value.showCashflowTypeTotals
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'showReportingSectionTotals',
                                    checked: this.userPreferencesService.localPreferences.value.showReportingSectionTotals,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowReportingSectionRow'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showReportingSectionTotals: !this.userPreferencesService.localPreferences.value.showReportingSectionTotals
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'showAccountingTypeTotals',
                                    checked: this.userPreferencesService.localPreferences.value.showAccountingTypeTotals,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowAccountingTypeRow'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showAccountingTypeTotals: !this.userPreferencesService.localPreferences.value.showAccountingTypeTotals
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'showCategoryTotals',
                                    checked: this.userPreferencesService.localPreferences.value.showCategoryTotals,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowCategoryTotals'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showCategoryTotals: !this.userPreferencesService.localPreferences.value.showCategoryTotals
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'option',
                                    name: 'showEmptyCategories',
                                    visible: this.userPreferencesService.localPreferences.value.showCategoryTotals,
                                    checked: this.userPreferencesService.localPreferences.value.showEmptyCategories,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowEmptyCategories'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showEmptyCategories: !this.userPreferencesService.localPreferences.value.showEmptyCategories
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                },
                                {
                                    type: 'delimiter'
                                },
                                {
                                    type: 'option',
                                    name: 'showSparklines',
                                    checked: this.userPreferencesService.localPreferences.value.showSparklines,
                                    text: this.l('CashFlowGrid_UserPrefs_ShowSparklines'),
                                    action: (event) => {
                                        this.userPreferencesService.updateLocalPreferences({
                                            showSparklines: !this.userPreferencesService.localPreferences.value.showSparklines
                                        });
                                        this.initCategoryToolbar();
                                        event.event.stopPropagation();
                                        event.event.preventDefault();
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }
}
