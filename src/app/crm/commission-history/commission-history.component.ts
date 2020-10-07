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
import { finalize, first, filter, switchMap, takeUntil, skip, map } from 'rxjs/operators';

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
import { InvoiceSettings, CommissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommissionErningsDialogComponent } from '@app/crm/commission-history/commission-ernings-dialog/commission-ernings-dialog.component';

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
    @ViewChild('commisionDataGrid', { static: false }) commisionDataGrid: DxDataGridComponent;
    @ViewChild('ledgerDataGrid', { static: false }) ledgerDataGrid: DxDataGridComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbar: ToolBarComponent;

    private readonly commissionDataSourceURI: string = 'Commission';
    private readonly ledgerDataSourceURI: string = 'CommissionLedgerEntry';

    private rootComponent: any;
    private subRouteParams: any;
    private selectedRecords: any = [];
    private bulkUpdateAllowed = this.permission
        .isGranted(AppPermissions.CRMBulkUpdates);

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
            key: 'Id',
            url: this.getODataUrl(this.ledgerDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
            }
        })
    });
    public readonly COMMISION_VIEW = 0;
    public readonly LEDGER_VIEW    = 1;
    selectedViewType = this.COMMISION_VIEW;
    viewTypes = [{
        value: this.COMMISION_VIEW,
        text: this.l('Commissions')
    }, {
        value: this.LEDGER_VIEW,
        text: this.l('Ledger')
    }];

    currency$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => settings && settings.currency)
    );

    get dataGrid(): DxDataGridComponent {
        return this.selectedViewType == this.COMMISION_VIEW ?
            this.commisionDataGrid : this.ledgerDataGrid;
    }

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        public appService: AppService,
        private filtersService: FiltersService,
        private invoicesService: InvoicesService,
        private changeDetectorRef: ChangeDetectorRef,
        private commissionProxy: CommissionServiceProxy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
    ) {
        super(injector);

        this.dataSource = new DataSource({
            requireTotalCount: true,
            store: new ODataStore({
                key: 'Id',
                url: this.getODataUrl(this.commissionDataSourceURI),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
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
        return [ ];
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        disabled: true,
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
                            placeholder: this.l('Search') + ' ' + this.l('Customers').toLowerCase(),
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
                                    disabled: this.selectedRecords.length > 1 && !this.bulkUpdateAllowed,
                                    action: this.applyEarnings.bind(this)
                                },
                                {
                                    text: this.l('Cancel'),
                                    action: this.applyCancel.bind(this),
                                    visible: this.selectedViewType == this.COMMISION_VIEW,
                                    disabled: !this.selectedRecords.length
                                        || this.selectedRecords.length > 1 && !this.bulkUpdateAllowed
                                        || this.selectedRecords.every(item => item.Status !== 'Pending'),
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
                    item => item.Status === 'Pending'
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
        this.dialog.open(CommissionErningsDialogComponent, {
            disableClose: true,
            closeOnNavigation: false,
            data: {
                bulkUpdateAllowed: this.bulkUpdateAllowed
            }
        }).afterClosed().subscribe(() => this.refresh());
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
            this.setDataGridInstance();
            this.initToolbarConfig();
        }
    }
}