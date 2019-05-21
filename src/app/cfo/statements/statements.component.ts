/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { CacheService } from 'ng2-cache-service';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { finalize, first, switchMap } from 'rxjs/operators';
import * as _ from 'underscore';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { AppService } from '@app/app.service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountsSelectComponent } from '@app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import {
    StatsFilter,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupBy,
    CashFlowForecastServiceProxy,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CurrenciesStoreActions, CurrenciesStoreSelectors, CfoStore } from '@app/cfo/store';
import { filter } from '@node_modules/rxjs/operators';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    templateUrl: './statements.component.html',
    styleUrls: ['./statements.component.less'],
    providers: [ BankAccountsServiceProxy, CashFlowForecastServiceProxy ]
})
export class StatementsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(ReportPeriodComponent) reportPeriodSelector: ReportPeriodComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    public headlineConfig;
    private bankAccountCount = '';
    visibleAccountCount = 0;
    private forecastModelsObj: { items: Array<any>, selectedItemIndex: number } = { items: [{ text: this.l('Periods_Historical') }], selectedItemIndex: 0 };
    private filters: FilterModel[] = new Array<FilterModel>();
    public sliderReportPeriod = {
        start: null,
        end: null,
        minDate: moment().utc().subtract(10, 'year').year(),
        maxDate: moment().utc().add(10, 'year').year()
    };

    private syncAccounts: any;
    private requestFilter: StatsFilter;
    public statementsData: BankAccountDailyStatDto[] = [];

    public currencyFormat = {
        type: 'currency',
        precision: 2
    };
    private updateAfterActivation: boolean;

    constructor(
        private injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService,
        private _cfoPreferences: CfoPreferencesService,
        private bankAccountsService: BankAccountsService,
        private store$: Store<CfoStore.State>
    ) {
        super(injector);
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';
        this.requestFilter.startDate = moment().utc().subtract(2, 'year');
        this.requestFilter.endDate = moment().utc().add(1, 'year');
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Statements')],
            onRefresh: () => {
                this.refreshData();
                this.bankAccountsService.load().pipe(
                    finalize(() => abp.ui.clearBusy())
                ).subscribe();
            },
            iconSrc: './assets/common/icons/credit-card-icon.svg'
        };
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this._cfoPreferences.getCurrenciesAndSelectedIndex()
                .subscribe(([currencies, selectedCurrencyIndex]) => {
                    this._appService.updateToolbar([
                        {
                            location: 'before',
                            items: [
                                {
                                    name: 'filters',
                                    action: (event) => {
                                        setTimeout(() => {
                                            this.dataGrid.instance.repaint();
                                        }, 1000);
                                        this._filtersService.fixed = !this._filtersService.fixed;
                                    },
                                    options: {
                                        checkPressed: () => {
                                            return this._filtersService.fixed;
                                        },
                                        mouseover: (event) => {
                                            this._filtersService.enable();
                                        },
                                        mouseout: (event) => {
                                            if (!this._filtersService.fixed)
                                                this._filtersService.disable();
                                        }
                                    },
                                    attr: {
                                        'filter-selected': this._filtersService.hasFilterSelected
                                    }
                                }
                            ]
                        },
                        {
                            location: 'before',
                            items: [
                                {
                                    name: 'select-box',
                                    text: '',
                                    widget: 'dxDropDownMenu',
                                    options: {
                                        hint: this.l('Scenario'),
                                        accessKey: 'statsForecastSwitcher',
                                        items: this.forecastModelsObj.items,
                                        selectedIndex: this.forecastModelsObj.selectedItemIndex,
                                        height: 39,
                                        width: 243,
                                        onSelectionChanged: (e) => {
                                            if (e) {
                                                this.forecastModelsObj.selectedItemIndex = e.itemIndex;
                                                this.refreshData();
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            location: 'before',
                            locateInMenu: 'auto',
                            items: [
                                {
                                    name: 'reportPeriod',
                                    action: this.toggleReportPeriodFilter.bind(this),
                                    options: {
                                        id: 'reportPeriod',
                                        icon: './assets/common/icons/report-period.svg'
                                    }
                                },
                                {
                                    name: 'bankAccountSelect',
                                    widget: 'dxButton',
                                    action: this.toggleBankAccountTooltip.bind(this),
                                    options: {
                                        id: 'bankAccountSelect',
                                        text: this.l('Accounts'),
                                        icon: './assets/common/icons/accounts.svg'
                                    },
                                    attr: {
                                        'custaccesskey': 'bankAccountSelect',
                                        'accountCount': this.bankAccountCount
                                    }
                                }
                            ]
                        },
                        {
                            location: 'before',
                            locateInMenu: 'auto',
                            items: [
                                {
                                    name: 'select-box',
                                    text: this._cfoPreferences.selectedCurrencySymbol + ' ' + this._cfoPreferences.selectedCurrencyId,
                                    widget: 'dxDropDownMenu',
                                    accessKey: 'currencySwitcher',
                                    options: {
                                        hint: this.l('Currency'),
                                        accessKey: 'currencySwitcher',
                                        items: currencies,
                                        selectedIndex: selectedCurrencyIndex,
                                        height: 39,
                                        onSelectionChanged: (e) => {
                                            if (e) {
                                                this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(e.itemData.id));
                                                this.refreshData();
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            location: 'after',
                            locateInMenu: 'auto',
                            items: [
                                { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                                {
                                    name: 'download',
                                    widget: 'dxDropDownMenu',
                                    options: {
                                        hint: this.l('Download'),
                                        items: [
                                            {
                                                action: Function(),
                                                text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'PDF'),
                                                icon: 'pdf',
                                            }, {
                                                action: this.exportToXLS.bind(this),
                                                text: this.l('Export to Excel'),
                                                icon: 'xls',
                                            }, {
                                                action: this.exportToGoogleSheet.bind(this),
                                                text: this.l('Export to Google Sheets'),
                                                icon: 'sheet'
                                            },
                                            { type: 'downloadOptions' }
                                        ]
                                    }
                                },
                                { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                            ]
                        }
                    ]);
                });
        }
    }

    ngOnInit(): void {
        this.bankAccountsService.load();
        let forecastsModels$ = this._cashFlowForecastServiceProxy.getModels(InstanceType[this.instanceType], this.instanceId);
        let syncAccounts$ = this.bankAccountsService.syncAccounts$.pipe(first());
        this.bankAccountsService.accountsAmount$.subscribe(amount => {
            this.bankAccountCount = amount;
            this.initToolbarConfig();
        });

        /** If component is not activated - wait until it will activate and then reload */
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            filter(() => !this.componentIsActivated)
        ).subscribe(() => {
            this.updateAfterActivation = true;
        });

        forkJoin(forecastsModels$, syncAccounts$).subscribe(([forecastsModels, syncAccounts]) => {
            this.syncAccounts = syncAccounts;
            this.handleForecastModelResult(forecastsModels);
            this.createFilters(syncAccounts);
            this._filtersService.setup(this.filters);
            this.initFiltering();
            this.initToolbarConfig();

            /** After selected accounts change */
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
    }
    
    updateCurrencySymbol = (data) => {
        return data.valueText.replace('$', this._cfoPreferences.selectedCurrencySymbol);
    }

    createFilters(syncAccounts) {
        this.filters = [
            new FilterModel({
                component: FilterCalendarComponent,
                caption: 'Date',
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: {
                    allowFutureDates: true,
                    endDate: moment(new Date()).add(10, 'years').toDate()
                }
            }),
            new FilterModel({
                field: 'accountIds',
                component: BankAccountFilterComponent,
                caption: 'Account',
                items: {
                    element: new BankAccountFilterModel(
                        {
                            dataSource: syncAccounts,
                            nameField: 'name',
                            keyExpr: 'id',
                            onRemoved: (ids) => this.bankAccountsService.changeSelectedBankAccountsIds(ids)
                        })
                }
            })
        ];
    }

    handleForecastModelResult(result) {
        let items = [{ id: undefined, text: this.l('Periods_Historical') }];
        result.forEach(forecastModelItem => {
            items.push({
                id: forecastModelItem.id,
                text: forecastModelItem.name
            });
        });

        this.forecastModelsObj = {
            items: items,
            selectedItemIndex: 0
        };
    }

    ngAfterViewInit(): void {
        this.showCompactRowsHeight();

        let rootComponent = this.getRootComponent();
        rootComponent.overflowHidden(true);
    }

    public refreshData(): void {
        abp.ui.setBusy();
        this._cfoPreferences.getCurrencyId().pipe(
            switchMap((currencyId: string) => this._bankAccountService.getStats(
                InstanceType[this.instanceType],
                this.instanceId,
                currencyId,
                this.forecastModelsObj.items[this.forecastModelsObj.selectedItemIndex].id,
                this.requestFilter.accountIds,
                this.requestFilter.startDate,
                this.requestFilter.endDate,
                GroupBy.Monthly
            )),
            finalize(() => abp.ui.clearBusy())
        ).subscribe(result => {
            if (result && result.length) {
                let currentPeriodTransaction: BankAccountDailyStatDto;
                let currentPeriodForecast: BankAccountDailyStatDto;

                for (let i = result.length - 1; i >= 0; i--) {
                    let statsItem: BankAccountDailyStatDto = result[i];

                    Object.defineProperties(statsItem, {
                        'netChange': { value: statsItem.credit + statsItem.debit, enumerable: true },
                    });

                    if (!currentPeriodTransaction && !statsItem.isForecast) {
                        currentPeriodForecast = result[i + 1];
                        currentPeriodTransaction = statsItem;

                        if (currentPeriodForecast) {
                            let clone = Object.assign({}, currentPeriodTransaction);
                            clone.credit += currentPeriodForecast.credit;
                            clone.creditCount += currentPeriodForecast.creditCount;
                            clone.debit += currentPeriodForecast.debit;
                            clone.debitCount += currentPeriodForecast.debitCount;
                            clone['netChange'] = clone.credit + clone.debit;
                            clone.averageDailyBalance = (clone.averageDailyBalance + currentPeriodForecast.averageDailyBalance) / 2;
                            clone.endingBalance = currentPeriodForecast.endingBalance;

                            currentPeriodTransaction['itemType'] = 'MTD';
                            currentPeriodForecast['itemType'] = 'Forecast';
                            clone['sourceData'] = [currentPeriodTransaction, currentPeriodForecast];
                            result.splice(i, 2, clone);
                        }
                    }
                }

                this.statementsData = result;

                /** reinit */
                this.initHeadlineConfig();

                this.setSliderReportPeriodFilterData(this.statementsData[0].date.year(), this.statementsData[this.statementsData.length - 1].date.year());
            } else {
                this.statementsData = null;
            }
        });
    }

    initFiltering() {
        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                if (filter.caption.toLowerCase() === 'date') {
                    if (filter.items.from.value)
                        this.sliderReportPeriod.start = filter.items.from.value.getFullYear();
                    else
                        this.sliderReportPeriod.start = this.sliderReportPeriod.minDate;

                    if (filter.items.to.value)
                        this.sliderReportPeriod.end = filter.items.to.value.getFullYear();
                    else
                        this.sliderReportPeriod.end = this.sliderReportPeriod.maxDate;
                }
                if (filter.caption.toLowerCase() === 'account') {
                    /** apply filter on top */
                    this.bankAccountsService.applyFilter();
                    /** apply filter in sidebar */
                    filter.items.element.setValue(this.bankAccountsService.state.selectedBankAccountIds, filter);
                }

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }

            this.refreshData();
            this.initToolbarConfig();
        });
    }

    toggleBankAccountTooltip() {
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    toggleReportPeriodFilter() {
        this.reportPeriodSelector.toggleReportPeriodFilter();
    }

    onRowPrepared(e) {
        if (e.rowType == 'data') {
            if (e.data.date.isSame(moment(), 'month'))
                e.rowElement.classList.add('current-row');
            else if (e.data.isForecast)
                e.rowElement.classList.add('forecast-row');
            else
                e.rowElement.classList.add('historical-row');
        }
    }

    expandColapseRow(e) {
        if (!e.data.sourceData) return;

        if (e.isExpanded) {
            e.component.collapseRow(e.key);
        } else {
            e.component.expandRow(e.key);
        }
    }

    setSliderReportPeriodFilterData(start, end) {
        let dateFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });
        if (dateFilter) {
            if (!dateFilter.items['from'].value)
                this.sliderReportPeriod.start = start;
            if (!dateFilter.items['to'].value)
                this.sliderReportPeriod.end = end;
        }
    }

    setReportPeriodFilter(period) {
        let dateFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'date'; });

        if (period.start) {
            let from = new Date(period.start + '-01-01');
            DateHelper.addTimezoneOffset(from);
            dateFilter.items['from'].setValue(from, dateFilter);
        } else {
            dateFilter.items['from'].setValue('', dateFilter);
        }

        if (period.end) {
            let end = new Date(period.end + '-12-31');
            DateHelper.addTimezoneOffset(end);
            dateFilter.items['to'].setValue(end, dateFilter);
        } else {
            dateFilter.items['to'].setValue('', dateFilter);
        }
        this._filtersService.change(dateFilter);
    }

    setBankAccountsFilter(emitFilterChange = false) {
        this.bankAccountsService.setBankAccountsFilter(this.filters, this.syncAccounts, emitFilterChange);
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        this.initToolbarConfig();
        this._filtersService.setup(this.filters);
        this.initFiltering();

        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();

        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setBankAccountsFilter(true);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.getRootComponent().overflowHidden();
    }
}
