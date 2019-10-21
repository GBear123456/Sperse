/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import each from 'lodash/each';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { AppService } from '@app/app.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel, FilterModelBase } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { CreateInvoiceDialogComponent } from '../shared/create-invoice-dialog/create-invoice-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    providers: [ PipelineService ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
    @ViewChild(StaticListComponent) stagesComponent: StaticListComponent;
    items: any;
    showPipeline = true;
    pipelineDataSource: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;
    stages = [];

    selectedOrderKeys = [];

    private _selectedOrders: any;
    get selectedOrders() {
        return this._selectedOrders || [];
    }
    set selectedOrders(orders) {
        this._selectedOrders = orders;
        this.selectedOrderKeys = orders.map((item) => item.Id);
    }

    manageDisabled = true;
    filterModelStages: FilterModel;

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Order';
    private filters: FilterModel[];
    private filterChanged = false;
    masks = AppConsts.masks;
    private formatting = AppConsts.formatting;
    public headlineConfig = {
        names: [this.l('Orders')],
        // onRefresh: this.processFilterInternal.bind(this),
        toggleToolbar: this.toggleToolbar.bind(this),
        icon: 'briefcase',
        buttons: [
            {
                enabled: this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
                action: this.createInvoice.bind(this),
                lable: this.l('CreateInvoice')
            }
        ]
    };
    permissions = AppPermissions;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private contactsService: ContactsService,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _pipelineService: PipelineService,
        private store$: Store<CrmStore.State>
    ) {
        super(injector);

        this.dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            }
        };

        this.initToolbarConfig();
    }

    ngOnInit() {
        this.activate();
    }

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this._filtersService.fixed = false;
        this._filtersService.disable();
        this.initToolbarConfig();
    }

    ngAfterViewInit(): void {
        this.initDataSource();
    }

    initDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => { this.pipelineDataSource = this.dataSource; });
        } else {
            this.setDataGridInstance();
        }
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    onContentReady(event) {
        this.finishLoading();
        this.setGridDataLoaded();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    invalidate() {
        this.processFilterInternal();
        this.filterChanged = true;
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this._pipelineService.toggleDataLayoutType(dataLayoutType);
        this.showPipeline = dataLayoutType == DataLayoutType.Pipeline;
        this.dataLayoutType = dataLayoutType;
        this.initDataSource();
        if (this.showPipeline)
            this.dataGrid.instance.deselectAll();
        else {
            this.pipelineComponent.deselectAllCards();
            setTimeout(() => this.dataGrid.instance.repaint());
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => this.processFilterInternal());
        }
    }

    initFilterConfig(): void {
        if (this.filters) {
            this._filtersService.setup(this.filters);
            this._filtersService.checkIfAnySelected();
        } else {
            this._filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'creation',
                    field: 'CreationTime',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
                }),
                this.filterModelStages = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'orderStages',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource$: this.store$.pipe(select(PipelinesStoreSelectors.getPipelineTreeSource({ purpose: AppConsts.PipelinePurposeIds.order }))),
                                nameField: 'name',
                                parentExpr: 'parentId',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterDropDownComponent,
                    caption: 'paymentType',
                    items: {
                        paymentType: new FilterDropDownModel({
                            elements: null,
                            filterField: 'paymentTypeId',
                            onElementSelect: (event, filter: FilterModelBase<FilterDropDownModel>) => {
                                filter.items['paymentType'].value = event && event.value;
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
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'Amount',
                    field: 'Amount',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                })
            ]);
        }
        this._filtersService.apply(() => {
            this.selectedOrderKeys = [];
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.manageDisabled = !this.isGranted(AppPermissions.CRMOrdersManage);
            this._appService.updateToolbar([
                {
                    location: 'before', items: [
                        {
                            name: 'filters',
                            action: (event) => {
                                setTimeout(() => {
                                    this.dataGrid.instance.repaint();
                                }, 1000);
                                this._filtersService.fixed = !this._filtersService.fixed;
                            },
                            options: {
                                checkPressed: () => {
                                    return this._filtersService.fixed;
                                },
                                mouseover: () => {
                                    this._filtersService.enable();
                                },
                                mouseout: () => {
                                    if (!this._filtersService.fixed)
                                        this._filtersService.disable();
                                }
                            },
                            attr: {
                                'filter-selected': this._filtersService.hasFilterSelected
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    items: [
                        {
                            name: 'search',
                            widget: 'dxTextBox',
                            options: {
                                width: '279',
                                mode: 'search',
                                value: this.searchValue,
                                placeholder: this.l('Search') + ' ' + this.l('Orders').toLowerCase(),
                                onValueChanged: (e) => {
                                    this.searchValueChange(e);
                                }
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'assign',
                            disabled: this.manageDisabled
                        },
                        {
                            name: 'stage',
                            action: this.toggleStages.bind(this),
                            disabled: this.manageDisabled,
                            attr: {
                                'filter-selected': this.filterModelStages && this.filterModelStages.isSelected
                            }
                        },
                        {
                            name: 'delete',
                            disabled: this.manageDisabled
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [{
                        name: 'rules',
                        options: {
                            text: this.l('Settings')
                        },
                        action: this.invoiceSettings.bind(this)
                    }]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
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
                        { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        { name: 'showCompactRowsHeight', action: () => this.toggleContactView() }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    areItemsDependent: true,
                    items: [
                        // {
                        //     name: 'box',
                        //     action: this.toggleDataLayout.bind(this, DataLayoutType.Box),
                        //     options: {
                        //         checkPressed: () => {
                        //             return (this.dataLayoutType == DataLayoutType.Box);
                        //         },
                        //     }
                        // },
                        {
                            name: 'pipeline',
                            action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                            options: {
                                checkPressed: () => {
                                    return (this.dataLayoutType == DataLayoutType.Pipeline);
                                },
                            }
                        },
                        {
                            name: 'dataGrid',
                            action: this.toggleDataLayout.bind(this, DataLayoutType.DataGrid),
                            options: {
                                checkPressed: () => {
                                    return (this.dataLayoutType == DataLayoutType.DataGrid);
                                },
                            }
                        }
                    ]
                }
            ]);
        }
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    private toggleContactView() {
        this._pipelineService.toggleContactView();
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    processFilterInternal() {
        if (this.showPipeline) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }

        let context = this.showPipeline ? this.pipelineComponent : this;
        context.processODataFilter.call(context,
            this.dataGrid.instance,
            this.dataSourceURI,
            this.filters,
            this._filtersService.getCheckCustom
        );
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.initToolbarConfig();
            this.processFilterInternal();
        }
    }

    onStagesLoaded($event) {
        this.stages = $event.stages.map((stage) => {
            return {
                id: this._pipelineService.getPipeline(
                    this.pipelinePurposeId).id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name,
            };
        });
        this.initToolbarConfig();
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCellClick(event) {
        let col = event.column;
        if (col && col.command)
            return;

        this.onCardClick(event.data);
    }

    onCardClick(order) {
        if (order && order.ContactId) {
            this.searchClear = false;
            this._router.navigate(
                ['app/crm/contact', order.ContactId, 'orders'], {
                    queryParams: {
                        referrer: 'app/crm/orders',
                        dataLayoutType: DataLayoutType.Pipeline
                    }
                }
            );
        }
    }

    createInvoice() {
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: ['slider'],
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: this.invalidate.bind(this)
            }
        });
    }

    invoiceSettings() {
        this.contactsService.showInvoiceSettingsDialog();
    }

    activate() {
        super.activate();

        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement(() => {
            this.pipelineComponent.detectChanges();
        });
    }

    onOrderStageChanged(order) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.getVisibleRows().some((row) => {
                if (order.Id == row.data.Id) {
                    row.data.Stage = order.Stage;
                    row.data.StageId = order.StageId;
                    return true;
                }
            });
    }

    updateOrdersStage($event) {
        if (this.permission.isGranted(AppPermissions.CRMBulkUpdates)) {
            this.stagesComponent.tooltipVisible = false;
            this._pipelineService.updateEntitiesStage(
                this.pipelinePurposeId,
                this.selectedOrders,
                $event.name
            ).subscribe((declinedList) => {
                this.filterChanged = true;
                if (this.showPipeline)
                    this.pipelineComponent.refresh();
                else {
                    let gridInstance = this.dataGrid && this.dataGrid.instance;
                    if (gridInstance && declinedList && declinedList.length)
                        gridInstance.selectRows(declinedList.map(item => item.Id), false);
                    else
                        gridInstance.clearSelection();
                }
            });
        }
    }

    onSelectionChanged($event) {
        this.selectedOrders = $event.component.getSelectedRowsData();
    }

    deactivate() {
        super.deactivate();
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        this.hideHostElement();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}
