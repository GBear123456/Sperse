import { Component, Injector, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '@shared/filters/filter.helpers';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

import {
    StatsFilter,
    BankAccountDto,
    CashflowServiceProxy,
    BankAccountsServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    'selector': 'app-stats',
    'providers': [ CashflowServiceProxy, BankAccountsServiceProxy ],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    statsData: any;
    toolbarConfig = [
        {
            location: 'before',
            items: [
                { name: 'back' }
            ]
        },
        {
            location: 'before',
            items: [
                { name: 'scenario' }
            ]
        },
        {
            location: 'after',
            items: [
                { name: 'flag' },
                {
                    name: 'pen',
                    options: {
                        hint: this.l('Label')
                    }
                },
                { name: 'more' }
            ]
        },
        {
            location: 'after',
            items: [
                { name: 'download' },
                { name: 'print' }
            ]
        },
        {
            location: 'after',
            items: [
                {name: 'pen'}
            ]
        }
    ];
    headlineConfig: any;
    interval = 'date';
    verticalAxisDateFormat = 'day';
    currency = 'USD';
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _cashflowService: CashflowServiceProxy,
        private _bankAccountService: BankAccountsServiceProxy
    ) {
        super(injector);
        this._filtersService.enabled = true;
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.requestFilter = new StatsFilter();
        this.requestFilter.currencyId = 'USD';
        this._cashflowService.getCashFlowInitialData()
            .subscribe(result => {
                this._filtersService.setup(
                    this.filters = [
                        new FilterModel({
                            component: FilterCalendarComponent,
                            caption: 'Date',
                            items: { from: new FilterItemModel(), to: new FilterItemModel() }
                        }),
                        new FilterModel({
                            field: 'accountIds',
                            component: FilterCheckBoxesComponent,
                            caption: 'Account',
                            items: {
                                element: new FilterCheckBoxesModel(
                                    {
                                        dataSource: FilterHelpers.ConvertBanksToTreeSource(result.banks),
                                        nameField: 'name',
                                        parentExpr: 'parentId',
                                        keyExpr: 'id'
                                    })
                            }
                        })
                    ]
                );
            });

        this.headlineConfig = {
            name: this.l('Daily Cash Balances'),
            icon: '',
            buttons: [
                {
                    enabled: true,
                    action: Function(),
                    lable: this.l('Add New')
                }
            ]
        };

        this.statsData = this._bankAccountService.getBankAccountDailyStats(undefined, undefined, [])
            .subscribe(result => {
                let allDates = result.map(statsItem => statsItem.date.date());
                let middleDate = allDates[Math.round((allDates.length - 1) / 2)];
                this.statsData = result.map(statsItem => {
                    /** get the date and convert it to the day, month, quarter or year */
                    let newStatsItem: any = {
                        isForecast: null,
                        forecastIncome: null,
                        forecastExpenses: null,
                        forecastEndingBalance: null
                    };
                    /** @todo remove after getting the data from the server */
                    newStatsItem.isForecast = statsItem.date.date() > middleDate;
                    if (newStatsItem.isForecast) {
                        newStatsItem.forecastIncome = statsItem.income;
                        newStatsItem.forecastExpenses = statsItem.expenses;
                        newStatsItem.forecastEndingBalance = statsItem.endingBalance;
                        statsItem.income = null;
                        statsItem.expenses = null;
                    } else {
                        newStatsItem.forecastEndingBalance = statsItem.endingBalance + Math.floor(Math.random() * 21) - 10;
                    }
                    return Object.assign(newStatsItem, statsItem);
                });

                console.log(this.statsData);
            });

        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }
        });
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

    customizeVerticalAxisText(o) {
        console.log(o);
        return 'asdf';
    }
}
