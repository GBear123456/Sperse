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
import {FilterStatesComponent} from '@shared/filters/states/filter-states.component';

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
                icon: 'column-chooser',
                onClick: this.showColumnChooser.bind(this)
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Box',
                iconSrc: 'assets/common/images/icons/box-icon.svg',
                onClick: Function()
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
            <FilterModel> {component: FilterStatesComponent, caption: 'states'}
        ]);
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
