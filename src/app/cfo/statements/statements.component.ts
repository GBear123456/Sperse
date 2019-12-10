/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import * as moment from 'moment';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
    catchError,
    finalize,
    filter,
    first,
    tap,
    startWith,
    switchMap,
    map,
    mapTo,
    takeUntil,
    publishReplay,
    refCount
} from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { AppService } from '@app/app.service';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { BankAccountFilterComponent } from '@shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from '@shared/filters/bank-account-filter/bank-account-filter.model';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    StatsFilter,
    BankAccountsServiceProxy,
    BankAccountDailyStatDto,
    GroupByPeriod,
    CashFlowForecastServiceProxy,
    InstanceType,
    ForecastModelDto
} from '@shared/service-proxies/service-proxies';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { CfoStore, ForecastModelsStoreActions, ForecastModelsStoreSelectors } from '@app/cfo/store';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { BankAccountsSelectDialogComponent } from '@app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    templateUrl: './statements.component.html',
    styleUrls: ['./statements.component.less'],
    providers: [ BankAccountsServiceProxy, CashFlowForecastServiceProxy, LifecycleSubjectsService ]
})
export class StatementsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(SynchProgressComponent) synchProgressComponent: SynchProgressComponent;

    private bankAccountCount = '';
    private filters: FilterModel[] = [];
    private syncAccounts: any;
    private defaultRequestFilter: StatsFilter =  new StatsFilter({
        currencyId: 'USD',
        startDate: moment().utc().subtract(2, 'year'),
        endDate: moment().utc().add(1, 'year')
    } as any);
    private requestFilter: Subject<StatsFilter> = new Subject<StatsFilter>();
    private requestFilter$: Observable<StatsFilter> = this.requestFilter.asObservable();
    public statementsData: BankAccountDailyStatDto[] = [];
    public currencyFormat = {
        type: 'currency',
        precision: 2
    };
    private updateAfterActivation = false;
    private forecastModels$ = this.cfoStore$.pipe(
        takeUntil(this.destroy$),
        select(ForecastModelsStoreSelectors.getForecastModels),
        filter(Boolean),
        map((forecastModels: ForecastModelDto[]) => {
            const historicalText = this.l('Periods_Historical');
            if (forecastModels[0].name !== historicalText) {
                const historicalItem: any = {
                    id: undefined,
                    name: historicalText,
                    text: historicalText
                };
                forecastModels = cloneDeep(forecastModels);
                forecastModels.unshift(historicalItem);
            }
            return forecastModels;
        }),
        publishReplay(),
        refCount()
    );
    private selectedForecastModelId: Subject<number> = new Subject<number>();
    selectedForecastModelId$: Observable<number> = this.selectedForecastModelId.asObservable();
    selectedCurrencyId$ = this.rootStore$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean));
    refresh: Subject<null> = new Subject<null>();
    private refresh$: Observable<null> = this.refresh.asObservable().pipe(startWith(null));
    private refreshToolbar: Subject<null> = new Subject<null>();
    private refreshToolbar$: Observable<null> = this.refreshToolbar.asObservable();
    private selectedBankAccountIds$: Observable<number[]> = this.bankAccountsService.selectedBankAccountsIds$;
    private dateFilter = new FilterModel({
        component: FilterCalendarComponent,
        caption: 'Date',
        items: {from: new FilterItemModel(), to: new FilterItemModel()},
        options: {
            allowFutureDates: true,
            endDate: moment(new Date()).add(10, 'years').toDate()
        }
    });

    constructor(
        private injector: Injector,
        private appService: AppService,
        private filtersService: FiltersService,
        private bankAccountService: BankAccountsServiceProxy,
        private cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private cfoPreferences: CfoPreferencesService,
        private dialog: MatDialog,
        private lifecycleService: LifecycleSubjectsService,
        private rootStore$: Store<RootStore.State>,
        private cfoStore$: Store<CfoStore.State>,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.bankAccountsService.load();
        this.cfoStore$.dispatch(new ForecastModelsStoreActions.LoadRequestAction());

        this.cfoPreferences.dateRange$.pipe(
            takeUntil(this.destroy$),
            switchMap((dateRange) => this.componentIsActivated ? of(dateRange) : this.lifecycleService.activate$.pipe(first(), mapTo(dateRange)))
        ).subscribe((dateRange: CalendarValuesModel) => {
            this.dateFilter.items = {
                from: new FilterItemModel(dateRange.from.value),
                to: new FilterItemModel(dateRange.to.value)
            };
            this.filtersService.change(this.dateFilter);
        });

        combineLatest(
            this.selectedForecastModelId$,
            this.selectedCurrencyId$,
            this.requestFilter$,
            this.refresh$
        ).pipe(
            takeUntil(this.destroy$),
            switchMap(data => this.componentIsActivated ? of(data) : this.lifecycleService.activate$.pipe(first(), mapTo(data))),
            tap(() => {
                this.isDataLoaded = false;
                abp.ui.setBusy();
            }),
            switchMap(([forecastModelId, currencyId, requestFilter]:
                              [number, string, StatsFilter]) => {
                return this.bankAccountService.getStats(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    currencyId,
                    forecastModelId,
                    requestFilter.accountIds,
                    requestFilter.startDate,
                    requestFilter.endDate || requestFilter.startDate,
                    GroupByPeriod.Monthly
                ).pipe(
                    catchError(() => of([])),
                    finalize(() => abp.ui.clearBusy())
                );
            })
        ).subscribe(
            (result: BankAccountDailyStatDto[]) => {
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
                } else {
                    this.statementsData = null;
                }
                this.isDataLoaded = true;
            },
            () => {
                this.isDataLoaded = true;
            }
        );

        combineLatest(
            this.forecastModels$,
            this.selectedForecastModelId$,
            this.refreshToolbar$
        ).pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated)
        ).subscribe(([forecastModels, selectedForecastModelId]) => {
            this.appService.updateToolbar([
                {
                    location: 'before',
                    items: [
                        {
                            name: 'filters',
                            visible: !this._cfoService.hasStaticInstance,
                            action: () => {
                                setTimeout(() => {
                                    this.dataGrid.instance.repaint();
                                }, 1000);
                                this.filtersService.fixed = !this.filtersService.fixed;
                            },
                            options: {
                                checkPressed: () => {
                                    return this.filtersService.fixed;
                                },
                                mouseover: () => {
                                    this.filtersService.enable();
                                },
                                mouseout: () => {
                                    if (!this.filtersService.fixed)
                                        this.filtersService.disable();
                                }
                            },
                            attr: {
                                'filter-selected': this.filtersService.hasFilterSelected
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
                                items: forecastModels,
                                selectedIndex: forecastModels.findIndex(model => model.id === selectedForecastModelId),
                                height: 39,
                                width: AppConsts.isMobile ? 150 : 243,
                                onSelectionChanged: (e) => {
                                    if (e) {
                                        if (e.itemData.id !== undefined) {
                                            this.cfoStore$.dispatch(new ForecastModelsStoreActions.ChangeForecastModelAction(e.itemData.id));
                                        } else {
                                            this.selectedForecastModelId.next(undefined);
                                        }
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
                            name: 'bankAccountSelect',
                            widget: 'dxButton',
                            action: this.openBankAccountsSelectDialog.bind(this),
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
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'showCompactRowsHeight',
                            visible: !this._cfoService.hasStaticInstance,
                            action: DataGridService.toggleCompactRowsHeight.bind(this, this.dataGrid)
                        },
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
                                    {type: 'downloadOptions'}
                                ]
                            }
                        },
                        {
                            name: 'columnChooser',
                            visible: !this._cfoService.hasStaticInstance,
                            action: DataGridService.showColumnChooser.bind(this, this.dataGrid)
                        }
                    ]
                }
            ]);
        });

        this.bankAccountsService.accountsAmountWithApply$.pipe(
            takeUntil(this.destroy$),
            switchMap((count: string) => this.componentIsActivated ? of(count) : this.lifecycleService.activate$.pipe(first(), mapTo(count)))
        ).subscribe((count: string) => {
            this.bankAccountCount = count;
            this.refreshToolbar.next();
        });

        this.cfoStore$.pipe(
            select(ForecastModelsStoreSelectors.getSelectedForecastModelId, { defaultId: undefined })
        ).subscribe(
            (selectedForecastModelId: number) => this.selectedForecastModelId.next(selectedForecastModelId)
        );

        this.bankAccountsService.syncAccounts$.pipe(first()).subscribe((syncAccounts) => {
            this.syncAccounts = syncAccounts;
            this.createFilters();
            this.filtersService.setup(this.filters);
            this.initFiltering();
            this.refreshToolbar.next();

            /** After selected accounts change */
            this.selectedBankAccountIds$.pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.componentIsActivated ? of(null) : this.lifecycleService.activate$.pipe(first()))
            ).subscribe(() => {
                this.setBankAccountsFilter(true);
            });
        });
    }

    ngAfterViewInit(): void {
        DataGridService.toggleCompactRowsHeight(this.dataGrid);
        let rootComponent = this.getRootComponent();
        rootComponent.overflowHidden(true);
    }

    reload() {
        if (!this._cfoService.hasStaticInstance) {
            this.invalidate();
        }
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint());
        this.filtersService.fixed = false;
        this.filtersService.disable();
    }

    invalidate() {
        this.refresh.next();
        this.bankAccountsService.load(true, false).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe();
    }

    updateCurrencySymbol = (data) => {
        return data.valueText.replace('$', this.cfoPreferences.selectedCurrencySymbol);
    }

    createFilters() {
        this.filters = [
            this.dateFilter,
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
                        })
                }
            })
        ];
    }

    initFiltering() {
        this.filtersService.apply(() => {
            let requestFilter = this.defaultRequestFilter;
            for (let filter of this.filters) {
                if (filter.caption.toLowerCase() === 'account')
                    this.bankAccountsService.applyFilter();

                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, requestFilter);
                else
                    requestFilter[filter.field] = undefined;
            }

            this.requestFilter.next(requestFilter);
            this.refreshToolbar.next();
        });
    }

    openBankAccountsSelectDialog() {
        this.dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
        }).componentInstance.onApply.subscribe(() => {
            this.setBankAccountsFilter(true);
        });
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

    setBankAccountsFilter(emitFilterChange = false) {
        this.bankAccountsService.setBankAccountsFilter(this.filters, this.syncAccounts, emitFilterChange);
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        this.refreshToolbar.next();
        this.filtersService.setup(this.filters);
        this.initFiltering();
        /** Load sync accounts (if something change - subscription in ngOnInit fires) */
        this.bankAccountsService.load();
        this.lifecycleService.activate.next();
        /** If selected accounts changed in another component - update widgets */
        if (this.updateAfterActivation) {
            this.setBankAccountsFilter(true);
            this.updateAfterActivation = false;
        }

        this.synchProgressComponent.activate();
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.dialog.closeAll();
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.synchProgressComponent.deactivate();
        this.getRootComponent().overflowHidden();
    }
}
