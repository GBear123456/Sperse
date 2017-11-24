import { Component, Injector, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterMultiselectDropDownComponent } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.component';
import { FilterMultiselectDropDownModel } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.model';

import { StatsItem, StatsService } from './stats.service';
import { StatsFilter, BankAccountDto, CashflowServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    'selector': 'app-stats',
    'providers': [ StatsService, CashflowServiceProxy ],
    'templateUrl': './stats.component.html',
    'styleUrls': ['./stats.component.less']
})
export class StatsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    statsData: StatsItem[];
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
    private rootComponent: any;
    private filters: FilterModel[] = new Array<FilterModel>();
    private requestFilter: StatsFilter;
    constructor(
        injector: Injector,
        private _statsService: StatsService,
        private _filtersService: FiltersService,
        private _cashflowService: CashflowServiceProxy
    ) {
        super(injector);
        this.statsData = _statsService.getStatsData();
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
                            component: FilterMultiselectDropDownComponent,
                            field: 'accountIds',
                            caption: 'Account',
                            items: {
                                acc: new FilterMultiselectDropDownModel({
                                    displayName: 'Account',
                                    filterField: 'accountIds',
                                    displayElementExp: (item: BankAccountDto) => {
                                        if (item) {
                                            return item.accountName + ' (' + item.accountNumber + ')';
                                        }
                                    },
                                    dataSource: result.bankAccounts,
                                    columns: [
                                        {
                                            dataField: 'accountName',
                                            caption: this.l('CashflowAccountFilter_AccountName')
                                        },
                                        {
                                            dataField: 'accountNumber',
                                            caption: this.l('CashflowAccountFilter_AccountNumber')
                                        }
                                    ],
                                })
                            }
                        })
                    ]
                );
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
}
