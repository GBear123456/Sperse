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
import { takeUntil, pluck, filter, finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { AppService } from '@app/app.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
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
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { CreateInvoiceDialogComponent } from '../shared/create-invoice-dialog/create-invoice-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    providers: [ PipelineService, OrderServiceProxy ]
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
        this.initToolbarConfig();
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
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
            action: this.createInvoice.bind(this),
            label: this.l('CreateInvoice')
        }
    ];
    permissions = AppPermissions;
    currency: string;
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];

    constructor(injector: Injector,
        public dialog: MatDialog,
        private orderProxy: OrderServiceProxy,
        private invoicesService: InvoicesService,
        private contactsService: ContactsService,
        private filtersService: FiltersService,
        private appService: AppService,
        private pipelineService: PipelineService,
        private itemDetailsService: ItemDetailsService,
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

        invoicesService.settings$.subscribe(res => this.currency = res.currency);
        this._activatedRoute.queryParams.pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated),
            pluck('refresh'),
            filter(Boolean)
        ).subscribe(() => this.invalidate());

        this.initToolbarConfig();
    }

    ngOnInit() {
        this.activate();
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
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
        }
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        this.totalCount = this.totalRowCount;
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
        this.pipelineService.toggleDataLayoutType(dataLayoutType);
        this.showPipeline = dataLayoutType == DataLayoutType.Pipeline;
        this.dataLayoutType = dataLayoutType;
        this.initDataSource();
        this.initToolbarConfig();
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
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'creation',
                    field: 'OrderDate',
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
        this.filtersService.apply(() => {
            this.selectedOrderKeys = [];
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.manageDisabled = !this.isGranted(AppPermissions.CRMOrdersManage);
            this.toolbarConfig = [
                {
                    location: 'before', items: [
                        {
                            name: 'filters',
                            action: () => {
                                setTimeout(() => {
                                    this.dataGrid.instance.repaint();
                                }, 1000);
                                this.filtersService.fixed = !this.filtersService.fixed;
                            },
                            options: {
                                checkPressed: () => {
                                    return this.filtersService.fixed;
                                },
                                mouseover: () => {
                                    this.filtersService.enable();
                                },
                                mouseout: () => {
                                    if (!this.filtersService.fixed)
                                        this.filtersService.disable();
                                }
                            },
                            attr: {
                                'filter-selected': this.filtersService.hasFilterSelected
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
                        }
                    ]
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [{
                        name: 'delete',
                        disabled: this.manageDisabled || !this.selectedOrderKeys.length,
                        action: this.deleteOrders.bind(this)
                    }]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [{
                        name: 'rules',
                        options: {
                            text: this.l('Settings')
                        },
                        visible: this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
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
                        {
                            name: 'columnChooser',
                            action: () => DataGridService.showColumnChooser(this.dataGrid),
                            disabled: this.showPipeline
                        }
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
            ];
        }
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleContactView() {
        this.pipelineService.toggleContactView();
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    processFilterInternal() {
        let context: any = this;
        if (this.showPipeline && this.pipelineComponent) {
            context = this.pipelineComponent;
            context.searchColumns = this.searchColumns;
            context.searchValue = this.searchValue;
        } else if (!this.dataGrid)
            return ;

        context.processODataFilter.call(context,
            this.dataGrid.instance,
            this.dataSourceURI,
            this.filters,
            this.filtersService.getCheckCustom
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
                id: this.pipelineService.getPipeline(
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

        this.onCardClick({
            entity: event.data,
            entityStageDataSource: null,
            loadMethod: null
        });
    }

    onCardClick({entity, entityStageDataSource, loadMethod}) {
        if (entity && entity.ContactId) {
            this.searchClear = false;
            this._router.navigate(
                ['app/crm/contact', entity.ContactId, 'invoices'], {
                    queryParams: {
                        id: entity.Id,
                        referrer: 'app/crm/orders',
                        dataLayoutType: DataLayoutType.Pipeline
                    }
                }
            );
            if (entityStageDataSource)
                this.itemDetailsService.setItemsSource(
                    ItemTypeEnum.Order, entityStageDataSource, loadMethod);
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
            this.pipelineService.updateEntitiesStage(
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

    updateTotalCount(totalCount: number) {
        this.totalCount = totalCount;
    }

    deleteOrders() {
        this.message.confirm(
            this.l('OrdersDeleteWarningMessage'),
            isConfirmed => {
                if (isConfirmed)
                    this.deleteOrdersInternal();
            }
        );
    }

    private deleteOrdersInternal() {
        this.startLoading();
        forkJoin(this.selectedOrderKeys.map(
            this.orderProxy.delete.bind(this.orderProxy)
        )).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();
            this.dataGrid.instance.deselectAll();
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.filterChanged = true;
        });
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        if (!this.showPipeline)
            this.itemDetailsService.setItemsSource(ItemTypeEnum.Order, this.dataGrid.instance.getDataSource());

        this.hideHostElement();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}
