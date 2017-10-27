import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterDatesComponent } from '@shared/filters/dates/filter-dates.component';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import * as moment from "moment";

@Component({
    templateUrl: "./transactions.component.html",
    styleUrls: ["./transactions.component.less"],
    animations: [appModuleAnimation()]
})
export class TransactionsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    private readonly dataSourceURI = 'Transaction';
    private filters: FilterModel[];
    private rootComponent: any;

    constructor(injector: Injector,
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
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Account',
                    items: { BankAccountNumber: '' }
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
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'CashflowType',
                    //items: { CashflowType: '' }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'TransactionCategory',
                    //items: { TransactionCategory: '' }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'TransactionType',
                    //items: { TransactionType: '' }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'Currency',
                    //items: { Currency: '' }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    //operator: 'contains',
                    caption: 'BusinessEntity',
                    //items: { BusinessEntity: '' }
                }
            ]
        );

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
    
    filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (val, key) => {
            val && (data[filter.field][filter.operator[key]] = +val);
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
