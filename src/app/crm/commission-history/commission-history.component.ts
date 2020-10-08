/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, concat, Observable } from 'rxjs';
import { filter, finalize, first, map, skip, switchMap, takeUntil } from 'rxjs/operators';
import startCase from 'lodash/startCase';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { AppPermissions } from '@shared/AppPermissions';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { CommissionServiceProxy, InvoiceSettings } from '@shared/service-proxies/service-proxies';
import { CommissionEarningsDialogComponent } from '@app/crm/commission-history/commission-earnings-dialog/commission-earnings-dialog.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { CommissionFields } from '@app/crm/commission-history/commission-fields.enum';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { CommissionDto } from '@app/crm/commission-history/commission-dto';
import { LedgerDto } from '@app/crm/commission-history/ledger-dto';
import { LedgerFields } from '@app/crm/commission-history/ledger-fields.enum';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { CommissionStatus } from '@app/crm/commission-history/commission-status.enum';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { LedgerType } from '@app/crm/commission-history/ledger-type.enum';
import { LedgerStatus } from '@app/crm/commission-history/ledger-status.enum';

@Component({
    templateUrl: './commission-history.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './commission-history.component.less'
    ],
    animations: [appModuleAnimation()],
    providers: [
        LifecycleSubjectsService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionHistoryComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('commissionDataGrid', { static: false }) commissionDataGrid: DxDataGridComponent;
    @ViewChild('ledgerDataGrid', { static: false }) ledgerDataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbar: ToolBarComponent;

    private readonly commissionDataSourceURI: string = 'Commission';
    private readonly ledgerDataSourceURI: string = 'CommissionLedgerEntry';

    private rootComponent: any;
    private subRouteParams: any;
    private selectedRecords: any = [];
    private bulkUpdateAllowed = this.permission
        .isGranted(AppPermissions.CRMBulkUpdates);

    readonly commissionFields: KeysEnum<CommissionDto> = CommissionFields;
    readonly ledgerFields: KeysEnum<LedgerDto> = LedgerFields;
    rowsViewHeight: number;
    formatting = AppConsts.formatting;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: false,
            action: () => {},
            label: this.l('SomeAction')
        }
    ];

    actionEvent: any;
    actionMenuGroups: ActionMenuGroup[] = [
        {
            key: '',
            visible: true,
            items: []
        }
    ];
    permissions = AppPermissions;
    searchValue: string = this._activatedRoute.snapshot.queryParams.searchValue || '';
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    toolbarConfig: ToolbarGroupModel[];
    private filters: FilterModel[] = this.getFilters();
    odataRequestValues$: Observable<ODataRequestValues> = concat(
        this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom),
        this.filterChanged$.pipe(
            switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
        )
    ).pipe(
        filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues)
    );
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );

    public ledgerDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.ledgerFields.Id,
            url: this.getODataUrl(this.ledgerDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                request.params.$select = DataGridService.getSelectFields(
                    this.ledgerDataGrid,
                    [ this.ledgerFields.Id ]
                );
            }
        })
    });
    public readonly COMMISSION_VIEW = 0;
    public readonly LEDGER_VIEW     = 1;
    selectedViewType = this.COMMISSION_VIEW;
    viewTypes = [{
        value: this.COMMISSION_VIEW,
        text: this.l('Commissions')
    }, {
        value: this.LEDGER_VIEW,
        text: this.l('Ledger')
    }];

    currency$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => settings && settings.currency)
    );

    get dataGrid(): DxDataGridComponent {
        return this.selectedViewType == this.COMMISSION_VIEW ? this.commissionDataGrid : this.ledgerDataGrid;
    }

    get dataSourceURI(): string {
        return this.selectedViewType == this.COMMISSION_VIEW ? this.commissionDataSourceURI : this.ledgerDataSourceURI;
    }

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public appService: AppService,
        private filtersService: FiltersService,
        private invoicesService: InvoicesService,
        private commissionProxy: CommissionServiceProxy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(injector);

        this.dataSource = new DataSource({
            requireTotalCount: true,
            store: new ODataStore({
                key: this.commissionFields.Id,
                url: this.getODataUrl(this.commissionDataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    request.params.$select = DataGridService.getSelectFields(
                        this.commissionDataGrid,
                        [ this.commissionFields.Id ]
                    );
                }
            })
        });
    }

    ngOnInit() {
        this.handleDataGridUpdate();
        this.handleFiltersPining();
        this.activate();
    }

    private handleFiltersPining() {
        this.filtersService.filterFixed$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            skip(1)
        ).subscribe(() => {
            this.repaintDataGrid(1000);
        });
    }

    private handleDataGridUpdate(): void {
        this.listenForUpdate().pipe(skip(1)).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .pipe(takeUntil(this.deactivate$))
                .subscribe(params => {
                    const searchValueChanged = params.searchValue && this.searchValue !== params.searchValue;
                    if (searchValueChanged) {
                        this.searchValue = params.searchValue || '';
                        this.initToolbarConfig();
                        setTimeout(() => this.filtersService.clearAllFilters());
                    }
                    if (params['refresh'] || searchValueChanged) {
                        this.refresh();
                    }
            });
    }

    onContentReady(event) {
        this.finishLoading();
        this.setGridDataLoaded();
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
        this.changeDetectorRef.detectChanges();
    }

    onSelectionChanged($event) {
        this.selectedRecords = $event.component.getSelectedRowsData();
        this.initToolbarConfig();
    }

    refresh() {
        this._refresh.next(null);
    }

    invalidate() {
        this.lifeCycleSubjectsService.activate$.pipe(
            first()
        ).subscribe(() => {
            this.refresh();
        });
    }

    private listenForUpdate() {
        return combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        );
    }

    initFilterConfig(hardUpdate: boolean = false) {
        if (!hardUpdate && this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(
                this.filters = this.getFilters()
            );
        }

        this.filtersService.apply(() => {
            this.initToolbarConfig();
            this.changeDetectorRef.detectChanges();
        });
    }

    private getFilters() {
        return this.selectedViewType === this.COMMISSION_VIEW
            ? [
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'earnedDate',
                    field: this.commissionFields.OrderDate,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'Status',
                    field: this.commissionFields.Status,
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: Object.keys(CommissionStatus).map((status: string) => ({
                                    id: CommissionStatus[status],
                                    name: startCase(status)
                                })),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'Commission',
                    field: this.commissionFields.CommissionAmount,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'ProductAmount',
                    field: this.commissionFields.ProductAmount,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                })
            ]
            : [
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'Type',
                    field: this.ledgerFields.Type,
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: Object.keys(LedgerType).map((type: string) => ({
                                    id: LedgerType[type],
                                    name: startCase(type)
                                })),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'Status',
                    field: this.ledgerFields.Status,
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: Object.keys(LedgerStatus).map((status: string) => ({
                                    id: LedgerStatus[status],
                                    name: startCase(status)
                                })),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'entryDate',
                    field: this.ledgerFields.EntryDate,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'TotalAmount',
                    field: this.ledgerFields.TotalAmount,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
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
                            checkPressed: () => this.filtersService.fixed,
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
                        disabled: true,
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Commissions').toLowerCase(),
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
                        name: 'actions',
                        widget: 'dxDropDownMenu',
                        disabled: !this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
                        options: {
                            items: [
                                {
                                    text: this.l('AddNewEarnings'),
                                    visible: this.selectedViewType == this.LEDGER_VIEW,
                                    action: this.applyEarnings.bind(this)
                                },
                                {
                                    text: this.l('ApproveEarning'),
                                    visible: this.selectedViewType == this.LEDGER_VIEW,
                                    disabled: !this.selectedRecords.length
                                        || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                                        || this.selectedRecords.every(item => item.Status !== LedgerStatus.Pending),
                                    action: this.approveEarnings.bind(this)
                                },
                                {
                                    text: this.l('Cancel'),
                                    action: this.applyCancel.bind(this),
                                    visible: this.selectedViewType == this.COMMISSION_VIEW,
                                    disabled: !this.selectedRecords.length
                                        || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                                        || this.selectedRecords.every(item => item.Status !== CommissionStatus.Pending),
                                }
                            ]
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
        return this.toolbarConfig;
    }

    applyCancel() {
        if (this.selectedRecords.length) {
            this.startLoading();
            this.commissionProxy.cancelCommissions(
                this.selectedRecords.filter(
                    item => item.Status === CommissionStatus.Pending
                ).map(item => item.Id)
            ).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(() => {
                this.notify.success(this.l('SuccessfullyUpdated'));
                this.dataGrid.instance.clearSelection();
                this.selectedRecords = [];
                this.refresh();
            });
        }
    }

    applyEarnings() {
        this.dialog.open(CommissionEarningsDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                bulkUpdateAllowed: this.bulkUpdateAllowed
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    approveEarnings() {
        if (this.selectedRecords.length) {
            this.startLoading();
            this.commissionProxy.approveEarnings(
                this.selectedRecords.filter(
                    item => item.Status === LedgerStatus.Pending
                ).map(item => item.Id)
            ).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(() => {
                this.notify.success(this.l('SuccessfullyUpdated'));
                this.dataGrid.instance.clearSelection();
                this.selectedRecords = [];
                this.refresh();
            });
        }
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.dataGrid);
    }

    repaintDataGrid(delay = 0) {
        if (this.dataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint(), delay);
        }
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource',
                this.selectedViewType == this.LEDGER_VIEW
                    ? this.ledgerDataSource : this.dataSource);
            this.changeDetectorRef.detectChanges();
            this.startLoading();
        } else
            this.setGridDataLoaded();
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this._refresh.next(null);
            this.changeDetectorRef.detectChanges();
        }
    }

    processFilterInternal() {
        if (this.dataGrid && this.dataGrid.instance) {
            this.processODataFilter(
                this.dataGrid.instance,
                this.selectedViewType == this.LEDGER_VIEW ?
                    this.ledgerDataSourceURI : this.commissionDataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom
            );
        }
    }

    onCellClick($event) {
    }

    ngOnDestroy() {
        this.lifeCycleSubjectsService.destroy.next();
        this.deactivate();
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }

    deactivate() {
        super.deactivate();
        this.subRouteParams.unsubscribe();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.hideHostElement();
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe(actionEvent => {
            const client: any = event.data;
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, client);
            this.actionEvent = actionEvent;
            this.changeDetectorRef.detectChanges();
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onViewTypeChanged(event) {
        if (this.selectedViewType != event.value) {
            this.selectedViewType = event.value;
            this.initFilterConfig(true);
            this.setDataGridInstance();
            this.initToolbarConfig();
        }
    }
}