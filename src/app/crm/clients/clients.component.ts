/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { first, filter, finalize, takeUntil, startWith, map, mapTo, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import {
    AppStore,
    ContactAssignedUsersStoreSelectors,
    TagsStoreSelectors,
    ListsStoreSelectors,
    StarsStoreSelectors,
    StatusesStoreSelectors,
    RatingsStoreSelectors
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
    CreateContactEmailInput,
    ContactServiceProxy,
    ContactEmailServiceProxy,
    ContactStatusDto,
    OrganizationUnitDto
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
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { DataGridHelper } from '@app/crm/shared/helpers/data-grid.helper';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { CrmService } from '@app/crm/crm.service';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapService } from '@app/shared/common/slice/map/map.service';

@Component({
    templateUrl: './clients.component.html',
    styleUrls: ['./clients.component.less'],
    animations: [appModuleAnimation()],
    providers: [
        ClientService,
        ContactServiceProxy,
        MapService,
        LifecycleSubjectsService,
        ImpersonationService
    ]
})
export class ClientsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent) statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent) chartComponent: ChartComponent;
    @ViewChild(MapComponent) mapComponent: MapComponent;

    private readonly MENU_LOGIN_INDEX = 1;
    private readonly dataSourceURI: string = 'Customer';
    private readonly groupDataSourceURI: string = 'CustomerSlice';
    private filters: FilterModel[];
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;
    private organizationUnits: OrganizationUnitDto[];

    formatting = AppConsts.formatting;
    statuses$: Observable<ContactStatusDto[]> = this.store$.pipe(select(StatusesStoreSelectors.getStatuses));
    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelAssignment: FilterModel;
    filterModelStatus: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'status',
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
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;
    assignedUsersSelector = select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: ContactGroup.Client });
    contactStatus = ContactStatus;
    selectedClientKeys: any = [];
    public headlineConfig = {
        names: [this.l('Customers')],
        icon: 'people',
        // onRefresh: this.refresh.bind(this),
        toggleToolbar: this.toggleToolbar.bind(this),
        buttons: [
            {
                enabled: this.contactService.checkCGPermission(ContactGroup.Client),
                action: this.createClient.bind(this),
                label: this.l('CreateNewCustomer')
            }
        ]
    };

    actionEvent: any;
    actionMenuItems = [
        {
            text: this.l('Edit'),
            visible: true,
            action: () => this.showClientDetails(this.actionEvent)
        },
        {
            text: this.l('LoginAsThisUser'),
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            action: () => this.impersonationService.impersonate(this.actionEvent.data.UserId, this.appSession.tenantId)
        }
    ];
    permissions = AppPermissions;
    pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => this.crmService.loadSlicePivotGridData(
            this.getODataUrl(this.groupDataSourceURI),
            this.filters,
            loadOptions
        ),
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
                dataField: 'CreationTime',
                dataType: 'date',
                groupInterval: 'year',
                name: 'year',
                showTotals: false
            },
            {
                area: 'column',
                dataField: 'CreationTime',
                dataType: 'date',
                groupInterval: 'quarter',
                showTotals: false,
            },
            {
                area: 'column',
                dataField: 'CreationTime',
                dataType: 'date',
                groupInterval: 'month',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'BankCode'
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
    odataFilter$: Observable<string> = this.filterChanged$.pipe(
        startWith(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom)),
        map(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
    );
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    clientsData$: Observable<any> = combineLatest(
        this.odataFilter$,
        this.selectedMapArea$,
        this.refresh$
    ).pipe(
        tap(() => this.mapDataIsLoading = true),
        switchMap((data) => this.showMap ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === DataLayoutType.Map),
            first(),
            mapTo(data)
        )),
        switchMap(([filter, mapArea]: [any, MapArea]) => this.mapService.loadSliceMapData(
            this.getODataUrl(this.groupDataSourceURI),
            filter,
            mapArea
        )),
        publishReplay(),
        refCount(),
        tap(() => this.mapDataIsLoading = false)
    );
    mapData$: Observable<MapData> = this.mapService.getAdjustedMapData(this.clientsData$);
    mapInfoItems$: Observable<InfoItem[]> = this.mapService.getMapInfoItems(this.clientsData$, this.selectedMapArea$);
    chartInfoItems: InfoItem[];
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.crmService.loadSliceChartData(
                this.getODataUrl(this.groupDataSourceURI),
                this.filters,
                this.chartComponent.summaryBy.value
            ).then((result) => {
                this.chartInfoItems = result.infoItems;
                return result.items;
            });
        }
    });
    sliceStorageKey = 'CRM_Clients_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private filterChanged = false;
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;

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
    }

    ngOnInit() {
        this.filterModelStatus.updateCaptions();
        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI, FiltersService.filterByStatus(this.filterModelStatus)),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        };
        this.searchValue = '';
        this.pipelineService.stageChange.asObservable().subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(AppConsts.PipelinePurposeIds.lead)).name);
        });
        combineLatest(
            this.chartComponent.summaryBy$,
            this.filterChanged$.pipe(startWith(null))
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            filter(() => this.showChart)
        ).subscribe(() => {
            this.chartDataSource.load();
        });
        this.getOrganizationUnits();
        this.activate();
    }

    get isSlice() {
        return this.appService.getModule() === 'slice';
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

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .subscribe(params => {
                    if ('addNew' == params['action'])
                        setTimeout(() => this.createClient());
                    if (params['refresh']) {
                        this.refresh();
                        this.filterChanged = true;
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
        if (this.showDataGrid || this.showPivotGrid) {
            this.processFilterInternal();
        }
        if (this.showChart) {
            this.chartDataSource.load();
        }
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

    createClient() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => {
                    this.invalidate();
                    this.filterChanged = true;
                },
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
                this.filters = [
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
                    new FilterModel({
                        component: FilterCalendarComponent,
                        operator: {from: 'ge', to: 'le'},
                        caption: 'creation',
                        field: 'CreationTime',
                        items: {from: new FilterItemModel(), to: new FilterItemModel()},
                        options: {method: 'getFilterByDate', params: { useUserTimezone: true }}
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
                    this.filterModelAssignment = new FilterModel({
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
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'OrganizationUnitId',
                        field: 'OrganizationUnitId',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource$: this.store$.pipe(select(OrganizationUnitsStoreSelectors.getOrganizationUnits)),
                                    nameField: 'displayName',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    this.filterModelLists = new FilterModel({
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
                    }),
                    this.filterModelTags = new FilterModel({
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
                    }),
                    this.filterModelRating = new FilterModel({
                        component: FilterRangeComponent,
                        operator: { from: 'ge', to: 'le' },
                        caption: 'Rating',
                        field: 'Rating',
                        items$: this.store$.pipe(select(RatingsStoreSelectors.getRatingItems))
                    }),
                    this.filterModelStar = new FilterModel({
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
                    })
                ]
            );
        }

        this.filtersService.apply(() => {
            this.selectedClientKeys = [];
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this.appService.updateToolbar([
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
                                    action: this.downloadImage.bind(this, ImageFormat.PDF),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf'
                                },
                                {
                                    action: this.downloadImage.bind(this, ImageFormat.PNG),
                                    text: this.l('Save as PNG'),
                                    icon: 'png',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.downloadImage.bind(this, ImageFormat.JPEG),
                                    text: this.l('Save as JPEG'),
                                    icon: 'jpg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.downloadImage.bind(this, ImageFormat.SVG),
                                    text: this.l('Save as SVG'),
                                    icon: 'svg',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: this.downloadImage.bind(this, ImageFormat.GIF),
                                    text: this.l('Save as GIF'),
                                    icon: 'gif',
                                    visible: this.showChart || this.showMap
                                },
                                {
                                    action: () => {
                                        if (this.dataLayoutType.value === DataLayoutType.PivotGrid) {
                                            this.pivotGridComponent.pivotGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'PivotGrid')
                                            );
                                            this.pivotGridComponent.pivotGrid.instance.exportToExcel();
                                        } else if (this.dataLayoutType.value === DataLayoutType.DataGrid) {
                                            this.exportToXLS.bind(this);
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
                    { name: 'showCompactRowsHeight', action: DataGridService.showCompactRowsHeight.bind(this, this.dataGrid, true) },
                    {
                        name: 'columnChooser',
                        action: () => {
                            if (this.showDataGrid) {
                                DataGridService.showColumnChooser.bind(this, this.dataGrid);
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
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.fullScreenService.toggleFullscreen(document.documentElement);
                            setTimeout(() => this.dataGrid.instance.repaint(), 100);
                        }
                    }
                ]
            }
        ]);
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

    private downloadImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format);
        } else if (this.showMap) {
            this.mapComponent.exportTo(format);
        }
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.crmService.handleModuleChange(dataLayoutType);
        this.selectedClientKeys = [];
        this.dataLayoutType.next(dataLayoutType);
        this.initDataSource();
        this.initToolbarConfig();
        if (this.showDataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint());
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => {
                if (this.showPivotGrid) {
                    this.pivotGridComponent.pivotGrid.instance.updateDimensions();
                }
                if (this.showChart) {
                    this.chartDataSource.load();
                } else {
                    this.processFilterInternal();
                }
            });
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
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.initToolbarConfig();
            this.processFilterInternal();
        }
    }

    processFilterInternal() {
        if (this.showDataGrid && this.dataGrid && this.dataGrid.instance
            || this.showPivotGrid && this.pivotGridComponent && this.pivotGridComponent.pivotGrid && this.pivotGridComponent.pivotGrid.instance) {
            this.processODataFilter(
                this.showPivotGrid ? this.pivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom
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
        return DataGridHelper.getOrganizationUnitName(e.OrganizationUnitId, this.organizationUnits);
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

    activate() {
        super.activate();
        this.crmService.handleModuleChange(this.dataLayoutType.value);
        this.lifeCycleSubjectsService.activate.next();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        if (this.dependencyChanged)
            this.refresh();

        this.showHostElement();
    }

    deactivate() {
        super.deactivate();

        this.subRouteParams.unsubscribe();
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Customer, this.dataGrid.instance.getDataSource());
        this.hideHostElement();
    }

    showActionsMenu(event) {
        event.cancel = true;

        this.actionEvent = null;
        this.actionMenuItems[this.MENU_LOGIN_INDEX].visible = Boolean(event.data.UserId)
            && this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation);
        setTimeout(() => this.actionEvent = event);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }
}
