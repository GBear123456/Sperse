/** Core imports */
import { AfterViewInit, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Params } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, concat, forkJoin, Observable, of } from 'rxjs';
import { filter, finalize, first, map, mapTo, pluck, skip, switchMap, takeUntil } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import startCase from 'lodash/startCase';

/** Application imports */
import {
    CrmStore,
    OrganizationUnitsStoreActions,
    OrganizationUnitsStoreSelectors,
    PipelinesStoreSelectors,
    SubscriptionsStoreActions,
    SubscriptionsStoreSelectors
} from '@app/crm/store';
import { ContactGroup } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterMultilineInputComponent } from '@shared/filters/multiline-input/filter-multiline-input.component';
import { FilterMultilineInputModel } from '@shared/filters/multiline-input/filter-multiline-input.model';
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
import { OrderType } from '@app/crm/orders/order-type.enum';
import { SubscriptionsStatus } from '@app/crm/orders/subscriptions-status.enum';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { CrmService } from '../crm.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { FilterSourceComponent } from '@app/crm/shared/filters/source-filter/source-filter.component';
import { SourceFilterModel } from '@app/crm/shared/filters/source-filter/source-filter.model';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { OrderDto } from '@app/crm/orders/order-dto';
import { SubscriptionDto } from '@app/crm/orders/subcription-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderFields } from '@app/crm/orders/order-fields.enum';
import { SubscriptionFields } from '@app/crm/orders/subscription-fields.enum';
import { ContactsHelper } from '@root/shared/crm/helpers/contacts-helper';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { OrderStageSummary } from '@app/crm/orders/order-stage-summary.interface';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    providers: [ OrderServiceProxy, CurrencyPipe ]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('ordersGrid', { static: false }) ordersGrid: DxDataGridComponent;
    @ViewChild('subscriptionsGrid', { static: false }) subscriptionsGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent, { static: false }) pipelineComponent: PipelineComponent;
    @ViewChild(StaticListComponent, { static: false }) stagesComponent: StaticListComponent;
    @ViewChild(PivotGridComponent, { static: false }) pivotGridComponent: PivotGridComponent;
    items: any;
    showOrdersPipeline = true;
    pipelineDataSource: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;
    stages = [];
    selectedOrderKeys = [];
    rowsViewHeight: number;
    private exportCallback: Function;
    private _selectedOrders: any;
    get selectedOrders() {
        return this._selectedOrders || [];
    }
    set selectedOrders(orders) {
        this._selectedOrders = orders;
        this.selectedOrderKeys = orders.map((item) => item.Id);
        this.initOrdersToolbarConfig();
    }

    manageDisabled = !this.isGranted(AppPermissions.CRMOrdersManage);
    filterModelStages: FilterModel;
    layoutTypes = DataLayoutType;
    private rootComponent: any;
    private ordersDataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    public subscriptionsDataLayoutType: DataLayoutType = DataLayoutType.DataGrid;
    private readonly ordersDataSourceURI = 'Order';
    private readonly subscriptionsDataSourceURI = 'Subscription';
    private filters: FilterModel[];
    private subscriptionStatusFilter = this.getSubscriptionsFilter('SubscriptionStatus');
    public selectedOrderType: BehaviorSubject<OrderType> = new BehaviorSubject(+(this._activatedRoute.snapshot.queryParams.orderType || OrderType.Order));
    public selectedContactGroup: BehaviorSubject<ContactGroup> = new BehaviorSubject(this._activatedRoute.snapshot.queryParams.contactGroup || undefined);
    selectedOrderType$: Observable<OrderType> = this.selectedOrderType.asObservable();
    selectedContactGroup$: Observable<ContactGroup> = this.selectedContactGroup.asObservable();
    contactGroupDataSource = Object.keys(ContactGroup).filter(
        (group: string) => this.permission.checkCGPermission(ContactGroup[group], '')
    ).map((group: string) => ({
        id: ContactGroup[group],
        name: this.l('ContactGroup_' + group)
    }));
    private contactGroupFilter: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'ContactGroup',
        field: 'ContactGroupId',
        hidden: true,
        items: {
            ContactGroupId: new FilterCheckBoxesModel({
                selectedKeys$: this.selectedContactGroup$,
                dataSource: this.contactGroupDataSource,
                nameField: 'name',
                keyExpr: 'id'
            }),
        }
    });
    private sourceFilter: FilterModel = new FilterModel({
        component: FilterSourceComponent,
        caption: 'Source',
        hidden: this.appSession.userIsMember,
        items: {
            element: new SourceFilterModel({
                ls: this.localizationService
            })
        }
    });
    private ordersFilters: FilterModel[] = [
        this.contactGroupFilter,
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'creation',
            field: 'OrderDate',
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
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
                    }),
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'Amount',
            field: 'Amount',
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        }),
        this.subscriptionStatusFilter,
        this.getSourceOrganizationUnitFilter(),
        this.sourceFilter,
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'email',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'Email',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Email'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'xref',
            hidden: this.appSession.userIsMember,
            filterMethod: this.filtersService.filterByMultiline,
            field: 'ContactXref',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'xref'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'affiliateCode',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'PersonalAffiliateCode',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'AffiliateCode'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'phone',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'Phone',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Phone',
                    normalize: FilterHelpers.normalizePhone
                })
            }
        })
    ];
    private subscriptionsFilters: FilterModel[] = [
        this.contactGroupFilter,
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'ContactDate',
            field: 'ContactDate',
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'StartDate',
            field: 'StartDate',
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCalendarComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'EndDate',
            field: 'EndDate',
            items: { from: new FilterItemModel(), to: new FilterItemModel() },
            options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
        }),
        new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Status',
            field: 'StatusId',
            isSelected: true,
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource: Object.keys(SubscriptionsStatus).map((status: string) => ({
                            id: SubscriptionsStatus[status],
                            name: startCase(status)
                        })),
                        value: [ SubscriptionsStatus.CurrentActive ],
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        }),
        new FilterModel({
            component: FilterInputsComponent,
            operator: { from: 'ge', to: 'le' },
            caption: 'Fee',
            field: 'Fee',
            items: { from: new FilterItemModel(), to: new FilterItemModel() }
        }),
        this.getSubscriptionsFilter('Subscription'),
        this.getSourceOrganizationUnitFilter(),
        this.sourceFilter,
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'email',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'EmailAddress',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Email'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'xref',
            hidden: this.appSession.userIsMember,
            filterMethod: this.filtersService.filterByMultiline,
            field: 'ContactXref',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'xref'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'affiliateCode',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'PersonalAffiliateCode',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'AffiliateCode'
                })
            }
        }),
        new FilterModel({
            component: FilterMultilineInputComponent,
            caption: 'phone',
            filterMethod: this.filtersService.filterByMultiline,
            field: 'PhoneNumber',
            items: {
                element: new FilterMultilineInputModel({
                    ls: this.localizationService,
                    name: 'Phone',
                    normalize: FilterHelpers.normalizePhone
                })
            }
        })
    ];
    private filterChanged = false;
    masks = AppConsts.masks;
    private formatting = AppConsts.formatting;
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.isGranted(AppPermissions.CRMOrdersInvoicesManage),
            action: this.createInvoice.bind(this),
            label: this.l('CreateInvoice')
        }
    ];
    permissions = AppPermissions;
    currency: string;
    totalCount: number;
    ordersToolbarConfig: ToolbarGroupModel[];
    subscriptionsToolbarConfig: ToolbarGroupModel[];
    orderTypesEnum = OrderType;
    readonly orderFields: KeysEnum<OrderDto> = OrderFields;
    readonly subscriptionFields: KeysEnum<SubscriptionDto> = SubscriptionFields;
    searchValue = this._activatedRoute.snapshot.queryParams.searchValue || '';
    searchClear = false;
    ordersDataSource: any = {
        uri: this.ordersDataSourceURI,
        requireTotalCount: true,
        store: {
            type: 'odata',
            key: this.orderFields.Id,
            url: this.getODataUrl(this.ordersDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(
                    this.ordersGrid,
                    [
                        this.orderFields.Id,
                        this.orderFields.LeadId,
                        this.orderFields.ContactId,
                        this.orderFields.ContactGroupId
                    ]
                );
            }
        }
    };
    subscriptionsDataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: this.subscriptionFields.Id,
            url: this.getODataUrl(this.subscriptionsDataSourceURI),
            version: AppConsts.ODataVersion,
            deserializeDates: false,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.params.$select = DataGridService.getSelectFields(
                    this.subscriptionsGrid,
                    [
                        this.subscriptionFields.Id,
                        this.subscriptionFields.LeadId,
                        this.subscriptionFields.ContactId,
                        this.subscriptionFields.ContactGroupId
                    ]
                );
            }
        })
    });
    sliceStorageKey = 'CRM_Subscriptions_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    subscriptionGroupDataSourceURI = 'SubscriptionSlice';
    pivotGridDataIsLoading: boolean;
    private refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this.refresh.asObservable();
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    oDataRequestValues$: Observable<ODataRequestValues> = this.getODataRequestValues();
    private search: BehaviorSubject<string> = new BehaviorSubject<string>(this.searchValue);
    search$: Observable<string> = this.search.asObservable();
    private subscriptionsPivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;
            return this.crmService.loadSlicePivotGridData(
                this.getODataUrl(this.subscriptionGroupDataSourceURI),
                this.filters,
                loadOptions
            );
        },
        onChanged: () => {
            this.pivotGridDataIsLoading = false;
        },
        fields: [
            {
                area: 'row',
                dataField: 'ServiceType',
                name: 'serviceType',
                expanded: true,
                sortBy: 'displayText'
            },
            {
                dataType: 'number',
                area: 'data',
                summaryType: 'count',
                name: 'count',
                isMeasure: true
            },
            {
                dataType: 'number',
                area: 'data',
                summaryType: 'sum',
                name: 'fee',
                dataField: 'Fee',
                format: 'currency',
                isMeasure: true
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                showTotals: false
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'quarter',
                showTotals: false,
            },
            {
                area: 'column',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'StartDate',
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'ContactStatusName'
            },
            {
                area: 'filter',
                dataField: 'FirstName'
            },
            {
                area: 'filter',
                dataField: 'LastName'
            },
            {
                area: 'filter',
                dataField: 'Zip'
            },
            {
                area: 'filter',
                dataField: 'SourceAffiliateCode'
            },
            {
                area: 'filter',
                dataField: 'CountryCode'
            },
            {
                area: 'filter',
                dataField: 'StateName'
            },
            {
                area: 'filter',
                dataField: 'City'
            }
        ]
    };
    ordersSum: number;
    ordersSummary$: Observable<OrderStageSummary> = combineLatest(
        this.oDataRequestValues$,
        this.search$,
        this.refresh$
    ).pipe(
        filter(() => this.ordersDataLayoutType == DataLayoutType.DataGrid),
        takeUntil(this.destroy$),
        switchMap(this.waitUntil(OrderType.Order)),
        map(([oDataRequestValues, ]: [ODataRequestValues, null]) => {
            return this.getODataUrl('OrderCount', oDataRequestValues.filter, null,
                [...this.getSubscriptionsParams(), ...oDataRequestValues.params]);
        }),
        filter((totalUrl: string) => this.oDataService.requestLengthIsValid(totalUrl)),
        switchMap((totalUrl: string) => {
            return this.http.get(
                totalUrl,
                {
                    headers: new HttpHeaders({
                        'Authorization': 'Bearer ' + abp.auth.getToken()
                    })
                }
            );
        }),
        map((summaryData: { [stageId: string]: OrderStageSummary }) => {
            return Object.values(summaryData).reduce((summary: OrderStageSummary, stageSummary: OrderStageSummary) => {
                summary.count += stageSummary.count;
                summary.sum += stageSummary.sum;
                return summary;
            }, { count: 0, sum: 0 });
        })
    );
    subscriptionsTotalFee: number;
    subscriptionsTotalOrderAmount: number;
    subscriptionsSummary$: Observable<any> = combineLatest(
        this.oDataRequestValues$,
        this.search$,
        this.refresh$
    ).pipe(
        takeUntil(this.destroy$),
        switchMap(this.waitUntil(OrderType.Subscription)),
        map(([oDataRequestValues, ]: [ODataRequestValues, null]) => {
            return this.getODataUrl(
                'SubscriptionSlice',
                oDataRequestValues.filter,
                null,
                [
                    ...oDataRequestValues.params,
                    {
                        name: 'totalSummary',
                        value: JSON.stringify([
                            { 'summaryType': 'count' },
                            { 'selector': 'OrderAmount', 'summaryType': 'sum'},
                            { 'selector': 'Fee', 'summaryType': 'sum' }
                        ])
                    }
                ]
            );
        }),
        filter((totalUrl: string) => this.oDataService.requestLengthIsValid(totalUrl)),
        switchMap((subscriptionSummaryUrl: string) => this.http.get(
            subscriptionSummaryUrl,
            {
                headers: new HttpHeaders({
                    'Authorization': 'Bearer ' + abp.auth.getToken()
                })
            }
        )),
    );
    private _activate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private activate$: Observable<boolean> = this._activate.asObservable();
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );

    constructor(injector: Injector,
        private orderProxy: OrderServiceProxy,
        private invoicesService: InvoicesService,
        private contactsService: ContactsService,
        private filtersService: FiltersService,
        private pipelineService: PipelineService,
        private itemDetailsService: ItemDetailsService,
        private store$: Store<CrmStore.State>,
        private cacheService: CacheService,
        private sessionService: AppSessionService,
        private crmService: CrmService,
        private currencyPipe: CurrencyPipe,
        private http: HttpClient,
        public appService: AppService,
        public dialog: MatDialog,
    ) {
        super(injector);
        invoicesService.settings$.subscribe(res => this.currency = res.currency);
        this._activatedRoute.queryParams.pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated),
            pluck('refresh'),
            filter(Boolean)
        ).subscribe(() => this.invalidate());
        this.selectedOrderType.value === OrderType.Order
            ? this.initOrdersToolbarConfig()
            : this.initSubscriptionsToolbarConfig();
    }

    ngOnInit() {
        this.activate();
        this.handleFiltersPining();
        this.ordersSummary$.subscribe((ordersSummary: OrderStageSummary) => {
            this.ordersSum = ordersSummary.sum;
            this.totalCount = ordersSummary.count;
        });
        this.subscriptionsSummary$.subscribe((data) => {
            this.totalCount = data.summary[0];
            this.subscriptionsTotalOrderAmount = data.summary[1];
            this.subscriptionsTotalFee = data.summary[2];
            if (this.subscriptionsGrid) {
                this.subscriptionsGrid.instance.repaint();
            }
        });
        this.selectedOrderType$.pipe(
            skip(1),
            takeUntil(this.destroy$)
        ).subscribe((selectedOrderType: OrderType) => {
            this.changeOrderType(selectedOrderType);
        });
    }

    customizeTotal = () => this.totalCount !== undefined ? this.l('Count') + ': ' + this.totalCount : '';
    customizeOrdersSum = () => this.customizeAmountSummary({ value: this.ordersSum });
    customizeSubscriptionsTotalFee = () => this.customizeAmountSummary({ value: this.subscriptionsTotalFee });
    customizeSubscriptionsTotalAmount = () => this.customizeAmountSummary({ value: this.subscriptionsTotalOrderAmount });

    private handleQueryParams() {
        this.queryParams$.pipe(
            skip(1),
            /** Wait for activation to update the filters */
            switchMap((queryParams: Params) => this.activate$.pipe(
                filter(Boolean),
                mapTo(queryParams))
            )
        ).subscribe((params: Params) => {
            if (params.searchValue && this.searchValue !== params.searchValue) {
                this.searchValue = params.searchValue;
                if (this.selectedOrderType.value == OrderType.Order)
                    this.initOrdersToolbarConfig();
                else
                    this.initSubscriptionsToolbarConfig();
                this.invalidate();
            }
            if (params.orderType && this.selectedOrderType.value !== (+params.orderType)) {
                this.searchClear = false;
                this.selectedOrderType.next(+params.orderType);
            }
        });
    }

    activate() {
        super.activate();
        this.handleQueryParams();
        this.initFilterConfig();
        this.subscribeToFilter();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.showHostElement(() => {
            this.pipelineComponent.detectChanges();
        });
        this._activate.next(true);
    }

    get dataGrid() {
        return this.selectedOrderType.value === OrderType.Order ? this.ordersGrid : this.subscriptionsGrid;
    }

    get dataSource() {
        return this.selectedOrderType.value === OrderType.Order ? this.ordersDataSource : this.subscriptionsDataSource;
    }

    get showToggleColumnSelectorButton() {
        return (this.selectedOrderType.value === OrderType.Order && this.ordersDataLayoutType === DataLayoutType.DataGrid)
        || this.selectedOrderType.value === OrderType.Subscription;
    }

    getODataRequestValues() {
        return concat(
            this.oDataService.getODataFilter(this.filters, this.getCheckCustomFilter.bind(this)).pipe(first()),
            this.filterChanged$.pipe(
                switchMap(() => this.oDataService.getODataFilter(this.filters, this.getCheckCustomFilter.bind(this)))
            ),
        ).pipe(
            filter((oDataRequestValues: ODataRequestValues) => !!oDataRequestValues),
        );
    }

    private waitUntil(orderType: OrderType) {
        return (data) => this.selectedOrderType.value === orderType ? of(data) : this.selectedOrderType$.pipe(
            filter((dataOrderType: OrderType) => dataOrderType === orderType),
            first(),
            mapTo(data)
        );
    }

    private handleFiltersPining() {
        this.filtersService.filterFixed$.pipe(
            takeUntil(this.destroy$),
            skip(1)
        ).subscribe(() => {
            if (this.pivotGridComponent) {
                setTimeout(() => {
                    this.pivotGridComponent.dataGrid.instance.updateDimensions();
                    this.pivotGridComponent.updateTotalCellsSizes();
                }, 1001);
            }
        });
    }

    private getSubscriptionsFilter(caption: string) {
        return new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: caption,
            field: 'ServiceTypeId',
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource$: this.store$.pipe(select(SubscriptionsStoreSelectors.getSubscriptions)),
                        dispatch: () => this.store$.dispatch(new SubscriptionsStoreActions.LoadRequestAction(false)),
                        nameField: 'name',
                        keyExpr: 'id'
                    })
            }
        });
    }

    private getSourceOrganizationUnitFilter() {
        return new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'SourceOrganizationUnitId',
            hidden: this.appSession.userIsMember,
            field: 'SourceOrganizationUnitId',
            items: {
                element: new FilterCheckBoxesModel(
                    {
                        dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                        dispatch: () => this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false)),
                        nameField: 'displayName',
                        keyExpr: 'id'
                    })
            }
        });
    }

    initOrdersToolbarConfig() {
        this.ordersToolbarConfig = [
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
                    disabled: this.manageDisabled || !this.selectedOrderKeys.length ||
                        (!this.isGranted(AppPermissions.CRMBulkUpdates) && this.selectedOrderKeys.length > 1),
                    action: this.deleteOrders.bind(this)
                }]
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
                            items: [
                                {
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToXLS.bind(this)),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToCSV.bind(this)),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportData.bind(this, this.exportToGoogleSheet.bind(this)),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.showOrdersPipeline ||
                                        (this.ordersDataLayoutType === DataLayoutType.DataGrid)
                                }
                            ]
                        }
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
                    //     action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.Box),
                    //     options: {
                    //         checkPressed: () => {
                    //             return (this.ordersDataLayoutType == DataLayoutType.Box);
                    //         },
                    //     }
                    // },
                    {
                        name: 'pipeline',
                        action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => {
                                return this.ordersDataLayoutType === DataLayoutType.Pipeline;
                            }
                        }
                    },
                    {
                        name: 'dataGrid',
                        action: this.toggleOrdersDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => {
                                return this.ordersDataLayoutType === DataLayoutType.DataGrid;
                            }
                        }
                    }
                ]
            }
        ];
    }

    private initSubscriptionsToolbarConfig() {
        this.subscriptionsToolbarConfig = this.getSubscriptionsToolbarConfig();
    }

    private getSubscriptionsToolbarConfig(): ToolbarGroupModel[] {
        return [
            {
                location: 'before',
                items: [
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
                            placeholder: this.l('Search') + ' ' + this.l('Subscriptions').toLowerCase(),
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
                        name: 'dataGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleSubscriptionsDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => {
                                return (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid);
                            }
                        }
                    },
                    {
                        name: 'pivotGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleSubscriptionsDataLayout.bind(this, DataLayoutType.PivotGrid),
                        options: {
                            checkPressed: () => {
                                return (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid);
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
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: (options) => {
                                        if (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid) {
                                            this.pivotGridComponent.dataGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'Subscriptions_PivotGrid')
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
                                        } else if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid) {
                                            this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                            this.exportToXLS(options);
                                        }
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                        this.exportToCSV(options);
                                    },
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                },
                                {
                                    action: (options) => {
                                        this.dataGrid.instance.option('export.fileName', this.l('Subscriptions'));
                                        this.exportToGoogleSheet(options);
                                    },
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.subscriptionsDataLayoutType === DataLayoutType.DataGrid
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    exportPipelineSelectedItemsFilter(dataSource) {
        let selectedCards = this.pipelineComponent.getSelectedEntities();
        if (selectedCards.length) {
            dataSource.filter(selectedCards.map(card => {
                return ['Id', '=', card.Id];
            }).reduce((r, a) => r.concat([a, 'or']), []));
        }
        return selectedCards.length;
    }

    exportData(callback, options) {
        this.startLoading(true);
        if (this.showOrdersPipeline) {
            let importOption = 'all',
                instance = this.dataGrid.instance,
                dataSource: any = instance && instance.getDataSource(),
                checkExportOption = (dataSource, ignoreFilter = false) => {
                    if (options == importOption)
                        ignoreFilter || this.processFilterInternal();
                    else if (!this.exportPipelineSelectedItemsFilter(dataSource))
                        importOption = options;
                };

            if (dataSource) {
                checkExportOption(dataSource, true);
                callback(importOption).then(
                    () => dataSource.filter(null));
            } else {
                instance.option('dataSource',
                    dataSource = new DataSource(this.dataSource)
                );
                checkExportOption(dataSource);
                this.exportCallback = () => {
                    this.exportCallback = null;
                    callback(importOption).then(
                        () => dataSource.filter(null));
                };
            }
        } else {
            callback(options);
        }
    }

    toggleColumnChooser() {
        if (this.selectedOrderType.value === OrderType.Subscription
            && this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid) {
            this.pivotGridComponent.toggleFieldPanel();
        } else {
            DataGridService.showColumnChooser(this.dataGrid);
        }
    }

    customizeAmountCell = (cellInfo) => {
        return this.currencyPipe.transform(cellInfo.value, this.currency, 'symbol', '1.2-2');
    }

    customizeAmountSummary = (cellInfo) => {
        return cellInfo.value !== undefined ? this.l('Sum') + ': ' + this.customizeAmountCell(cellInfo) : '';
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
    }

    ngAfterViewInit(): void {
        this.initDataSource();
    }

    initDataSource() {
        if (this.selectedOrderType.value === OrderType.Order) {
            if (this.showOrdersPipeline) {
                if (!this.pipelineDataSource)
                    setTimeout(() => this.pipelineDataSource = this.ordersDataSource);
            } else
                this.setDataGridInstance(this.dataGrid);
        } else if (this.selectedOrderType.value === OrderType.Subscription) {
            if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid) {
                this.setDataGridInstance(this.dataGrid);
            } else if (this.subscriptionsDataLayoutType === DataLayoutType.PivotGrid) {
                this.setPivotGridInstance();
            }
        }
    }

    setDataGridInstance(dataGrid: DxDataGridComponent) {
        let instance = dataGrid && dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
        } else
            this.setGridDataLoaded();
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance;
        CrmService.setDataSourceToComponent(this.subscriptionsPivotGridDataSource, pivotGridInstance);
    }

    onContentReady(event) {
        if (this.exportCallback)
            this.exportCallback();
        else {
            this.setGridDataLoaded();
            if (!this.rowsViewHeight)
                this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();
            event.component.columnOption('command:edit', {
                visibleIndex: -1,
                width: 40
            });
        }
    }

    invalidate() {
        this.selectedOrders = [];
        this.processFilterInternal();
        this.refresh.next(null);
        this.filterChanged = true;
    }

    toggleOrdersDataLayout(dataLayoutType: DataLayoutType) {
        this.showOrdersPipeline = dataLayoutType == DataLayoutType.Pipeline;
        this.ordersDataLayoutType = dataLayoutType;
        this.initDataSource();
        this.initOrdersToolbarConfig();
        if (this.showOrdersPipeline)
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

    toggleSubscriptionsDataLayout(dataLayouType: DataLayoutType) {
        this.subscriptionsDataLayoutType = dataLayouType;
        this.initDataSource();
        this.initSubscriptionsToolbarConfig();
        if (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid)
            this.dataGrid.instance.deselectAll();

        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => this.processFilterInternal());
        }
    }

    initFilterConfig(hardUpdate: boolean = false): void {
        if (!hardUpdate && this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(this.filters = this.selectedOrderType.value === OrderType.Order
                ? this.ordersFilters
                : this.subscriptionsFilters
            );
        }
    }

    subscribeToFilter() {
        this.filtersService.apply(filters => {
            this.selectedOrderKeys = [];
            this.filterChanged = true;
            this.processFilterInternal();
        });
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
        let grid = this.selectedOrderType.value === OrderType.Order
            ? this.ordersGrid
            : (this.subscriptionsDataLayoutType === DataLayoutType.DataGrid ? this.subscriptionsGrid : this.pivotGridComponent.dataGrid);
        if (this.selectedOrderType.value === OrderType.Order && this.showOrdersPipeline && this.pipelineComponent) {
            context = this.pipelineComponent;
            context.searchColumns = this.searchColumns;
            context.searchValue = this.searchValue;
        } else if (!grid)
            return ;

        context.processODataFilter.call(
            context,
            grid.instance,
            this.selectedOrderType.value === OrderType.Order ? this.ordersDataSourceURI : this.subscriptionsDataSourceURI,
            this.filters,
            this.getCheckCustomFilter.bind(this),
            null,
            this.getSubscriptionsParams()
        );
    }

    private getCheckCustomFilter(filter: FilterModel) {
         if (this.selectedOrderType.value == OrderType.Subscription && filter.caption == 'Status')
            return FilterHelpers.filterBySubscriptionStatus(filter);
         else
            return this.filtersService.getCheckCustom(filter);
    }

    private getSubscriptionsParams() {
        let value = this.subscriptionStatusFilter.items.element.value;
        return value && value.map(item => ({
            name: 'serviceTypeIds',
            value: item
        }));
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.search.next(e['value']);
            this.processFilterInternal();
        }
    }

    onStagesLoaded($event) {
        this.stages = $event.stages.map((stage) => {
            return {
                id: this.pipelineService.getPipeline(
                    this.pipelinePurposeId, null).id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name,
            };
        });
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCellClick(event, section = 'invoices') {
        let col = event.column;
        if (col && col.command)
            return;

        this.onCardClick({
            entity: event.data,
            entityStageDataSource: this.dataGrid.instance.getDataSource(),
            loadMethod: null,
            section: section
        });
    }

    onCardClick({entity, entityStageDataSource, loadMethod, section = 'invoices'}: {
        entity: OrderDto | SubscriptionDto,
        entityStageDataSource: any,
        loadMethod: () => any,
        section: string
    }) {
        if (entity && entity.ContactId) {
            let isOrder = this.selectedOrderType.value === OrderType.Order;
            this.searchClear = false;
            this._router.navigate(
                CrmService.getEntityDetailsLink(entity.ContactId, section, entity.LeadId),
                {
                    queryParams: {
                        ...(isOrder ? {orderId: entity.Id} : {subId: entity.Id}),
                        referrer: 'app/crm/orders',
                        dataLayoutType: DataLayoutType.Pipeline
                    }
                }
            );
            if (entityStageDataSource)
                this.itemDetailsService.setItemsSource(isOrder ? ItemTypeEnum.Order :
                    ItemTypeEnum.Subscription, entityStageDataSource, loadMethod);
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

    onOrderStageChanged(order: OrderDto) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.getVisibleRows().some((row) => {
                const orderData: OrderDto = row.data;
                if (order.Id == orderData.Id) {
                    orderData.Stage = order.Stage;
                    orderData.StageId = order.StageId;
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
                $event.name,
                null
            ).subscribe((declinedList) => {
                this.filterChanged = true;
                if (this.showOrdersPipeline)
                    this.pipelineComponent.refresh();
                else {
                    let gridInstance = this.dataGrid && this.dataGrid.instance;
                    if (gridInstance && declinedList && declinedList.length)
                        gridInstance.selectRows(declinedList.map(item => item.Id), false);
                    else
                        gridInstance.clearSelection();
                }
                if (!declinedList.length) {
                    this.notify.success(this.l('StageSuccessfullyUpdated'));
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
        ContactsHelper.showConfirmMessage(
            this.l('OrdersDeleteWarningMessage'),
            (isConfirmed: boolean, [ forceDelete ]: boolean[]) => {
                if (isConfirmed) {
                    this.deleteOrdersInternal(forceDelete);
                }
            },
            [{ text: this.l('ForceDelete'), visible: this.permission.isGranted(AppPermissions.CRMForceDeleteEntites)}]
        );
    }

    private deleteOrdersInternal(forceDelete: boolean) {
        this.startLoading();
        forkJoin(
            this.selectedOrderKeys.map((v) => this.orderProxy.delete(v, forceDelete))
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();
            this.dataGrid.instance.deselectAll();
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.filterChanged = true;
        });
    }

    onOrderTypeChanged(event) {
        if (event.value != this.selectedOrderType.value) {
            this.searchClear = true;
            this.selectedOrderType.next(event.value);
        }
    }

    onContactGroupChanged(event) {
        if (event.itemData.value != this.selectedContactGroup.value) {
            this.selectedContactGroup.next(event.itemData.value);
            this.filtersService.change([this.contactGroupFilter]);
        }
    }

    private changeOrderType(orderType: OrderType) {
        this.totalCount = undefined;
        if (this.searchClear) {
            this.searchValue = '';
            this.search.next(this.searchValue);
        }
        this.filterChanged = true;
        this.initFilterConfig(true);
        if (orderType == OrderType.Order)
            this.initOrdersToolbarConfig();
        else
            this.initSubscriptionsToolbarConfig();
        setTimeout(() => {
            this.initDataSource();
            this.processFilterInternal();
        });
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        this.hideHostElement();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}