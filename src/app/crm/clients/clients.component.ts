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
import {ActivatedRoute, Router} from '@angular/router';
import {AppComponentBase} from '@shared/common/app-component-base';
import {CreateOrEditClientModalComponent} from './create-or-edit-client-modal.component';

import {FiltersService} from '@shared/filters/filters.service';
import {FilterModel} from '@shared/filters/filter.model';
import {FilterStatesComponent} from '@shared/filters/states/filter-states.component';
import {FilterInputsComponent} from '@shared/filters/inputs/filter-inputs.component';
import {FilterCBoxesComponent} from '@shared/filters/cboxes/filter-cboxes.component';
import {FilterDatesComponent} from '@shared/filters/dates/filter-dates.component';

import {CommonLookupServiceProxy} from '@shared/service-proxies/service-proxies';
import {appModuleAnimation} from '@shared/animations/routerTransition';

import {DxDataGridComponent} from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';

import * as moment from "moment";

@Component({
    templateUrl: "./clients.component.html",
    styleUrls: ["./clients.component.less"],
    animations: [appModuleAnimation()]
})
export class ClientsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild('createOrEditClientModal') createOrEditClientModal: CreateOrEditClientModalComponent;
    items: any;
    private readonly dataSourceURI = 'Customer';
    private filters: FilterModel[];
    private rootComponent: any;

    constructor(injector: Injector,
                private _router: Router,
                private _filtersService: FiltersService,
                private _activatedRoute: ActivatedRoute,
                private _commonLookupService: CommonLookupServiceProxy) {
        super(injector);

        this._filtersService.enabled = true;
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

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
            location: 'before',
            widget: 'dxButton',
            options: {
                hint: 'Back',
                iconSrc: 'assets/common/icons/back-arrow.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Assign',
                iconSrc: 'assets/common/icons/assign-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Status',
                iconSrc: 'assets/common/icons/status-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: 'Delete',
                iconSrc: 'assets/common/icons/delete-icon.svg',
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
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Box',
                iconSrc: 'assets/common/icons/box-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Pipeline',
                iconSrc: 'assets/common/icons/pipeline-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Grid',
                iconSrc: 'assets/common/icons/table-icon.svg',
                onClick: Function()
            }
        }];
    }

    exportData() {
        this.dataGrid.instance.exportToExcel(true);
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
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

    createClient() {
        this.createOrEditClientModal.show();
    }

    private mousePos: any;

    onMouseDown(event) {
        this.mousePos = {x: event.clientX, y: event.clientY};
    }

    showClientDetails(event) {
        if (this.mousePos.x == event.jQueryEvent.clientX
            && this.mousePos.y == event.jQueryEvent.clientY
        )
            this._router.navigate(['app/crm/client', event.data.Id]);
    }

    ngOnInit(): void {
        this._filtersService.setup(
            this.filters = [
                <FilterModel> {
                    component: FilterStatesComponent,
                    caption: 'states',
                    items: {
                        countryId: '',
                        stateId: ''
                    }
                },
                <FilterModel> {
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'name',
                    items: {name: ''}
                },
                <FilterModel> {
                    component: FilterCBoxesComponent,
                    caption: 'status',
                    field: 'StatusId',
                    items: {active: true, inactive: true}
                },
                <FilterModel> {
                    component: FilterDatesComponent,
                    operator: {from: "ge", to: "le"},
                    caption: 'creation',
                    field: 'CreationTime',
                    items: {from: '', to: ''}
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

    filterByStates(filter) {
        let filterData = {};
        _.mapObject(filter.items, (val, key) => {
            return val && (typeof(val) == 'string')
                && (filterData[this.capitalize(key)] = val);
        });

        if (Object.keys(filterData).length)
            return {
                Addresses: {
                    any: filterData
                }
            };
    }

    filterByCreation(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (val, key) => {
            val && (data[filter.field][filter.operator[key]] = val);
        });
        return data;
    }

    filterByStatus(filter) {
        if (!filter.items.active || !filter.items.inactive) {
            let obj = {};
            obj[filter.field] = filter.items.active ? 'A' : 'I';
            return obj;
        }
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent()
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._filtersService.unsubscribe();
        this._filtersService.enabled = false;
        this.rootComponent.overflowHidden();
    }
}
