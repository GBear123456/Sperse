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
import { FilterModel } from '@shared/filters/filter.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterDatesComponent } from '@shared/filters/dates/filter-dates.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { DropDownElement } from '@shared/filters/dropdown/dropdown_element';

import {CommonLookupServiceProxy} from '@shared/service-proxies/service-proxies';
import {appModuleAnimation} from '@shared/animations/routerTransition';

import {DxDataGridComponent} from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';

import * as moment from "moment";

@Component({
    templateUrl: "./orders.component.html",
    styleUrls: ["./orders.component.less"],
    animations: [appModuleAnimation()]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    showPipeline = true;
    firstRefresh: boolean = false;
    gridDataSource: any = {};
    private rootComponent: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;

    constructor(injector: Injector,
                private _filtersService: FiltersService,
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
                url: this.getODataURL('Order'),
                version: 4,
                beforeSend: function (request) {
                    request.headers["Authorization"] = 'Bearer ' + abp.auth.getToken();
                    request.headers["Abp.TenantId"] = abp.multiTenancy.getTenantIdCookie();
                },
                paginate: true
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
                onClick: this.togglePipeline.bind(this, true)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Grid',
                iconSrc: 'assets/common/icons/table-icon.svg',
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
        if (!this.firstRefresh) {
            this.firstRefresh = true;
            abp.ui.setBusy(
                '',
                this.dataGrid.instance.refresh()
            );
        }
    }

    ngOnInit(): void {
        this._filtersService.setup([
            <FilterModel>{
                component: FilterDatesComponent,
                operator: { from: "ge", to: "le" },
                caption: 'creation',
                field: 'CreationTime',
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
                    paymentType: <DropDownElement>{
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
                caption: 'orderTotals',
                items: {}
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
                caption: 'recurrence',
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
                caption: 'zipCode',
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
            },
            <FilterModel>{
                component: FilterInputsComponent,
                operator: 'contains',
                caption: 'cardBins',
                items: {}
            }
        ]);
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
