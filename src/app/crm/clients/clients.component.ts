/** Core imports */
import {
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, merge, Observable, of, Subscription } from 'rxjs';
import {
    filter,
    finalize,
    first,
    map,
    mapTo,
    pluck,
    publishReplay,
    refCount,
    skip,
    startWith,
    switchMap,
    takeUntil,
    tap
} from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import {
    AppStore,
    ContactAssignedUsersStoreSelectors,
    ListsStoreSelectors,
    RatingsStoreSelectors,
    StarsStoreSelectors,
    StatusesStoreSelectors,
    TagsStoreSelectors
} from '@app/store';
import { ClientService } from '@app/crm/clients/clients.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactStatus } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../shared/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterStatesComponent } from '@shared/filters/states/filter-states.component';
import { FilterStatesModel } from '@shared/filters/states/filter-states.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';
import {
    ContactEmailServiceProxy,
    ContactServiceProxy,
    ContactStatusDto,
    CreateContactEmailInput,
    OrganizationUnitDto,
    ServiceTypeInfo
} from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { EditContactDialog } from '../contacts/edit-contact-dialog/edit-contact-dialog.component';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { AppPermissions } from '@shared/AppPermissions';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import {
    OrganizationUnitsStoreActions,
    OrganizationUnitsStoreSelectors,
    SubscriptionsStoreActions,
    SubscriptionsStoreSelectors
} from '@app/crm/store';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { CrmService } from '@app/crm/crm.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { SubscriptionsFilterComponent } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';

@Component({
    templateUrl: './clients.component.html',
    styleUrls: [
        '../shared/styles/client-status.less',
        './clients.component.less'
    ],
    animations: [appModuleAnimation()],
    providers: [
        ClientService,
        ContactServiceProxy,
        MapService,
        LifecycleSubjectsService,
        ImpersonationService
    ],
    //changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent, { static: false }) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, { static: false }) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent, { static: false }) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent, { static: false }) statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent, { static: false }) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent, { static: true }) chartComponent: ChartComponent;
    @ViewChild(MapComponent, { static: false }) mapComponent: MapComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbar: ToolBarComponent;

    private readonly MENU_LOGIN_INDEX = 1;
    private readonly dataSourceURI: string = 'Contact';
    private readonly totalDataSourceURI: string = 'Contact/$count';
    private readonly groupDataSourceURI: string = 'CustomerSlice';
    private readonly dateField = 'ContactDate';
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;
    private organizationUnits: OrganizationUnitDto[];

    formatting = AppConsts.formatting;
    statuses$: Observable<ContactStatusDto[]> = this.store$.pipe(select(StatusesStoreSelectors.getStatuses));
    assignedUsersSelector = select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: ContactGroup.Client });
    filterModelLists: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'List',
        field: 'ListId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(ListsStoreSelectors.getStoredLists)),
                    nameField: 'name',
                    keyExpr: 'id'
                })
        }
    });
    filterModelTags: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'Tag',
        field: 'TagId',
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.store$.pipe(select(TagsStoreSelectors.getStoredTags)),
                nameField: 'name',
                keyExpr: 'id'
            })
        }
    });
    filterModelAssignment: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'assignedUser',
        field: 'AssignedUserId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(this.assignedUsersSelector),
                    nameField: 'name',
                    keyExpr: 'id'
                })
        }
    });
    filterModelStatus: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'status',
        filterMethod: FilterHelpers.filterByCustomerStatus,
        field: 'StatusId',
        isSelected: true,
        items: {
            element: new FilterCheckBoxesModel({
                dataSource$: this.statuses$,
                nameField: 'name',
                keyExpr: 'id',
                selectedKeys$: of(['A'])
            })
        }
    });
    filterModelRating: FilterModel = new FilterModel({
        component: FilterRangeComponent,
        operator: { from: 'ge', to: 'le' },
        caption: 'Rating',
        field: 'Rating',
        items$: this.store$.pipe(select(RatingsStoreSelectors.getRatingItems))
    });
    filterModelStar: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'Star',
        field: 'StarId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(StarsStoreSelectors.getStars)),
                    nameField: 'name',
                    keyExpr: 'id',
                    templateFunc: (itemData) => {
                        return `<div class="star-item">
                                    <span class="star star-${itemData.colorType.toLowerCase()}"></span>
                                    <span>${this.l(itemData.name)}</span>
                                </div>`;
                    }
                })
        }
    });
    contactStatus = ContactStatus;
    selectedClientKeys: any = [];
    headlineButtons: HeadlineButton[] = [
        {
            enabled: this.contactService.checkCGPermission(ContactGroup.Client),
            action: this.createClient.bind(this),
            label: this.l('CreateNewCustomer')
        }
    ];

    actionEvent: any;
    actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('Edit'),
            class: 'edit',
            visible: true,
            action: () => this.showClientDetails(this.actionEvent)
        },
        {
            text: this.l('LoginAsThisUser'),
            class: 'login',
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            action: () => this.impersonationService.impersonate(this.actionEvent.UserId, this.appSession.tenantId)
        }
    ];
    permissions = AppPermissions;
    pivotGridDataIsLoading: boolean;
    private pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;
            return this.crmService.loadSlicePivotGridData(
                this.getODataUrl(this.groupDataSourceURI),
                this.filters,
                loadOptions,
                /** @todo change to strict typing and handle typescript error */
                this.subscriptionStatusFilter.items.element['getObjectValue']()
            );
        },
        onChanged: () => {
            this.pivotGridDataIsLoading = false;
        },
        fields: [
            {
                area: 'row',
                dataField: 'Country',
                name: 'country',
                expanded: true,
                sortBy: 'displayText'
            },
            {
                area: 'row',
                dataField: 'State',
                name: 'state',
                sortBy: 'displayText'
            },
            {
                area: 'row',
                dataField: 'City',
                name: 'city',
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
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                showTotals: false
            },
            {
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'quarter',
                showTotals: false,
            },
            {
                area: 'column',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: this.dateField,
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'CompanyName'
            },
            {
                area: 'filter',
                dataField: 'Rating'
            },
            {
                area: 'filter',
                dataField: 'Status'
            },
            {
                area: 'filter',
                dataField: 'ZipCode'
            }
        ]
    };
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.isSlice ? DataLayoutType.PivotGrid : DataLayoutType.DataGrid
    );
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable();
    hideDataGrid$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.DataGrid;
    }));
    hidePivotGrid$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.PivotGrid;
    }));
    hideChart$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Chart;
    }));
    hideMap$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Map;
    }));
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    filterChanged$: Observable<FilterModel> = this.filtersService.filterChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    chartInfoItems: InfoItem[];
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.crmService.loadSliceChartData(
                this.getODataUrl(this.groupDataSourceURI),
                this.filters,
                this.chartComponent.summaryBy.value,
                this.dateField,
                this.subscriptionStatusFilter.items.element['getObjectValue']()
            ).then((result) => {
                this.chartInfoItems = result.infoItems;
                return result.items;
            });
        }
    });
    sliceStorageKey = 'CRM_Clients_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
    private usersInstancesLoadingSubscription: Subscription;
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    private subscriptionStatusFilter = new FilterModel({
        component: SubscriptionsFilterComponent,
        caption: 'SubscriptionStatus',
        field: 'ServiceTypeId',
        items: {
            element: new SubscriptionsFilterModel(
                {
                    dataSource$: this.store$.pipe(
                        select(SubscriptionsStoreSelectors.getSubscriptions),
                        filter(Boolean),
                        map((subscriptions: ServiceTypeInfo[]) => {
                            return subscriptions.map((subscription: ServiceTypeInfo) => {
                                return {
                                    ...subscription,
                                    current: null,
                                    past: null,
                                    never: null
                                };
                            });
                        })
                    ),
                    dispatch: () => this.store$.dispatch(new SubscriptionsStoreActions.LoadRequestAction(false)),
                    nameField: 'name',
                    keyExpr: 'id'
                })
        }
    });
    private filters: FilterModel[] = this.getFilters();
    odataFilter$: Observable<string> = this.filterChanged$.pipe(
        startWith(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom)),
        map(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
    );
    mapData$: Observable<MapData>;
    mapInfoItems$: Observable<InfoItem[]>;

    constructor(
        injector: Injector,
        private contactService: ContactsService,
        private pipelineService: PipelineService,
        private filtersService: FiltersService,
        private clientService: ClientService,
        private contactEmailService: ContactEmailServiceProxy,
        private store$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private impersonationService: ImpersonationService,
        private sessionService: AppSessionService,
        private crmService: CrmService,
        private mapService: MapService,
        public dialog: MatDialog,
        public appService: AppService,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService
    ) {
        super(injector);
        if (this.userManagementService.checkBankCodeFeature()) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
        }
        this.dataSource = new DataSource({
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(
                    this.dataSourceURI,
                    [
                        this.filterModelStatus.filterMethod(this.filterModelStatus),
                        FiltersService.filterByGroupId()
                    ]
                ),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (records) => {
                    let userIds = this.getUserIds(records);
                    if (this.appService.isCfoLinkOrVerifyEnabled && userIds.length)
                        this.usersInstancesLoadingSubscription = this.crmService.getUsersWithInstances(userIds);
                }
            }
        });
        this.totalDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                url: this.getODataUrl(this.totalDataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.totalCount = undefined;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (count: any) => {
                    this.totalCount = count;
                }
            })
        });
        this.searchValue = '';
    }

    ngOnInit() {
        this.filterModelStatus.updateCaptions();
        this.handleTotalCountUpdate();
        this.handleDataGridUpdate();
        this.handlePivotGridUpdate();
        this.handleChartUpdate();
        this.handleMapUpdate();
        this.handleStageChange();
        this.getOrganizationUnits();
        this.activate();
        this.handleModuleChange();
        this.handleDataLayoutTypeInQuery();
        this.handleFiltersPining();
    }

    get isSlice() {
        return this.appService.getModule() === 'slice';
    }

    private handleFiltersPining() {
        const filterFixed$ = this.filtersService.filterFixed$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            skip(1)
        );
        filterFixed$.pipe(
            switchMap(this.waitUntil(DataLayoutType.DataGrid))
        ).subscribe(() => {
            this.repaintDataGrid(1000);
        });
        filterFixed$.pipe(
            switchMap(this.waitUntil(DataLayoutType.PivotGrid))
        ).subscribe(() => {
            if (this.pivotGridComponent) {
                setTimeout(() => {
                    this.pivotGridComponent.pivotGrid.instance.updateDimensions();
                    this.pivotGridComponent.updateTotalCellsSizes();
                }, 1001);
            }
        });
    }

    private waitUntil(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value === layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === layoutType),
            first(),
            mapTo(data)
        );
    }

    private getUserIds(records) {
        return records.reduce((ids, item) => {
            if (item.items)
                Array.prototype.push.apply(ids,
                    this.getUserIds(item.items)
                );
            else if (item.UserId)
                ids.push(item.UserId);
            return ids;
        }, []);
    }

    private handleTotalCountUpdate(): void {
        combineLatest(
            this.odataFilter$,
            this.refresh$
        ).subscribe(([filter, ]) => {
            this.totalDataSource['_store']['_url'] = this.getODataUrl(
                this.totalDataSourceURI,
                filter,
                null,
                this.subscriptionStatusFilter.items.element.value
            );
            this.totalDataSource.load();
        });
    }

    private handleDataGridUpdate(): void {
        this.listenForUpdate(DataLayoutType.DataGrid).pipe(skip(1)).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handlePivotGridUpdate(): void {
        this.listenForUpdate(DataLayoutType.PivotGrid).pipe(skip(1)).subscribe(() => {
            this.pivotGridComponent.pivotGrid.instance.updateDimensions();
            this.processFilterInternal();
        });
    }

    private handleModuleChange() {
        merge(
            this.dataLayoutType$,
            this.lifeCycleSubjectsService.activate$
        ).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.crmService.handleModuleChange(this.dataLayoutType.value);
        });
    }

    private handleChartUpdate() {
        combineLatest(
            this.chartComponent.summaryBy$,
            this.listenForUpdate(DataLayoutType.Chart)
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
        ).subscribe(() => {
            this.chartDataSource.load();
        });
    }

    private handleMapUpdate() {
        const clientsData$ = combineLatest(
            this.listenForUpdate(DataLayoutType.Map),
            this.selectedMapArea$
        ).pipe(
            tap(() => this.mapDataIsLoading = true),
            switchMap(([[filter, ], mapArea]: [any, MapArea]) => this.mapService.loadSliceMapData(
                this.getODataUrl(this.groupDataSourceURI),
                filter,
                mapArea,
                this.dateField,
                this.subscriptionStatusFilter.items.element['getObjectValue']()
            )),
            publishReplay(),
            refCount(),
            tap(() => this.mapDataIsLoading = false)
        );
        this.mapData$ = this.mapService.getAdjustedMapData(clientsData$);
        this.mapInfoItems$ = this.mapService.getMapInfoItems(clientsData$, this.selectedMapArea$);
    }

    private handleStageChange() {
        this.pipelineService.stageChange$.subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(AppConsts.PipelinePurposeIds.lead)).name);
        });
    }

    private handleDataLayoutTypeInQuery() {
        this._activatedRoute.queryParams.pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated),
            pluck('dataLayoutType'),
            filter((dataLayoutType: DataLayoutType) => dataLayoutType && dataLayoutType != this.dataLayoutType.value)
        ).subscribe((dataLayoutType) => {
            this.toggleDataLayout(+dataLayoutType);
        });
    }

    private getOrganizationUnits() {
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
        this.store$.pipe(
            select(OrganizationUnitsStoreSelectors.getOrganizationUnits),
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe((organizationUnits: OrganizationUnitDto[]) => {
            this.organizationUnits = organizationUnits;
        });
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .subscribe(params => {
                    if ('addNew' == params['action'])
                        setTimeout(() => this.createClient());
                    if (params['refresh']) {
                        this.refresh();
                    }
            });
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    onSelectionChanged($event) {
        this.selectedClientKeys = $event.component.getSelectedRowKeys();
        this.initToolbarConfig();
    }

    refresh(refreshDashboard = true) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        this._refresh.next(null);
        if (refreshDashboard) {
            (this.reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate() {
        this.lifeCycleSubjectsService.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    private listenForUpdate(layoutType: DataLayoutType) {
        return combineLatest(
            this.odataFilter$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(layoutType))
        );
    }

    createClient() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => this.invalidate(),
                customerType: ContactGroup.Client
            }
        }).afterClosed().subscribe(() => this.refresh());
    }

    showClientDetails(event) {
        if (!event.data)
            return;

        let orgId = event.data.OrganizationId,
            clientId = event.data.Id;

        this.searchClear = false;
        event.component.cancelEditData();
        setTimeout(() => {
            this._router.navigate(['app/crm/contact', clientId].concat(orgId ? ['company', orgId] : []),
                { queryParams: { referrer: 'app/crm/clients'} });
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
            this.selectedClientKeys = [];
            this.initToolbarConfig();
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
                component: FilterInputsComponent,
                caption: 'email',
                items: { Email: new FilterItemModel() }
            }),
            this.subscriptionStatusFilter,
            new FilterModel({
                component: FilterCalendarComponent,
                operator: {from: 'ge', to: 'le'},
                caption: 'creation',
                field: this.dateField,
                items: {from: new FilterItemModel(), to: new FilterItemModel()},
                options: {method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true}
            }),
            this.filterModelStatus,
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'contains',
                caption: 'phone',
                items: { Phone: new FilterItemModel() }
            }),
            new FilterModel({
                component: FilterStatesComponent,
                caption: 'states',
                items: {
                    countryStates: new FilterStatesModel()
                }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
                caption: 'city',
                items: { City: new FilterItemModel() }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'contains',
                caption: 'streetAddress',
                items: { StreetAddress: new FilterItemModel() }
            }),
            new FilterModel({
                component: FilterInputsComponent,
                operator: 'startswith',
                caption: 'zipCode',
                items: { ZipCode: new FilterItemModel() }
            }),
            this.filterModelAssignment,
            new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'SourceOrganizationUnitId',
                field: 'SourceOrganizationUnitId',
                items: {
                    element: new FilterCheckBoxesModel(
                        {
                            dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                            nameField: 'displayName',
                            keyExpr: 'id'
                        })
                }
            }),
            this.filterModelLists,
            this.filterModelTags,
            this.filterModelRating,
            this.filterModelStar,
            new FilterModel({
                caption: 'groupId',
                hidden: true
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
                        name: 'assign',
                        action: this.toggleUserAssignment.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected
                        }
                    },
                    {
                        name: 'status',
                        action: this.toggleStatus.bind(this),
                        attr: {
                            'filter-selected': this.filterModelStatus && this.filterModelStatus.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageListsAndTags'),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageListsAndTags'),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageRatingAndStars'),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        action: this.toggleStars.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Client, 'ManageRatingAndStars'),
                        attr: {
                            'filter-selected': this.filterModelStar && this.filterModelStar.isSelected
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
                                    action: this.exportToImage.bind(this, ImageFormat.PDF),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf'
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.PNG),
                                    text: this.l('Save as PNG'),
                                    icon: 'png',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.JPEG),
                                    text: this.l('Save as JPEG'),
                                    icon: 'jpg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.SVG),
                                    text: this.l('Save as SVG'),
                                    icon: 'svg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.exportToImage.bind(this, ImageFormat.GIF),
                                    text: this.l('Save as GIF'),
                                    icon: 'gif',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: (options) => {
                                        if (this.dataLayoutType.value === DataLayoutType.PivotGrid) {
                                            this.pivotGridComponent.pivotGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'PivotGrid')
                                            );
                                            this.pivotGridComponent.pivotGrid.instance.exportToExcel();
                                        } else if (this.dataLayoutType.value === DataLayoutType.DataGrid) {
                                            this.exportToXLS(options);
                                        }
                                    },
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                    visible: this.showDataGrid || this.showPivotGrid
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.showDataGrid
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.showDataGrid
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.showDataGrid
                                }
                            ]
                        }
                    },
                    { name: 'print', action: Function() }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'columnChooser',
                        disabled: !(this.showDataGrid || this.showPivotGrid),
                        action: () => {
                            if (this.showDataGrid) {
                                DataGridService.showColumnChooser(this.dataGrid);
                            } else if (this.showPivotGrid) {
                                this.pivotGridComponent.toggleFieldPanel();
                            }
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'dataGrid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => this.showDataGrid
                        }
                    },
                    {
                        name: 'pivotGrid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.PivotGrid),
                        options: {
                            checkPressed: () => this.showPivotGrid
                        }
                    },
                    {
                        name: 'chart',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Chart),
                        options: {
                            checkPressed: () => this.showChart
                        }
                    },
                    {
                        name: 'map',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Map),
                        options: {
                            checkPressed: () => this.showMap
                        }
                    }
                ]
            }
        ];
       return this.toolbarConfig;
    }

    repaintDataGrid(delay = 0) {
        if (this.dataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint(), delay);
        }
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    private exportToImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format);
        } else if (this.showMap) {
            this.mapComponent.exportTo(format);
        }
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.dataLayoutType.next(dataLayoutType);
        this.selectedClientKeys = [];
        this.initDataSource();
        this.initToolbarConfig();
        if (this.showDataGrid) {
            this.repaintDataGrid();
        }
    }

    initDataSource() {
        if (this.showDataGrid) {
            this.setDataGridInstance();
        } else if (this.showPivotGrid) {
            this.setPivotGridInstance();
        } else if (this.showChart) {
            this.setChartInstance();
        }
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.pivotGrid && this.pivotGridComponent.pivotGrid.instance;
        CrmService.setDataSourceToComponent(this.pivotGridDataSource, pivotGridInstance);
    }

    private setChartInstance() {
        const chartInstance = this.chartComponent && this.chartComponent.chart && this.chartComponent.chart.instance;
        CrmService.setDataSourceToComponent(this.chartDataSource, chartInstance);
    }

    get showDataGrid(): boolean {
        return this.dataLayoutType.value === DataLayoutType.DataGrid;
    }

    get showPivotGrid(): boolean {
        return this.dataLayoutType.value === DataLayoutType.PivotGrid;
    }

    get showChart(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Chart;
    }

    get showMap(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Map;
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this._refresh.next(null);
        }
    }

    processFilterInternal() {
        if (this.showDataGrid && this.dataGrid && this.dataGrid.instance
            || this.showPivotGrid && this.pivotGridComponent && this.pivotGridComponent.pivotGrid && this.pivotGridComponent.pivotGrid.instance) {
            this.processODataFilter(
                this.showPivotGrid ? this.pivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom,
                null,
                this.subscriptionStatusFilter.items.element.value
            );
        }
    }

    updateClientStatuses(status) {
        if (this.contactService.checkCGPermission(ContactGroup.Client)) {
            let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
            this.clientService.updateContactStatuses(
                selectedIds,
                ContactGroup.Client,
                status.id,
                () => {
                    this.refresh();
                    this.dataGrid.instance.clearSelection();
                }
            );
        }
    }

    getOrganizationUnitName = (e) => {
        return DataGridService.getOrganizationUnitName(e.OrganizationUnitId, this.organizationUnits);
    }

    onCellClick($event) {
        let col = $event.column;
        if (col && (col.command || col.name == 'LinkToCFO'))
            return;
        this.showClientDetails($event);
    }

    ngOnDestroy() {
        this.lifeCycleSubjectsService.destroy.next();
        this.deactivate();
    }

    private requestVerificationInternal(contactId: number) {
        this.appService.requestVerification(contactId).subscribe(
            () => this.dataGrid.instance.refresh()
        );
    }

    requestVerification(data) {
        if (data.Email)
            this.requestVerificationInternal(data.Id);
        else {
            let dialogData = {
                groupId: ContactGroup.Client,
                field: 'emailAddress',
                emailAddress: '',
                name: 'Email',
                contactId: data.Id,
                usageTypeId: '',
                isConfirmed: true,
                isActive: true,
                isCompany: false,
                comment: '',
                deleteItem: () => {}
            };

            this.dialog.open(EditContactDialog, {
                data: dialogData,
                hasBackdrop: true
            }).afterClosed().subscribe(result => {
                if (result) {
                    this.startLoading();
                    this.contactEmailService.createContactEmail(new CreateContactEmailInput({
                        contactId: data.Id,
                        emailAddress: dialogData.emailAddress,
                        isActive: dialogData.isActive,
                        isConfirmed: dialogData.isConfirmed,
                        comment: dialogData.comment,
                        usageTypeId: dialogData.usageTypeId

                    })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
                        this.dataGrid.instance.refresh();
                        this.requestVerificationInternal(data.Id);
                    });
                }
            });
        }
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
        if (this.dependencyChanged)
            this.refresh();

        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }

    deactivate() {
        super.deactivate();

        this.subRouteParams.unsubscribe();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        if (this.dataGrid) {
            this.itemDetailsService.setItemsSource(
                ItemTypeEnum.Customer,
                this.dataSource
            );
        }
        this.hideHostElement();
    }

    toggleActionsMenu(event) {
        this.actionMenuItems[this.MENU_LOGIN_INDEX].visible = Boolean(event.data.UserId)
            && this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation);
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe((actionEvent) => {
            this.actionEvent = actionEvent;
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    isCfoAvailable(userId: number): Observable<boolean> {
        /** Users instances may load after odata request and we should avoid loading of usersInstances request for every
         *  individual user */
        return this.usersInstancesLoadingSubscription && !this.usersInstancesLoadingSubscription.closed
               ? of(false)
               : this.crmService.isCfoAvailable(userId);
    }

}
