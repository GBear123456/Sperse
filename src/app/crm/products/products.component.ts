/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter, finalize } from 'rxjs/operators';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { FilterMultilineInputComponent } from '@root/shared/filters/multiline-input/filter-multiline-input.component';
import { FilterMultilineInputModel } from '@root/shared/filters/multiline-input/filter-multiline-input.model';
import { AddProductDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/add-product-dialog/add-product-dialog.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ProductServiceProxy, InvoiceSettings } from '@shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ProductDto } from '@app/crm/products/products-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ProductFields } from '@app/crm/products/products-fields.enum';

@Component({
    templateUrl: './products.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './products.component.less'
    ],
    providers: [
        ProductServiceProxy,
        LifecycleSubjectsService
    ]
})
export class ProductsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

    private readonly dataSourceURI = 'Product';
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;
    isReadOnly = true;
    permissions = AppPermissions;
    public headlineButtons: HeadlineButton[] = [];

    actionEvent: any;
    actionMenuGroups: ActionMenuItem[] = [
        {
            text: this.l('Edit'),
            class: 'edit',
            action: () => {
                this.editProduct(this.actionEvent.Id);
            }
        },
        {
            text: this.l('SyncSubscriptionsWithProduct'),
            class: 'sync',
            visible: this.permission.isGranted(AppPermissions.CRMOrdersManage),
            action: () => {
                this.syncSubscriptionsWithProduct(this.actionEvent.Id);
            }
        },
        {
            text: this.l('Delete'),
            class: 'delete',
            action: () => {
                this.deteleProduct(this.actionEvent.Id);
            }
        }
    ];

    currency: string;
    searchValue: string = this._activatedRoute.snapshot.queryParams.searchValue || '';
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    private filters: FilterModel[] = this.getFilters();
    rowsViewHeight: number;
    readonly productFields: KeysEnum<ProductDto> = ProductFields;
    dataStore = {
        key: this.productFields.Id,
        deserializeDates: false,
        url: this.getODataUrl(
            this.dataSourceURI
        ),
        version: AppConsts.ODataVersion,
        beforeSend: (request) => {
            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            request.params.$select = DataGridService.getSelectFields(
                this.dataGrid, [this.productFields.Id]
            );
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        },
        errorHandler: (error) => {
            setTimeout(() => this.isDataLoaded = true);
        }
    };

    constructor(
        injector: Injector,
        invoicesService: InvoicesService,
        private filtersService: FiltersService,
        private productProxy: ProductServiceProxy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        public appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.isReadOnly = !this.permission.isGranted(this.permissions.CRMProductsManage);
        this.headlineButtons.push({
            enabled: !this.isReadOnly,
            action: () => this.showProductDialog(),
            label: this.l('AddProduct')
        });
        this.dataSource = new DataSource({store: new ODataStore(this.dataStore)});
        invoicesService.settings$.pipe(filter(Boolean)).subscribe(
            (res: InvoiceSettings) => this.currency = res.currency
        );
    }

    ngOnInit() {
        this.activate();
    }

    toggleToolbar() {
        this.repaintDataGrid();
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        this.processFilterInternal();
    }

    editProduct(id: number) {
        this.startLoading();
        this.productProxy.getProductInfo(id).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(product => {
            this.showProductDialog({
                id: id,
                ...product
            });
        });
    }

    syncSubscriptionsWithProduct(id: number) {
        this.startLoading();
        this.productProxy.synchronizeSubscriptions(id).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.message.success(this.l('SuccessfullyUpdated'));
        });
    }

    deteleProduct(id: number) {
        this.message.confirm('',
            this.l('DeleteConfiramtion'),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading();
                    this.productProxy.deleteProduct(id).pipe(
                        finalize(() => this.finishLoading())
                    ).subscribe(() => {
                        this.invalidate();
                    });
                }
            }
        );
    }

    showProductDialog(product?) {
        const dialogData = {
            fullHeigth: true,
            product: product,
            isReadOnly: this.isReadOnly
        };
        this.dialog.open(AddProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(
            () => this.invalidate()
        );
    }

    initFilterConfig() {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
        }

        this.filtersService.apply(() => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    private getFilters() {
        return [
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
                caption: 'name',
                items: { Name: new FilterItemModel()}
            }),
            new FilterModel({
                component: FilterMultilineInputComponent,
                caption: 'Code',
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Code',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'Code'
                    })
                }
            })
        ];
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
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
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Products').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
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
                            items: [
                                {
                                    action: (options) => {
                                        this.exportToXLS(options);
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls'
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions'
                                }
                            ]
                        }
                    },
                    { name: 'print', action: Function(), visible: false }
                ]
            }
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this.processFilterInternal();
        }
    }

    processFilterInternal() {
        this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.filters,
            this.filtersService.getCheckCustom
        );
    }

    initDataSource() {
        this.setDataGridInstance();
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        if (this.dependencyChanged)
            this.invalidate();

        this.showHostElement();
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onCellClick(event) {
        if (event.rowType == 'data' && event.data)
            this.editProduct(event.data.Id);
    }

    toggleActionsMenu(event) {
        if (this.isReadOnly)
            return;

        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe((actionRecord) => {
            this.actionEvent = actionRecord;
        });
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }
}