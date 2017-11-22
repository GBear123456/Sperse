import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    Inject,
    ViewEncapsulation,
    ViewChild
} from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '@shared/filters/filter.helpers';
import { FilterModel, FilterModelBase } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

import { FilterMultiselectDropDownComponent } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.component';
import { FilterMultiselectDropDownModel } from '@shared/filters/multiselect-dropdown/filter-multiselect-dropdown.model';

import { CommonLookupServiceProxy, OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { DxDataGridComponent } from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';

import * as _ from 'underscore';
import * as _string from 'underscore.string';
import * as moment from 'moment';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    animations: [appModuleAnimation()],
    providers: [OrderServiceProxy]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    showPipeline = true;
    firstRefresh = false;
    gridDataSource: any = {};
    private rootComponent: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;
    private readonly dataSourceURI = 'Order';
    private filters: FilterModel[];

    public headlineConfig = { 
      name: this.l('Orders'), 
      icon: 'briefcase', 
      buttons: [
        {
          enabled: true, 
          action: Function(),   
          lable: this.l('CreateNewOrder')
        }
      ]
    };

    toolbarConfig = [
      {location: 'before', items: [
        {name: 'back'}
      ]},
      {location: 'before', items: [
        {name: 'assign'}, {name: 'status'}, {name: 'delete'}
      ]},
      {location: 'after', items: [
        {name: 'refresh', action: this.refreshDataGrid.bind(this)},
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
            }, {type: 'downloadOptions'}]
          }
        },
        {name: 'columnChooser', action: this.showColumnChooser.bind(this)}
      ]},
      {location: 'after', items: [
        {name: 'box'},
        {name: 'pipeline', action: this.togglePipeline.bind(this, true)},
        {name: 'grid', action: this.togglePipeline.bind(this, false)}
      ]}
    ];

    constructor(injector: Injector,
        private _filtersService: FiltersService,
        private _orderService: OrderServiceProxy,
        // private _clientService: ClientServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy) {
        super(injector);

        this._filtersService.enabled = true;
        this._filtersService.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: 4,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                },
                paginate: true
            }
        };
    }

    onContentReady(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    togglePipeline(param) {
        this.showPipeline = param;
        if (!this.firstRefresh) {
            this.firstRefresh = true;
            abp.ui.setBusy(
                '',
                this.dataGrid.instance.refresh()
            );
        }
    }

    ngOnInit(): void {
        this._orderService.getFiltersInitialData().subscribe(result => {
            this._filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'creation',
                    field: 'CreationTime',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'orderStages',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: FilterHelpers.ConvertPipelinesToTreeSource(result.pipelines),
                                nameField: 'name',
                                parentExpr: 'parentId',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterMultiselectDropDownComponent,
                    field: 'BillingSubscriptionStatusId',
                    caption: 'BillingSubscriptionStatus',
                    items: {
                        cashflowType: new FilterMultiselectDropDownModel({
                            filterField: 'BillingSubscriptionStatusId',
                            displayElementExp: 'name',
                            dataSource: result.subscriptionStatuses,
                            columns: [{ dataField: 'name', caption: this.l('OrderFilters_BillingStatus') }],
                        })
                    }
                }),
                new FilterModel({
                    component: FilterDropDownComponent,
                    caption: 'paymentType',
                    items: {
                        paymentType: new FilterDropDownModel({
                            displayName: 'Payment Type',
                            elements: null,
                            filterField: 'paymentTypeId',
                            onElementSelect: (event, filter: FilterModelBase<FilterDropDownModel>) => {
                                filter.items["paymentType"].value = event.value;
                            }
                        })
                    }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'product',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'orderTotals',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'currencies',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'recurrence',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'regions',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'zipCode',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringAffiliates',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringWebsites',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmSources',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmMediums',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'UtmCampaings',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'entryPages',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'salesAgents',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'cardBins',
                    items: {}
                })
            ]);
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

    filterByOrderStages(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let filterData = FilterHelpers.ParsePipelineIds(filter.items.element.value);
            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByCreation(filter: FilterModel) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's')
                }

                data[filter.field][filter.operator[key]] = date.toDate();
            }
        });

        return data;
    }

    filterByBillingSubscriptionStatus(filter) {
        let data = {};
        data[filter.field] = [];
        _.each(filter.items, (item: FilterMultiselectDropDownModel, key) => {
            if (item && item.value && item.value.length) {
                let filterParams: any[] = [];
                _.each(item.value, (el: any) => {
                    if (typeof (el.id) === "string") {
                        filterParams.push("( " + filter.field + " eq '" + el.id + "' )");
                    }
                    else {
                        filterParams.push("( " + filter.field + " eq " + el.id + " )");
                    }
                });
                let filterQuery = '( ' + filterParams.join(' or ') + ' )';
                data = filterQuery;
            }
        });
        return data;
    }

    ngAfterViewInit(): void {
        this.gridDataSource = this.dataGrid.instance.getDataSource();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.enabled = false;
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
    }
}
