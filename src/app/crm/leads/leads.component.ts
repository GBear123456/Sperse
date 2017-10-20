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
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { DropDownElement } from '@shared/filters/dropdown/dropdown_element';

import { CommonLookupServiceProxy, PipelineServiceProxy} from '@shared/service-proxies/service-proxies';
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
    items: any;
    private rootComponent: any;
    gridDataSource: any = {};
    collection: any;
    showPipeline = true;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    private readonly dataSourceURI = 'Lead';
    private filters: FilterModel[];

    constructor(injector: Injector,
                private _filtersService: FiltersService,
                // private _clientService: ClientServiceProxy,
                private _activatedRoute: ActivatedRoute,
                private _commonLookupService: CommonLookupServiceProxy,
                private _pipelineService: PipelineServiceProxy) {
        super(injector);

        this._filtersService.enabled = true;
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL('Lead'),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                },
                paginate: true
            }
        };

        this.items = [{
            location: 'before',
            widget: 'dxButton',
            options: {
                hint: 'Back',
                iconSrc: 'assets/common/images/icons/back-arrow.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Assign',
                iconSrc: 'assets/common/images/icons/assign-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Status',
                iconSrc: 'assets/common/images/icons/status-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Delete',
                iconSrc: 'assets/common/images/icons/delete-icon.svg',
                onClick: Function()
            }
        }, {
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
                iconSrc: 'assets/common/images/icons/download-icon.svg',
                onClick: this.exportData.bind(this)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Column chooser',
                iconSrc: 'assets/common/images/icons/clmn-chooser-icon.svg',
                onClick: this.showColumnChooser.bind(this)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Pipeline',
                iconSrc: 'assets/common/images/icons/pipeline-icon.svg',
                onClick: this.togglePipeline.bind(this, true)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Grid',
                iconSrc: 'assets/common/images/icons/table-icon.svg',
                onClick: this.togglePipeline.bind(this, false)
            }
        }];
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

    exportData() {
        this.dataGrid.instance.exportToExcel(true);
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    togglePipeline(param) {
        this.showPipeline = param;
    }

    ngOnInit(): void {
        this.filterTabs = [
            'all', 'active', 'archived'
        ];

        this._pipelineService.getPipelinesFullData("L").subscribe(result => {
            this._filtersService.setup(this.filters = [
                <FilterModel>{
                    component: FilterDropDownComponent,
                    caption: 'stages',
                    items: {
                        pipeline: <DropDownElement>{
                            displayName: "Pipeline",
                            elements: result,
                            filterField: "pipelineId",
                            onElementSelect: (event, filter: FilterDropDownComponent) => {
                                filter.items["pipeline"].selectedElement = event.value;
                                filter.items["stage"].elements = event.value.stages;
                                filter.items["stage"].selectedElement = null;
                            }
                        },
                        stage: <DropDownElement>{
                            displayName: "Stages",
                            filterField: "stageId",
                            onElementSelect: (event, filter: FilterDropDownComponent) => {
                                filter.items["stage"].selectedElement = event.value;
                            }
                        }
                    }
                }
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


    filterByStages(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (val: DropDownElement, key) => {
            val && val.filterField && val.selectedElement && (data[this.capitalize(val.filterField)] = val.selectedElement.id);
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
        this.rootComponent.overflowHidden();
    }
}
