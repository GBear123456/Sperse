/** Core imports */
import {
    Component,
    OnInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, of, merge } from 'rxjs';
import { filter, first, startWith, takeUntil, map, mapTo, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import {
    ContactAssignedUsersStoreSelectors,
    AppStore,
    ListsStoreSelectors,
    PartnerTypesStoreSelectors,
    RatingsStoreSelectors,
    StarsStoreSelectors,
    StatusesStoreSelectors,
    TagsStoreSelectors
} from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { TypesListComponent } from '../shared/types-list/types-list.component';
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
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import {
    ContactStatusDto,
    BulkUpdatePartnerTypeInput,
    PartnerTypeServiceProxy,
    PartnerServiceProxy,
    ContactServiceProxy,
    OrganizationUnitDto
} from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ClientService } from '@app/crm/clients/clients.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { DataGridHelper } from '@app/crm/shared/helpers/data-grid.helper';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { CrmService } from '@app/crm/crm.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapService } from '@app/shared/common/slice/map/map.service';

@Component({
    templateUrl: './partners.component.html',
    styleUrls: ['./partners.component.less'],
    animations: [appModuleAnimation()],
    providers: [
        ClientService,
        ContactServiceProxy,
        MapService,
        PartnerServiceProxy,
        PartnerTypeServiceProxy,
        LifecycleSubjectsService
    ]
})
export class PartnersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent) typesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('statusesList') statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent) chartComponent: ChartComponent;
    @ViewChild(MapComponent) mapComponent: MapComponent;

    private readonly MENU_LOGIN_INDEX = 1;
    private isSlice = this.appService.getModule() === 'slice';
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

    private readonly dataSourceURI = 'Partner';
    private readonly groupDataSourceURI = 'PartnerSlice';
    private filters: FilterModel[];
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;
    private organizationUnits: OrganizationUnitDto[];

    actionEvent: any;
    actionMenuItems = [
        {
            text: this.l('Edit'),
            visible: true,
            action: () => this.showPartnerDetails(this.actionEvent)
        },
        {
            text: this.l('LoginAsThisUser'),
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            action: () => this.impersonationService.impersonate(this.actionEvent.data.UserId, this.appSession.tenantId)
        }
    ];

    formatting = AppConsts.formatting;
    statuses: ContactStatusDto[];
    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelTypes: FilterModel;
    filterModelAssignment: FilterModel;
    filterModelStatus: FilterModel;
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;

    selectedPartnerKeys: any = [];
    public headlineConfig = {
        names: [this.l('Partners')],
        icon: 'people',
        // onRefresh: this.invalidate.bind(this),
        toggleToolbar: this.toggleToolbar.bind(this),
        buttons: [
            {
                enabled: this.contactService.checkCGPermission(ContactGroup.Partner),
                action: this.createPartner.bind(this),
                label: this.l('CreateNewPartner')
            }
        ]
    };

    partnerTypes: any/*PartnerTypeDto*/[];
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
                dataField: 'PartnerType'
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
    sliceStorageKey = 'CRM_Partners_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private filterChanged = false;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
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
    partnersData$: Observable<any> = combineLatest(
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
    mapData$: Observable<MapData> = this.mapService.getAdjustedMapData(this.partnersData$);
    mapInfoItems$: Observable<InfoItem[]> = this.mapService.getMapInfoItems(this.partnersData$, this.selectedMapArea$);

    constructor(
        injector: Injector,
        private contactService: ContactsService,
        private partnerService: PartnerServiceProxy,
        private appService: AppService,
        private pipelineService: PipelineService,
        private filtersService: FiltersService,
        private clientService: ClientService,
        private partnerTypeService: PartnerTypeServiceProxy,
        private store$: Store<AppStore.State>,
        private itemDetailsService: ItemDetailsService,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private sessionService: AppSessionService,
        private crmService: CrmService,
        private impersonationService: ImpersonationService,
        private mapService: MapService,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService,
    ) {
        super(injector);
        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                deserializeDates: false,
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        };
        this.searchValue = '';
        this.pipelineService.stageChange$.subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(AppConsts.PipelinePurposeIds.lead)).name);
        });
        if (this.userManagementService.checkBankCodeFeature()) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
        }
    }

    ngOnInit() {
        this.getStatuses();
        this.getPartnerTypes();
        this.getOrganizationUnits();
        combineLatest(
            this.chartComponent.summaryBy$,
            this.filterChanged$.pipe(startWith(null))
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            filter(() => this.showChart)
        ).subscribe(() => {
            this.chartDataSource.load();
        });
        this.activate();
        merge(
            this.dataLayoutType$,
            this.lifeCycleSubjectsService.activate$
        ).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.crmService.handleModuleChange(this.dataLayoutType.value);
        });
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .subscribe(params => {
                    if ('addNew' == params['action'])
                        setTimeout(() => this.createPartner());
                    if (params['refresh']) {
                        this.invalidate();
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
        this.selectedPartnerKeys = $event.component.getSelectedRowKeys();
        this.initToolbarConfig();
    }

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        if (this.showDataGrid || this.showPivotGrid) {
            this.processFilterInternal();
        } else if (this.showChart) {
            this.chartDataSource.load();
        } else if (this.showMap) {
            this._refresh.next(null);
        }
    }

    createPartner() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => {
                    this.invalidate.bind(this);
                    this.filterChanged = true;
                },
                customerType: ContactGroup.Partner
            }
        }).afterClosed().subscribe(() => this.invalidate());
    }

    showPartnerDetails(event) {
        let partnerId = event.data && event.data.Id;
        if (!partnerId)
            return;

        this.searchClear = false;
        event.component.cancelEditData();
        let orgId = event.data.OrganizationId;
        setTimeout(() => {
            this._router.navigate(['app/crm/contact', partnerId].concat(orgId ? ['company', orgId] : []),
            { queryParams: { referrer: 'app/crm/partners'} });
        });
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
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
                } else if (this.showChart) {
                    this.chartDataSource.load();
                } else {
                    this.processFilterInternal();
                }
            });
        }
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
                    this.filterModelStatus = new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'status',
                        field: 'StatusId',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource$: this.store$.pipe(select(StatusesStoreSelectors.getStatuses)),
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    this.filterModelTypes = new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'type',
                        field: 'PartnerTypeId',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource$: this.store$.pipe(select(PartnerTypesStoreSelectors.getStoredPartnerTypes)),
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                        }
                    }),
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
                                    dataSource$: this.store$.pipe(this.getAssignedUsersSelector()),
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
                            element: new FilterCheckBoxesModel(
                                {
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
                                    keyExpr: 'id'
                                })
                        }
                    })
                ]
            );
        }

        this.filtersService.apply(() => {
            this.selectedPartnerKeys = [];
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
                            placeholder: this.l('Search') + ' ' + this.l('Partners').toLowerCase(),
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
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner, 'ManageAssignments'),
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
                        name: 'partnerType',
                        action: this.toggleType.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner),
                        attr: {
                            'filter-selected': this.filterModelTypes && this.filterModelTypes.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner, 'ManageListsAndTags'),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner, 'ManageListsAndTags'),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner, 'ManageRatingAndStars'),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        action: this.toggleStars.bind(this),
                        disabled: !this.contactService.checkCGPermission(ContactGroup.Partner, 'ManageRatingAndStars'),
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
                                        if (this.showPivotGrid) {
                                            this.pivotGridComponent.pivotGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'PivotGrid')
                                            );
                                            this.pivotGridComponent.pivotGrid.instance.exportToExcel();
                                        } else if (this.showDataGrid) {
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

    toggleType() {
        this.typesComponent.toggle();
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

    private downloadImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format);
        }
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.initToolbarConfig();
            this.processFilterInternal();
        }
    }

    processFilterInternal() {
        if (this.showDataGrid || this.showPivotGrid) {
            this.processODataFilter(
                this.showPivotGrid ? this.pivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom
            );
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

    getOrganizationUnitName = (e) => {
        return DataGridHelper.getOrganizationUnitName(e.OrganizationUnitId, this.organizationUnits);
    }

    updatePartnerStatuses(status) {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        this.clientService.updateContactStatuses(
            selectedIds,
            ContactGroup.Partner,
            status.id,
            () => {
                this.invalidate();
                this.dataGrid.instance.clearSelection();
            }
        );
    }

    updatePartnerTypes($event) {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        this.partnerService.bulkUpdateType(BulkUpdatePartnerTypeInput.fromJS({
            partnerIds: selectedIds,
            typeId: $event.id
        })).subscribe(() => {
            this.invalidate();
            this.dataGrid.instance.clearSelection();
        });
    }

    private getStatuses() {
        this.store$.pipe(select(StatusesStoreSelectors.getStatuses)).subscribe(
            statuses => this.statuses = statuses
        );
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

    private getPartnerTypes() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe(
            partnerTypes => this.partnerTypes = partnerTypes
        );
    }

    onCellClick($event) {
        let col = $event.column;
        if (col && (col.command || col.name == 'LinkToCFO'))
            return;
        this.showPartnerDetails($event);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        super.activate();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        if (this.dependencyChanged)
            this.invalidate();

        this.showHostElement();
    }

    deactivate() {
        super.deactivate();
        this.subRouteParams.unsubscribe();
        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Partner, this.dataGrid.instance.getDataSource());
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

    getAssignedUsersSelector() {
        return select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: ContactGroup.Partner });
    }
}
