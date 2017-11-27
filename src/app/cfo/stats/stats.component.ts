import { Component, Injector, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

import { MdButtonModule } from '@angular/material';

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
                {
                    name: 'filters',
                    action: this._filtersService.toggle.bind(this._filtersService)
                }
            ]
        },
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
    labelPositiveBackgroundColor = '#626b73';
    historicalEndingBalanceColor = '#01b0f0';
    forecastEndingBalanceColor = '#f9bb4d';
    historicalIncomeColor = '#01b0f0';
    historicalExpensesColor = '#e72f6a';
    forecastIncomeColor = '#f9bb4d';
    forecastExpensesColor = '#f15a25';
    maxLabelCount = 0;
    labelWidth = 45;
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

        this.loadStatsData();

        this._filtersService.apply(() => {
            for (let filter of this.filters) {
                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];

                if (filterMethod)
                    filterMethod(filter, this.requestFilter);
                else
                    this.requestFilter[filter.field] = undefined;
            }

            this.loadStatsData();
        });
    }

    /** load stats data from api */
    loadStatsData() {
        let {startDate = undefined, endDate = undefined, accountIds = []} = this.requestFilter;
        this.statsData = this._bankAccountService.getBankAccountDailyStats(startDate, endDate, accountIds)
            .subscribe(result => {
                    if (result) {
                        this.statsData = result;
                        this.maxLabelCount = this.calcMaxLabelCount(this.labelWidth);
                        console.log(this.statsData);
                    } else {
                        console.log('No daily stats');
                    }
                },
                error => console.log('Error: ' + error)
            );
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

    /** Calculates the max amount of the labels for displaying to not clutter the screen */
    calcMaxLabelCount(labelWidth) {
        let screnWidth = window.innerWidth;
        return Math.floor(screnWidth / labelWidth);
    }

    showSourceData() {
        console.log('show source data');
    }
}
