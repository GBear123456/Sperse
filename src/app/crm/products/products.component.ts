/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { finalize } from 'rxjs/operators';
import { DataSource } from 'devextreme/data/data_source/data_source';
import ODataStore from 'devextreme/data/odata/store';
import * as moment from 'moment';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
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
import { CreateProductDialogComponent } from '@app/crm/contacts/subscriptions/add-subscription-dialog/create-product-dialog/create-product-dialog.component';
import { ShareDialogComponent } from '@app/shared/common/dialogs/share/share-dialog.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ProductServiceProxy, ProductType, RecurringPaymentFrequency } from '@shared/service-proxies/service-proxies';
import { ProductDto, PriceOption } from '@app/crm/products/products-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ProductFields } from '@app/crm/products/products-fields.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CurrencyCRMService } from '../../../store/currencies-crm-store/currency.service';

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
    private dependencyChanged = false;
    isReadOnly = true;
    permissions = AppPermissions;
    isInvoicesEnabled = abp.features.isEnabled(AppFeatures.CRMInvoicesManagement);
    headerOptions = [this.l("Products"), this.l("Coupons")];
    activeHeaderOption = this.headerOptions[0];
    public headlineButtons: HeadlineButton[] = [];
    formatting = AppConsts.formatting;

    actionEvent: any;
    actionMenuGroups: ActionMenuItem[] = [
        {
            text: this.l('Add Bookmark'),
            class: 'bookmark',
            disabled: true,
            action: () => { }
        },
        {
            text: this.l('View'),
            class: 'preview',
            action: () => {
                window.open(this.getProductPublicLink(this.actionEvent));
            }
        },
        {
            text: this.l('Test'),
            class: 'status',
            disabled: true,
            action: () => { }
        },
        {
            text: this.l('Edit'),
            class: 'edit',
            action: () => {
                this.editProduct(this.actionEvent.Id);
            }
        },
        {
            text: this.l('Duplicate'),
            class: 'copy',
            action: () => {
                this.editProduct(this.actionEvent.Id, true);
            }
        },
        {
            text: this.l('Archive'),
            class: 'archive',
            action: () => {
                this.archiveProduct(this.actionEvent.Id);
            },
            checkVisible: (itemData: ProductDto) => !itemData.IsArchived
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

    productType = ProductType;
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
                this.dataGrid, [
                    this.productFields.Id,
                    this.productFields.PublicName,
                    this.productFields.CreateUser,
                    this.productFields.AllowCoupon,
                    this.productFields.PublishDate,
                    this.productFields.IsArchived
                ],
                {
                    Price: [this.productFields.CurrencyId, this.productFields.PriceOptions],
                    Unit: [this.productFields.PriceOptions]
                }
            );
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        },
        errorHandler: (error) => {
            setTimeout(() => this.isDataLoaded = true);
        }
    };

    constructor(
        injector: Injector,
        private clipboardService: ClipboardService,
        private filtersService: FiltersService,
        private productProxy: ProductServiceProxy,
        private currencyService: CurrencyCRMService,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        public appService: AppService,
        public dialog: MatDialog
    ) {
        super(injector);
        this.isReadOnly = !this.permission.isGranted(this.permissions.CRMProductsManage);
        this.headlineButtons.push({
            enabled: !this.isReadOnly &&
                !!appService.getFeatureCount(AppFeatures.CRMMaxProductCount),
            action: () => this.showProductDialog(),
            label: this.l('AddProduct')
        });
        this.dataSource = new DataSource({ store: new ODataStore(this.dataStore) });
    }

    ngOnInit() {
        this.activate();
    }

    copyToClipbord(event, data) {
        this.clipboardService.copyFromContent(this.getProductPublicLink(data));
        this.notify.info(this.l('SavedToClipboard'));
    }

    openProductPage(event, data) {
        window.open(this.getProductPublicLink(data));
    }

    getProductPublicLink(data) {
        return location.origin + '/p/' + (abp.session.tenantId || 0) + '/' + data.PublicName;
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

    editProduct(id: number, duplicate = false) {
        this.startLoading();
        this.productProxy.getProductInfo(id).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(product => {
            if (duplicate) {
                product.id = undefined;
                product.name += ' (2)';
                product.code += ' (2)';
                if (product.publicName)
                    product.publicName += '2';
                product.stripeXref = undefined;
                product.stripeXrefUrl = undefined;
                product.paypalXref = undefined;
                product.hasExternalReference = false;
                product.hasIncompletedInvoices = false;
                product.isArchived = false;
                if (product.priceOptions)
                    product.priceOptions =
                        product.priceOptions.map(sub => {
                            sub.stripeXref = undefined;
                            sub.stripeXrefUrl = undefined;
                            sub.paypalXref = undefined;
                            return sub;
                        });
                product.imageUrl = undefined;
                if (product.productResources)
                    product.productResources =
                        product.productResources.filter(res => {
                            res.id = undefined;
                            return !res.fileId;
                        });
                if (product.productDonation && product.productDonation.productDonationSuggestedAmounts)
                    product.productDonation.productDonationSuggestedAmounts =
                        product.productDonation.productDonationSuggestedAmounts.map(amount => {
                            amount.id = undefined;
                            return amount;
                        });
                if (product.isPublished)
                    product.publishDate = DateHelper.addTimezoneOffset(moment().utcOffset(0, true).toDate());
            }

            this.showProductDialog(product);
        });
    }

    archiveProduct(id: number) {
        this.message.confirm('',
            this.l('ArchiveConfiramtion'),
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading();
                    this.productProxy.archiveProduct(id).pipe(
                        finalize(() => this.finishLoading())
                    ).subscribe(() => {
                        this.invalidate();
                    });
                }
            }
        );
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
            isReadOnly: this.isReadOnly || (product && product.isArchived)
        };
        this.dialog.open(CreateProductDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(
            () => this.invalidate()
        );
    }

    showShareDialog(event, product) {
        let productLink = this.getProductPublicLink(product);
        const dialogData = {
            title: this.l('Product share link options'),
            linkUrl: this.getProductPublicLink(product),
            embedLinkUrl: productLink + '?embeddedCheckout=true'
        };
        this.dialog.open(ShareDialogComponent, {
            panelClass: '',
            disableClose: false,
            closeOnNavigation: true,
            data: dialogData
        });
    }

    navigateToCoupons(event) {
        if (event.value != this.headerOptions[0]) {
            setTimeout(() => {
                this.activeHeaderOption = this.headerOptions[0];
                this._router.navigate(['app/crm/coupons']);
            });
        };
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
                items: { Name: new FilterItemModel() }
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
            }),
            this.currencyService.getCurrencyFilter(undefined)
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
                    },
                    {
                        name: 'title'
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
        if (event.rowType == 'data' && event.data) {
            if (event.column.cellTemplate == 'actionTemplate')
                this.toggleActionsMenu(event);
            else if (event.column.cellTemplate == 'shareTemplate')
                return;
            else
                this.editProduct(event.data.Id);
        }
    }

    toggleActionsMenu(event) {
        if (this.isReadOnly)
            return;

        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe((actionRecord) => {
            ActionMenuService.prepareActionMenuItems(this.actionMenuGroups, event.data);
            this.actionEvent = actionRecord;
        });
    }

    getUnitColumnText(data: ProductDto) {
        if (data.Type == ProductType.Subscription)
            return this.getSubscrOptionDescription(data.PriceOptions[0]);

        return data.Unit;
    }

    getSubscrOptionDescription(data: PriceOption) {
        if (data.Frequency == RecurringPaymentFrequency.Custom) {
            return this.l('RecurringPaymentFrequency_CustomDescription', data.CustomPeriodCount, this.l('CustomPeriodType_' + data.CustomPeriodType));
        }

        return this.l('RecurringPaymentFrequency_' + data.Frequency);
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