/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { filter, finalize, first, map, switchMap, takeUntil } from 'rxjs/operators';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

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
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { InvoiceServiceProxy, InvoiceSettings, InvoiceStatus } from '@shared/service-proxies/service-proxies';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from './invoices-dto.interface';
import { InvoiceFields } from './invoices-fields.enum';
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { BehaviorSubject, combineLatest, concat, Observable } from 'rxjs';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';

@Component({
    templateUrl: './invoices.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less'
    ],
    providers: [
        LifecycleSubjectsService,
        CurrencyPipe,
        InvoiceServiceProxy
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

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

    actionEvent: any;
    actionMenuGroups: ActionMenuItem[] = [
        {
            text: this.l('Edit'),
            class: 'edit',
            action: () => {
                this.showInvoiceDialog(this.actionEvent.Id);
            }
        },
        {
            text: this.l('Preview'),
            class: 'preview',
            action: () => {
                this.previewInvoice(this.actionEvent);
            }
        },
        {
            text: this.l('Delete'),
            class: 'delete',
            action: () => {
                this.deleteInvoice(this.actionEvent);
            },
            checkVisible: (data) => {
                return [InvoiceStatus.Draft, InvoiceStatus.Final, InvoiceStatus.Canceled].indexOf(data.Status) >= 0;
            } 
        }
    ];

    currency: string;
    searchValue: string = this._activatedRoute.snapshot.queryParams.searchValue || '';
    toolbarConfig: ToolbarGroupModel[];
    readonly invoiceFields: KeysEnum<InvoiceDto> = InvoiceFields;
    private filters: FilterModel[] = this.getFilters();
    rowsViewHeight: number;

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
                this.dataGrid, [this.invoiceFields.Id, this.invoiceFields.PublicId, this.invoiceFields.Number, this.invoiceFields.ContactId]
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
            },
            errorHandler: (e: any) => {
                this.totalErrorMsg = this.l('AnHttpErrorOccured');
            }
        })
    });

    constructor(
        injector: Injector,
        invoicesService: InvoicesService,
        private invoiceProxy: InvoiceServiceProxy,
        private filtersService: FiltersService,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef,
        public appService: AppService,
        private currencyPipe: CurrencyPipe,
        public dialog: MatDialog
    ) {
        super(injector);
        this.isReadOnly = !this.permission.isGranted(this.permissions.CRMOrdersInvoicesManage);
        this.headlineButtons.push({
            enabled: !this.isReadOnly &&
                !!appService.getFeatureCount(AppFeatures.CRMInvoicesManagement),
            action: () => this.showInvoiceDialog(),
            label: this.l('AddInvoice')
        });
        this.dataSource = new DataSource({ store: new ODataStore(this.dataStore) });
        invoicesService.settings$.pipe(filter(Boolean)).subscribe(
            (res: InvoiceSettings) => this.currency = res.currency
        );
    }

    ngOnInit() {
        this.activate();
        this.handleDataGridUpdate();
        this.handleTotalCountUpdate();
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
                odataRequestValues.params
            );
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_url'] = url;
                this.totalDataSource.load();
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
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    invalidate() {
        this._refresh.next(null);
    }

    deleteInvoice(actionEvent) {
        let invoiceId = actionEvent.Id;
        this.message.confirm(
            this.l('InvoiceDeleteWarningMessage', actionEvent.Number), '',
            isConfirmed => {
                if (isConfirmed) {
                    this.startLoading(true);
                    this.invoiceProxy.deleteInvoice(invoiceId).pipe(
                        finalize(() => this.finishLoading(true))
                    ).subscribe(() => {
                        this.invalidate();
                    });
                }
            }
        );
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

    previewInvoice(data: InvoiceDto) {
        window.open(location.origin + `/invoicing/invoice/${this.appSession.tenantId || 0}/${data.PublicId}`, '_blank');
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
                                name: status
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

    processFilterInternal() {
        if (this.dataGrid) {
            this.processODataFilter(
                this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom
            );
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
            this.showInvoiceDialog(event.data);
    }

    toggleActionsMenu(event) {
        if (this.isReadOnly)
            return;

        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe(actionEvent => {
            ActionMenuService.prepareActionMenuItems(this.actionMenuGroups, event.data);
            this.actionEvent = actionEvent;
            this.changeDetectorRef.detectChanges();
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