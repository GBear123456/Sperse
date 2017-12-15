import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { TransactionsServiceProxy, BankAccountDto } from '@shared/service-proxies/service-proxies';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';

import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import * as moment from 'moment';

@Component({
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.less'],
    animations: [appModuleAnimation()],
    providers: [TransactionsServiceProxy]
})
export class TransactionsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    private readonly dataSourceURI = 'Transaction';
    private filters: FilterModel[];
    private rootComponent: any;
    private toolbarConfig: any;

    public headlineConfig = {
        names: [this.l('Transactions')],
        icon: 'credit-card',
        buttons: []
    };

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    { name: 'filters', action: this._filtersService.toggle.bind(this._filtersService), attr: { 'filter-selected': this._filtersService.hasFilterSelected } }
                ]
            },
            {
                location: 'after', items: [
                    { name: 'refresh', action: this.refreshDataGrid.bind(this) },
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToXLS.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
                        }
                    },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            }
        ];
    }

    constructor(injector: Injector, private _TransactionsServiceProxy: TransactionsServiceProxy,
        private _filtersService: FiltersService) {
        super(injector);

        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };

        this.initToolbarConfig();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit(): void {
        this._TransactionsServiceProxy.getFiltersInitialData()
            .subscribe(result => {
                this._filtersService.setup(
                    this.filters = [
                        new FilterModel({
                            component: FilterCalendarComponent,
                            operator: { from: 'ge', to: 'le' },
                            caption: 'Date',
                            field: 'Date',
                            items: { from: new FilterItemModel(), to: new FilterItemModel() }
                        }),
                        new FilterModel({
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
                        }),
                        new FilterModel({
                            component: FilterInputsComponent,
                            operator: 'contains',
                            caption: 'Description',
                            items: { Description: new FilterItemModel() }
                        }),
                        new FilterModel({
                            component: FilterInputsComponent,
                            operator: { from: 'ge', to: 'le' },
                            caption: 'Amount',
                            field: 'Amount',
                            items: { from: new FilterItemModel(), to: new FilterItemModel() }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'CashFlowTypeId',
                            caption: 'CashflowType',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.cashflowTypes,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'CategoryId',
                            caption: 'TransactionCategory',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.categories,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'TypeId',
                            caption: 'TransactionType',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.types,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'CurrencyId',
                            caption: 'Currency',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.currencies,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterCheckBoxesComponent,
                            field: 'BusinessEntityId',
                            caption: 'BusinessEntity',
                            items: {
                                element: new FilterCheckBoxesModel({
                                    dataSource: result.businessEntities,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                            }
                        }),
                        new FilterModel({
                            component: FilterInputsComponent,
                            //operator: 'contains',
                            caption: 'CheckNumber',
                            //items: { BusinessEntity: '' }
                        }),
                        new FilterModel({
                            component: FilterInputsComponent,
                            //operator: 'contains',
                            caption: 'Reference',
                            //items: { BusinessEntity: '' }
                        })
                    ]
                );
            });

        this._filtersService.apply(() => {
            this.initToolbarConfig();
            this.processODataFilter(this.dataGrid.instance,
                this.dataSourceURI, this.filters, (filter) => {
                    let filterMethod = this['filterBy' +
                        this.capitalize(filter.caption)];
                    if (filterMethod)
                        return filterMethod.call(this, filter);
                }
            );
        });
    }

    filterByDate(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's');
                }

                data[filter.field][filter.operator[key]] = date.toDate();
            }
        });

        return data;
    }

    filterByAccount(filter) {
        let data = {};
        if (filter.items.element) {
            let filterData = [];
            if (filter.items.element.value) {
                filter.items.element.value.forEach((id) => {
                    let parts = id.split(':');
                    filterData.push(parts.length == 2 ? {
                        BankId: +parts[0],
                        BankAccountId: +parts[1]
                    } : { BankId: +id });
                });
            }

            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            item && item.value && (data[filter.field][filter.operator[key]] = +item.value);
        });
        return data;
    }

    filterByCashflowType(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByTransactionCategory(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByCurrency(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByTransactionType(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByBusinessEntity(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByFilterElement(filter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = _.map(filter.items.element.value, x => {
                let el = {};
                el[filter.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }

        return data;
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
