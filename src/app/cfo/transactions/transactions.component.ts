import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { TransactionsServiceProxy, BankAccountDto } from '@shared/service-proxies/service-proxies';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterDatesComponent } from '@shared/filters/dates/filter-dates.component';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { DropDownElement } from '@shared/filters/dropdown/dropdown_element';

import { FilterMultiselectDropDownComponent } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.component';
import { MultiselectDropDownElement } from '@shared/filters/multiselect-dropdown/multiselect-dropdown-element';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import * as moment from "moment";

@Component({
    templateUrl: "./transactions.component.html",
    styleUrls: ["./transactions.component.less"],
    animations: [appModuleAnimation()],
    providers: [ TransactionsServiceProxy ]
})
export class TransactionsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    private readonly dataSourceURI = 'Transaction';
    private filters: FilterModel[];
    private rootComponent: any;

    constructor(injector: Injector, private _TransactionsServiceProxy: TransactionsServiceProxy,
        private _filtersService: FiltersService) {
        super(injector);

        this._filtersService.enabled = true;
        this._filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers["Authorization"] = 'Bearer ' + abp.auth.getToken();
                    request.headers["Abp.TenantId"] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };

        this.items = [{
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Refresh',
                icon: 'icon icon-refresh',
                onClick: this.refreshDataGrid.bind(this)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Export to Excel',
                iconSrc: 'assets/common/icons/download-icon.svg',
                onClick: this.exportData.bind(this)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Column chooser',
                icon: 'column-chooser',
                onClick: this.showColumnChooser.bind(this)
            }
        }];
    }

    exportData() {
        this.dataGrid.instance.exportToExcel(true);
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
                        <FilterModel>{
                            component: FilterDatesComponent,
                            operator: { from: "ge", to: "le" },
                            caption: 'Date',
                            field: 'Date',
                            items: { from: '', to: '' }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'BankAccountId',
                            caption: 'Account',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "Account",
                                    filterField: "BankAccountId",
                                    displayElementExp: (item: BankAccountDto) => {
                                        if (item) {
                                            return item.accountName + ' (' + item.accountNumber + ')'
                                        }
                                    },
                                    dataSource: result.bankAccounts,
                                    columns: [{ dataField: 'accountName', caption: this.l('CashflowAccountFilter_AccountName') }, { dataField: 'accountNumber', caption: this.l('CashflowAccountFilter_AccountNumber') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterInputsComponent,
                            operator: 'contains',
                            caption: 'Description',
                            items: { Description: '' }
                        },
                        <FilterModel>{
                            component: FilterInputsComponent,
                            operator: { from: "ge", to: "le" },
                            caption: 'Amount',
                            field: 'Amount',
                            items: { from: '', to: '' }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'CashFlowTypeId',
                            caption: 'CashflowType',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "",
                                    filterField: "CashFlowTypeId",
                                    displayElementExp: "name",
                                    dataSource: result.cashflowTypes,
                                    columns: [{ dataField: 'name', caption: this.l('TransactionCashflowTypeFilter_Name') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'CategoryId',
                            caption: 'TransactionCategory',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "",
                                    filterField: "CategoryId",
                                    displayElementExp: "name",
                                    dataSource: result.categories,
                                    columns: [{ dataField: 'name', caption: this.l('TransactionCategoryFilter_Name') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'TypeId',
                            caption: 'TransactionType',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "",
                                    filterField: "TypeId",
                                    displayElementExp: "name",
                                    dataSource: result.types,
                                    columns: [{ dataField: 'name', caption: this.l('TransactionTypeFilter_Name') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'CurrencyId',
                            caption: 'Currency',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "",
                                    filterField: "CurrencyId",
                                    displayElementExp: "name",
                                    dataSource: result.currencies,
                                    columns: [{ dataField: 'name', caption: this.l('TransactionCurrencyFilter_Name') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterMultiselectDropDownComponent,
                            field: 'BusinessEntityId',
                            caption: 'BusinessEntity',
                            items: {
                                acc: <MultiselectDropDownElement>{
                                    displayName: "",
                                    filterField: "BusinessEntityId",
                                    displayElementExp: "name",
                                    dataSource: result.businessEntities,
                                    columns: [{ dataField: 'name', caption: this.l('TransactionBusinessEntityFilter_Name') }],
                                }
                            }
                        },
                        <FilterModel>{
                            component: FilterInputsComponent,
                            //operator: 'contains',
                            caption: 'CheckNumber',
                            //items: { BusinessEntity: '' }
                        },
                        <FilterModel>{
                            component: FilterInputsComponent,
                            //operator: 'contains',
                            caption: 'Reference',
                            //items: { BusinessEntity: '' }
                        }
                    ]
                );
            });

        this._filtersService.apply(() => {
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
        _.each(filter.items, (val, key) => {
            if (val) {
                var date = moment.utc(val, 'YYYY-MM-DDT');
                if (key.toString() === "to")
                {
                    date.add(1, 'd').add(-1, 's')
                }

                data[filter.field][filter.operator[key]] = date.toDate();
            }
        });

        return data;
    }

    filterByAccount(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (val, key) => {
            val && (data[filter.field][filter.operator[key]] = +val);
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
        data[filter.field] = [];
        _.each(filter.items, (val: MultiselectDropDownElement, key) => {
            if (val && val.selectedElements && val.selectedElements.length > 0) {
                var filterParams: any[] = [];
                for (var i = 0; i < val.selectedElements.length; i++) {
                    if (typeof (val.selectedElements[i].id) === "string") {
                        filterParams.push("( " + filter.field + " eq '" + val.selectedElements[i].id + "' )");
                    }
                    else {
                        filterParams.push("( " + filter.field + " eq " + val.selectedElements[i].id + " )");
                    }
                }
                var filterQuery = filterParams.join(' or ');
                data = filterQuery;
            }
        });
        return data;
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent()
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this._filtersService.enabled = false;
        this.rootComponent.overflowHidden();
    }
}
