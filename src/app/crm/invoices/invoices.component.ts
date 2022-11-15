/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import * as _ from 'underscore';
import startCase from 'lodash/startCase';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterServicesAndProductsComponent } from '@app/crm/shared/filters/services-and-products-filter/services-and-products-filter.component';
import { FilterServicesAndProductsModel } from '@app/crm/shared/filters/services-and-products-filter/services-and-products-filter.model';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { InvoiceServiceProxy, InvoiceStatus, PipelineDto, ProductDto, ProductServiceProxy, StageDto } from '@shared/service-proxies/service-proxies';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto, InvoiceStatusQuickFitler } from './invoices-dto.interface';
import { InvoiceFields } from './invoices-fields.enum';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { BehaviorSubject, combineLatest, concat, Observable } from 'rxjs';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { Params } from '@angular/router';
import { InvoiceGridMenuComponent } from './invoice-grid-menu/invoice-grid-menu.component';
import { InvoiceGridMenuDto } from './invoice-grid-menu/invoice-grid-menu.interface';
import { SettingsHelper } from '@shared/common/settings/settings.helper';
import { InvoiceSettingsDialogComponent } from '../contacts/invoice-settings-dialog/invoice-settings-dialog.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DateHelper } from '../../../shared/helpers/DateHelper';
import { InvoicesService } from '../contacts/invoices/invoices.service';

@Component({
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.less'],
    providers: [
        LifecycleSubjectsService,
        CurrencyPipe,
        InvoiceServiceProxy,
        ProductServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;
    @ViewChild(InvoiceGridMenuComponent) invoiceGridMenu: InvoiceGridMenuComponent;

    private readonly dataSourceURI = 'Invoice';
    private readonly dataSourceCountURI = 'InvoiceCount';
    totalCount: number;
    totalSum: number;
    totalErrorMsg: string;

    private rootComponent: any;
    isReadOnly = true;
    permissions = AppPermissions;
    formatting = AppConsts.formatting;
    public headlineButtons: HeadlineButton[] = [];

    startCase = startCase;

    currency: string = SettingsHelper.getCurrency();
    searchClear = false;
    searchValue: string = this._activatedRoute.snapshot.queryParams.search || '';
    toolbarConfig: ToolbarGroupModel[];
    selectedQuickStatusFilter: InvoiceStatusQuickFitler = InvoiceStatusQuickFitler.All;
    readonly invoiceFields: KeysEnum<InvoiceDto> = InvoiceFields;
    private filters: FilterModel[] = this.getFilters();
    private prodcutsFilter: FilterModel;
    rowsViewHeight: number;

    hasOrdersManage = this.isGranted(AppPermissions.CRMOrdersManage);

    stages$: Observable<StageDto[]> = this.pipelineService.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order, null).pipe(
        map((pipeline: PipelineDto) => pipeline.stages)
    );

    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    odataRequestValues$: Observable<ODataRequestValues> = concat(
        this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom),
        this.filtersService.filtersChanged$.pipe(
            filter(() => this.componentIsActivated),
            switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
        )
    ).pipe(
        filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues),
    );

    dataStore = {
        key: this.invoiceFields.Id,
        deserializeDates: false,
        url: this.getODataUrl(
            this.dataSourceURI
        ),
        version: AppConsts.ODataVersion,
        beforeSend: (request) => {
            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            request.params.$select = DataGridService.getSelectFields(
                this.dataGrid,
                [
                    this.invoiceFields.Id, this.invoiceFields.PublicId, this.invoiceFields.Number, this.invoiceFields.ContactId,
                    this.invoiceFields.Status, this.invoiceFields.GrandTotal, this.invoiceFields.OrderStageName
                ],
                {
                    FullName: [this.invoiceFields.PhotoPublicId],
                    OrderStageName: [this.invoiceFields.OrderId]
                }
            );
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        },
        errorHandler: (error) => {
            setTimeout(() => this.isDataLoaded = true);
        }
    };
    totalDataSource = new DataSource({
        paginate: false,
        store: new ODataStore({
            version: AppConsts.ODataVersion,
            url: this.getODataUrl(
                this.dataSourceCountURI
            ),
            beforeSend: (request) => {
                this.totalCount = this.totalSum = this.totalErrorMsg = undefined;
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            },
            onLoaded: (countSumDto: any) => {
                if (countSumDto) {
                    this.dataSource['total'] = this.totalCount = countSumDto.count;
                    this.totalSum = countSumDto.sum;
                }
                else {
                    this.dataSource['total'] = this.totalCount = this.totalSum = 0;
                }
            },
            errorHandler: (e: any) => {
                this.totalErrorMsg = this.l('AnHttpErrorOccured');
            }
        })
    });

    constructor(
        injector: Injector,
        private invoicesService: InvoicesService,
        private productProxy: ProductServiceProxy,
        private filtersService: FiltersService,
        private pipelineService: PipelineService,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private appService: AppService,
        private currencyPipe: CurrencyPipe,
        public dialog: MatDialog
    ) {
        super(injector);
        this.isReadOnly = !this.permission.isGranted(this.permissions.CRMOrdersInvoicesManage);
        this.headlineButtons.push({
            enabled: !this.isReadOnly && this.feature.isEnabled(AppFeatures.CRMInvoicesManagement),
            action: () => this.showInvoiceDialog(),
            label: this.l('CreateInvoice')
        });
        this.dataSource = new DataSource({ store: new ODataStore(this.dataStore) });
    }

    ngOnInit() {
        this.activate();
        this.handleDataGridUpdate();
        this.handleTotalCountUpdate();
        this.handleQueryParams();
    }

    customizeTotal = () => this.totalCount !== undefined ? this.l('Count') + ': ' + this.totalCount : '';
    customizeSum = () => this.totalSum !== undefined ?
        this.l('Sum') + ': ' + this.currencyPipe.transform(this.totalSum, this.currency, 'symbol', '1.2-2') :
        '';

    private handleDataGridUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handleTotalCountUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            map(([odataRequestValues,]: [ODataRequestValues, null]) => {
                return odataRequestValues;
            })
        ).subscribe((odataRequestValues: ODataRequestValues) => {
            let url = this.getODataUrl(
                this.dataSourceCountURI,
                odataRequestValues.filter,
                null,
                odataRequestValues.params ? odataRequestValues.params.concat(this.getProductsParams()) : this.getProductsParams()
            );
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_url'] = url;
                this.totalDataSource.load();
            }
        });
    }

    private handleQueryParams() {
        this._activatedRoute.queryParams.pipe(
            filter(() => this.componentIsActivated),
            takeUntil(this.destroy$)
        ).subscribe((params: Params) => {
            let isSearchChanged = params.search && this.searchValue != params.search;
            if (isSearchChanged) {
                this.searchValue = params.search;
                this.initToolbarConfig();
                this.invalidate();
            }
        });
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
    }

    invalidate() {
        this._refresh.next(null);
    }

    showInvoiceSettings() {
        this.dialog.open(InvoiceSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
        });
    }

    showInvoiceDialog(data?: InvoiceDto) {
        let invoiceData = data ? { InvoiceId: data.Id, ContactId: data.ContactId } : null;
        this.dialog.open(CreateInvoiceDialogComponent, {
            panelClass: ['slider'],
            disableClose: true,
            closeOnNavigation: false,
            data: {
                addNew: !data,
                invoice: invoiceData,
                refreshParent: () => {
                    this.invalidate();
                }
            }
        });
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
        });
    }

    private getFilters() {
        return [
            new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'status',
                field: 'Status',
                items: {
                    element: new FilterCheckBoxesModel(
                        {
                            dataSource: Object.keys(InvoiceStatus).map((status: string) => ({
                                id: InvoiceStatus[status],
                                name: startCase(status)
                            })),
                            nameField: 'name',
                            keyExpr: 'id'
                        })
                }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                options: { type: 'number' },
                operator: { from: 'ge', to: 'le' },
                caption: 'Amount',
                field: this.invoiceFields.GrandTotal,
                items: { from: new FilterItemModel(), to: new FilterItemModel() }
            }),
            new FilterModel({
                component: FilterCalendarComponent,
                operator: { from: 'ge', to: 'le' },
                caption: 'creation',
                field: this.invoiceFields.Date,
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
            }),
            this.prodcutsFilter = new FilterModel({
                component: FilterServicesAndProductsComponent,
                caption: 'Product',
                items: {
                    products: new FilterServicesAndProductsModel(
                        {
                            dataSource$: this.productProxy.getProducts(
                                undefined
                            ).pipe(
                                map((products: ProductDto[]) => {
                                    let productsWithGroups = products.filter(x => x.group);
                                    let productsWithoutGroups = products.filter(x => !x.group);
                                    let groups = _.groupBy(productsWithGroups, (x: ProductDto) => x.group);
                                    let arr: any[] = _.keys(groups).map(groupName => {
                                        return {
                                            id: groupName,
                                            name: groupName,
                                            products: groups[groupName].sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }))
                                        };
                                    }).sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }));
                                    return arr.concat(
                                        productsWithoutGroups.sort((prev, next) => prev.name.localeCompare(next.name, 'en', { sensitivity: 'base' }))
                                    );
                                })
                            ),
                            nameField: 'name',
                            codeField: 'code',
                            keyExpr: 'id',
                            dataStructure: 'tree',
                            itemsExpr: 'products',
                            recursive: true
                        }
                    )
                }
            }),
            new FilterModel({
                caption: 'statusQuickFilter',
                hidden: true,
                isSelected: false,
                filterMethod: () => this.getOdataFilterByQuickStatus()
            }),
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
                            placeholder: this.l('Search') + ' ' + this.l('Clients').toLowerCase(),
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
                items: [{
                    name: 'rules',
                    options: {
                        text: this.l('Settings'),
                        hint: this.l('Settings')
                    },
                    visible: this.isGranted(AppPermissions.CRMOrdersInvoices) ||
                        this.isGranted(AppPermissions.CRMSettingsConfigure),
                    action: this.showInvoiceSettings.bind(this)
                }]
            },
            {
                location: 'center',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: Object.keys(InvoiceStatusQuickFitler).map(key => {
                    return {
                        name: key,
                        widget: 'dxButton',
                        options: {
                            text: key,
                            checkPressed: () => {
                                return this.selectedQuickStatusFilter == InvoiceStatusQuickFitler[key];
                            }
                        },
                        action: () => {
                            this.filterByQuickStatus(InvoiceStatusQuickFitler[key]);
                        }
                    };
                })
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
        if (this.dataGrid) {
            this.processODataFilter(
                this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom,
                null,
                this.getProductsParams()
            );
        }
    }

    filterByQuickStatus(item: InvoiceStatusQuickFitler) {
        this.selectedQuickStatusFilter = item;
        this.initToolbarConfig();
        this.invalidate();
    }

    getOdataFilterByQuickStatus() {
        switch (this.selectedQuickStatusFilter) {
            case InvoiceStatusQuickFitler.Paid:
                return `${this.invoiceFields.Status} eq '${InvoiceStatus.Paid}'`;
            case InvoiceStatusQuickFitler.Unpaid:
                return {
                    or: [`${this.invoiceFields.Status} eq '${InvoiceStatus.Sent}'`,
                    `${this.invoiceFields.Status} eq '${InvoiceStatus.PartiallyPaid}'`]
                };
            case InvoiceStatusQuickFitler.Overdue:
                return {
                    and: [{
                        or: [`${this.invoiceFields.Status} eq '${InvoiceStatus.Sent}'`,
                        `${this.invoiceFields.Status} eq '${InvoiceStatus.PartiallyPaid}'`]
                    },
                        `${this.invoiceFields.DueDate} lt ${DateHelper.removeTimezoneOffset(new Date(), true, 'from').toISOString()}`]
                };
            default:
                return {};
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        super.activate();
        this.searchClear = false;
        this.lifeCycleSubjectsService.activate.next();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement();
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    getDueDateColor(data: InvoiceDto) {
        if (!data.DueDate || [InvoiceStatus.Sent, InvoiceStatus.PartiallyPaid].indexOf(data.Status) < 0)
            return '';

        let today = new Date();
        let date = new Date(data.DueDate);
        return date < today && date.getDate() < today.getDate() ? 'red' : 'green';
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCellClick(event) {
        if (event.rowType == 'data') {
            if (event.column.dataField == this.invoiceFields.OrderStageName)
                return;

            let invoice = event.data;
            if (event.columnIndex > 1 && invoice) {
                this.showInvoiceDialog(invoice);
            }
            else if (!this.isReadOnly && event.event.target.closest('.dx-link.dx-link-edit')) {
                let oDataDto: InvoiceDto = event.data;
                let invoiceDto: InvoiceGridMenuDto = {
                    Id: oDataDto.Id,
                    Number: oDataDto.Number,
                    Status: oDataDto.Status,
                    Amount: oDataDto.GrandTotal,
                    PublicId: oDataDto.PublicId,
                    OrderId: oDataDto.OrderId,
                    OrderStage: oDataDto.OrderStageName,
                    ContactId: oDataDto.ContactId
                };
                this.invoiceGridMenu.showTooltip(invoiceDto, event.event.target, true);
            }
        }
    }

    updateOrderStage(event) {
        if (!this.hasOrdersManage)
            return;

        const invoice: InvoiceDto = event.data;
        this.invoicesService.updateOrderStage(invoice.OrderId, invoice.OrderStageName, event.value)
            .subscribe(declinedList => {
                if (declinedList.length)
                    event.value = invoice.OrderStageName;
                else {
                    this.notify.success(this.l('StageSuccessfullyUpdated'));
                    this.dataGrid.instance.getVisibleRows().map(row => {
                        if (invoice.OrderId == row.data.OrderId)
                            row.data.OrderStage = event.value;
                    });
                }
            });
    }

    onStageOptionChanged(data, event) {
        if (event.component.option('disabled'))
            return;

        event.component.option('disabled', event.component.option('dataSource')
            .some(item => data.value == item.name && item.isFinal));
    }

    private getProductsParams() {
        let result = [],
            selectedProducts = this.prodcutsFilter.items.products['selectedItems'];

        selectedProducts && selectedProducts.filter(item => Number.isInteger(item.id)).forEach((item, i) => {
            result.push({
                name: 'productIds[' + i + ']',
                value: item.id
            });
        });

        return result;
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