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
import { CacheService } from 'ng2-cache-service';

import { MdButtonModule } from '@angular/material';

import {
    StatsFilter,
    BankAccountDto,
    CashflowServiceProxy,
    BankAccountsServiceProxy,
    GroupBy,
    CashFlowForecastServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    'selector': 'app-stats',
    'providers': [ CashflowServiceProxy, BankAccountsServiceProxy, CashFlowForecastServiceProxy, CacheService],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    statsData: any;
    toolbarConfig = <any>[
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
                {
                    name: 'slider',
                    widget: 'dxGallery',
                    options: {
                        hint: this.l('Scenario'),
                        accessKey: 'statsForecastSwitcher',
                        items: [],
                        showNavButtons: true,
                        showIndicator: false,
                        scrollByContent: true,
                        height: 39,
                        width: 200,
                        itemTemplate: itemData => {
                            return itemData.text;
                        },
                        onSelectionChanged: (e) => {
                            this.changeSelectedForecastModel(e);
                            this.loadStatsData();
                        }
                    }
                }
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
    updatedConfig = [];
    headlineConfig: any;
    interval = 'date';
    axisDateFormat = 'month';
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
    selectedForecastModel;
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _cashflowService: CashflowServiceProxy,
        private _bankAccountService: BankAccountsServiceProxy,
        private _cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);
        this._cacheService = this._cacheService.useStorage(0);
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

        this._cashFlowForecastServiceProxy.getModels().subscribe(
            result => {
                let newToolbar = this.toolbarConfig.slice();
                let sliderObj = newToolbar.filter(toolbarItem => toolbarItem.items[0].name === 'slider')[0];
                sliderObj.items[0].options.items = result.map(forecastModelItem => {
                    return {
                        id: forecastModelItem.id,
                        text: forecastModelItem.name
                    };
                });

                /** If we have the forecast model in cache - get it there, else - get the first model */
                let cachedForecastModel = this.getForecastModel();
                /** If we have cached forecast model and cached forecast exists in items list - then use it **/
                this.selectedForecastModel = cachedForecastModel && sliderObj.items[0].options.items.findIndex(
                        item => item.id === cachedForecastModel.id
                    ) !== -1 ?
                    cachedForecastModel :
                    sliderObj.items[0].options.items[0];
                sliderObj.items[0].options.selectedIndex = sliderObj.items[0].options.items.findIndex(
                    item => item.id === this.selectedForecastModel.id
                );
                this.updatedConfig = newToolbar;
                this.loadStatsData();
            }
        );

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

        for (let filter of this.filters) {
                let filterMethod = FilterHelpers['filterBy' + this.capitalize(filter.caption)];

            if (filterMethod)
                filterMethod(filter, this.requestFilter);
            else
                this.requestFilter[filter.field] = undefined;
        }
        this._filtersService.apply(() => {
            this.loadStatsData();
        });
    }

    /**
     * Get forecast model from the cache
     */
    getForecastModel() {
        return this._cacheService.exists(`stats_forecastModel_${abp.session.userId}`) ?
               this._cacheService.get(`stats_forecastModel_${abp.session.userId}`) :
               null;
    }

    /**
     * Change the forecast model to reuse later
     * @param modelObj - new forecast model
     */
    changeSelectedForecastModel(modelObj) {
        this.selectedForecastModel = modelObj.addedItems[0];
        this._cacheService.set(`stats_forecastModel_${abp.session.userId}`, this.selectedForecastModel);
    }

    /** load stats data from api */
    loadStatsData() {
        let {startDate = undefined, endDate = undefined, accountIds = []} = this.requestFilter;
        this.statsData = this._bankAccountService.getBankAccountDailyStats(
            'USD', this.selectedForecastModel.id, accountIds, startDate, endDate, GroupBy.Monthly
        ).subscribe(result => {
                    if (result) {
                        this.statsData = result;
                        this.maxLabelCount = this.calcMaxLabelCount(this.labelWidth);
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

    customizeBottomAxis(elem) {
        return elem.valueText.substring(0, 3).toUpperCase();
    }
}
