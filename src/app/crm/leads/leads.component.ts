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
import {AppConsts} from '@shared/AppConsts';
import {ActivatedRoute} from '@angular/router';
import {AppComponentBase} from '@shared/common/app-component-base';

import {FiltersService} from '@shared/filters/filters.service';
import {FilterModel} from '@shared/filters/filter.model';
import {FilterDropDownComponent} from '@shared/filters/dropdown/filter-dropdown.component';
import {FilterInputsComponent} from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';

import {CommonLookupServiceProxy, PipelineServiceProxy} from '@shared/service-proxies/service-proxies';
import {appModuleAnimation} from '@shared/animations/routerTransition';

import {DxDataGridComponent} from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';

import * as _ from 'underscore';
import * as moment from 'moment';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.less'],
    animations: [appModuleAnimation()]
})
export class LeadsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    firstRefresh: boolean = false;
    private rootComponent: any;
    gridDataSource: any = {};
    collection: any;
    showPipeline = true;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    private readonly dataSourceURI = 'Lead';
    private filters: FilterModel[];

    toolbarConfig = [
      {location: 'before', items: [
        {name: 'back'}
      ]},
      {location: 'before', items: [
        {name: 'assign'}, {name: 'status'}, {name: 'delete'}
      ]},
      {location: 'after', items: [
        {name: 'refresh', action: this.refreshDataGrid.bind(this)}, 
        {name: 'download', options: {hint: this.l('Export to XLS')}, action: this.exportToXLS.bind(this)}, 
        {name: 'download', options: {hint: this.l('Export to CSV')}, action: this.exportToCSV.bind(this)}, 
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
                // private _clientService: ClientServiceProxy,
                private _activatedRoute: ActivatedRoute,
                private _commonLookupService: CommonLookupServiceProxy,
                private _pipelineService: PipelineServiceProxy) {
        super(injector);

        this._filtersService.enabled = true;
        this._filtersService.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
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
        this._pipelineService.getPipelinesFullData("L").subscribe(result => {
            this._filtersService.setup(this.filters = [
                <FilterModel>{
                    component: FilterDropDownComponent,
                    caption: 'stages',
                    items: {
                        pipeline: new FilterDropDownModel({
                            displayName: "Pipeline",
                            elements: result,
                            displayElementExp: "name",
                            filterField: "pipelineId",
                            onElementSelect: (value, filter: FilterDropDownComponent) => {
                                filter.items["pipeline"].selectedElement = value;
                                filter.items["stage"].elements = value.stages;
                                filter.items["stage"].selectedElement = null;
                            },
                            clearSelectedElement: (filter: FilterDropDownComponent) => {
                                filter.items["pipeline"].selectedElement = null;
                                filter.items["stage"].elements = null;
                                filter.items["stage"].selectedElement = null;
                            }
                        }),
                        stage: new FilterDropDownModel({
                            displayName: "Stages",
                            displayElementExp: "name",
                            filterField: "stageId",
                            onElementSelect: (value, filter: FilterDropDownComponent) => {
                                filter.items["stage"].selectedElement = value;
                            }
                        })
                    }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'SourceCode',
                    items: { SourceCode: '' }
                },
                <FilterModel>{
                    component: FilterCalendarComponent,
                    operator: { from: "ge", to: "le" },
                    caption: 'creation',
                    field: 'CreationTime',
                    items: { from: '', to: '' }
                },
                <FilterModel>{
                    component: FilterCalendarComponent,
                    operator: { from: "ge", to: "le" },
                    caption: 'updating',
                    field: 'UpdatingTime',
                    items: { from: '', to: '' }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'product',
                    items: { product: '' }
                },
                <FilterModel>{
                    component: FilterDropDownComponent,
                    caption: 'paymentType',
                    items: {
                        paymentType: <FilterDropDownModel>{
                            displayName: "Payment Type",
                            elements: null,
                            filterField: "paymentTypeId",
                            onElementSelect: (event, filter: FilterDropDownComponent) => {
                                filter.items["paymentType"].selectedElement = event.value;
                            }
                        }
                    }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'priceRange',
                    items: { }
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'currencies',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'regions',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringAffiliates',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringWebsites',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmSources',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmMediums',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'UtmCampaings',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'entryPages',
                    items: {}
                },
                <FilterModel>{
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'salesAgents',
                    items: {}
                }
            ], this._activatedRoute.snapshot.queryParams);
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


    filterByStages(filter: FilterModel) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (val: FilterDropDownModel, key) => {
            val && val.filterField && val.selectedElement && (data[this.capitalize(val.filterField)] = val.selectedElement.id);
        });
        return data;
    }

    filterByCreation(filter: FilterModel) {
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

    ngAfterViewInit(): void {
        this.gridDataSource = this.dataGrid.instance.getDataSource();
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
