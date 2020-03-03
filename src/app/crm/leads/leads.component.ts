/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';
import { Params, RouteReuseStrategy } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, of, merge } from 'rxjs';
import {
    first,
    filter,
    startWith,
    tap,
    switchMap,
    map,
    mapTo,
    takeUntil,
    pluck,
    publishReplay,
    refCount
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import invert from 'lodash/invert';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import {
    ContactAssignedUsersStoreSelectors,
    AppStore,
    TagsStoreSelectors,
    ListsStoreSelectors,
    StarsStoreSelectors,
    RatingsStoreSelectors
} from '@app/store';
import { OrganizationUnitsStoreSelectors, PipelinesStoreSelectors } from '@app/crm/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';
import { FilterStatesComponent } from '@shared/filters/states/filter-states.component';
import { FilterStatesModel } from '@shared/filters/states/filter-states.model';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { LeadServiceProxy, ContactServiceProxy, OrganizationUnitDto } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../shared/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { OrganizationUnitsStoreActions } from '@app/crm/store';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { CrmService } from '@app/crm/crm.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.less'],
    providers: [LeadServiceProxy, ContactServiceProxy, LifecycleSubjectsService, PipelineService, MapService],
    animations: [appModuleAnimation()]
})
export class LeadsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent) stagesComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent) chartComponent: ChartComponent;
    @ViewChild(MapComponent) mapComponent: MapComponent;

    private readonly MENU_LOGIN_INDEX = 1;
    private _selectedLeads: any;
    get selectedLeads() {
        return this._selectedLeads || [];
    }
    set selectedLeads(leads) {
        this._selectedLeads = leads;
        this.selectedClientKeys = [];
        leads.forEach((lead) => {
            if (lead && lead.CustomerId)
                this.selectedClientKeys.push(lead.CustomerId);
        });
        this.initToolbarConfig();
    }
    actionEvent: any;
    actionMenuItems = [
        {
            text: this.l('Edit'),
            class: 'edit',
            visible: true,
            action: () => this.showLeadDetails(this.actionEvent)
        },
        {
            text: this.l('LoginAsThisUser'),
            class: 'login',
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            action: () => this.impersonationService.impersonate(this.actionEvent.data.UserId, this.appSession.tenantId)
        }
    ];
    contactGroups = Object.keys(ContactGroup)
        .filter((group: string) => this.contactService.checkCGPermission(ContactGroup[group], ''))
        .map((group: string) => ({
            text: this.getUserGroup(group),
            value: group
        }));
    selectedContactGroup = Object.keys(ContactGroup).shift();
    contactGroupId: BehaviorSubject<ContactGroup> = new BehaviorSubject(ContactGroup[this.selectedContactGroup]);
    contactGroupId$: Observable<ContactGroup> = this.contactGroupId.asObservable();
    userGroupText$: Observable<string> = this.contactGroupId$.pipe(
        map((contactGroupId: ContactGroup) => {
            return this.getUserGroup(invert(ContactGroup)[contactGroupId.toString()]).toLowerCase();
        })
    );

    stages = [];
    pipelineDataSource: any;
    collection: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    selectedClientKeys = [];
    manageDisabled = true;
    sliceStorageKey = 'CRM_Contacts_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;

    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelAssignment: FilterModel;
    filterModelStages: FilterModel;
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;

    private rootComponent: any;
    private exportCallback: Function;
    private isSlice = this.appService.getModule() === 'slice';
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.isSlice ? DataLayoutType.PivotGrid : DataLayoutType.Pipeline
    );
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable();
    hidePipeline$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Pipeline;
    }));
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
    private readonly dataSourceURI = 'Lead';
    private readonly totalDataSourceURI = 'Lead/$count';
    private readonly groupDataSourceURI = 'LeadSlice';
    private readonly dateField = 'LeadDate';
    private filters: FilterModel[];
    private filterChanged = false;
    formatting = AppConsts.formatting;

    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.contactService.checkCGPermission(ContactGroup.Client),
            action: this.createLead.bind(this),
            label: this.getHeadlineButtonName()
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
                { contactGroupId: this.contactGroupId.value.toString() },
            ).then((data, additionalData) => {
                this.totalCount = additionalData.totalCount;
                return data;
            });
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
                dataField: 'LeadDate',
                dataType: 'date',
                groupInterval: 'day',
                showTotals: false
            },
            {
                area: 'filter',
                dataField: 'AffiliateCode'
            },
            {
                area: 'filter',
                dataField: 'CampaignCode'
            },
            {
                area: 'filter',
                dataField: 'ChannelCode'
            },
            {
                area: 'filter',
                dataField: 'CompanyName'
            },
            {
                area: 'filter',
                dataField: this.dateField
            },
            {
                area: 'filter',
                dataField: 'EntryUrl'
            },
            {
                area: 'filter',
                dataField: 'Industry'
            },
            {
                area: 'filter',
                dataField: 'Rating'
            },
            {
                area: 'filter',
                dataField: 'SourceCode'
            },
            {
                area: 'filter',
                dataField: 'State'
            },
            {
                area: 'filter',
                dataField: 'Stage'
            },
            {
                area: 'filter',
                dataField: 'StreetAddress'
            },
            {
                area: 'filter',
                dataField: 'Title'
            },
            {
                area: 'filter',
                dataField: 'ZipCode'
            }
        ]
    };
    chartInfoItems: InfoItem[];
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.crmService.loadSliceChartData(
                this.getODataUrl(this.groupDataSourceURI),
                this.filters,
                this.chartComponent.summaryBy.value,
                this.dateField,
                { contactGroupId: this.contactGroupId.value.toString() }
            ).then((result) => {
                this.chartInfoItems = result.infoItems;
                this.totalCount = result.infoItems[0].value;
                return result.items;
            });
        }
    });
    filterChanged$: Observable<FilterModel> = this.filtersService.filterChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    odataFilter$: Observable<string> = this.filterChanged$.pipe(
        startWith(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom)),
        map(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
    );
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    contactsData$: Observable<any> = combineLatest(
        this.contactGroupId$,
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
        switchMap(([contactGroupId, filter, mapArea]: [ContactGroup, any, MapArea]) => this.mapService.loadSliceMapData(
            this.getODataUrl(this.groupDataSourceURI),
            filter,
            mapArea,
            this.dateField,
            { contactGroupId: contactGroupId.toString() }
        )),
        publishReplay(),
        refCount(),
        tap(() => this.mapDataIsLoading = false)
    );
    mapData$: Observable<MapData> = this.mapService.getAdjustedMapData(this.contactsData$);
    mapInfoItems$: Observable<InfoItem[]> = this.mapService.getMapInfoItems(this.contactsData$, this.selectedMapArea$);

    private readonly CONTACT_GROUP_CACHE_KEY = 'CONTACT_GROUP';
    private organizationUnits: OrganizationUnitDto[];
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
    pipelineSelectFields: string[] = ['Id', 'CustomerId', 'Name', 'CompanyName', this.dateField, 'PhotoPublicId', 'Email'];
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );
    assignedUsersSelector = select(
        ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
        { contactGroup: ContactGroup.Client }
    );
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private contactService: ContactsService,
        private leadService: LeadServiceProxy,
        private pipelineService: PipelineService,
        private filtersService: FiltersService,
        private store$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private cacheService: CacheService,
        private sessionService: AppSessionService,
        private http: HttpClient,
        private crmService: CrmService,
        private mapService: MapService,
        private impersonationService: ImpersonationService,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService,
        public appService: AppService
    ) {
        super(injector);
        this.contactGroupOptionInit();
        this.dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.params.contactGroupId = this.contactGroupId.value;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                deserializeDates: false
            }
        };
        this.totalDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                url: this.getODataUrl(this.totalDataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.totalCount = null;
                    request.params.contactGroupId = this.contactGroupId.value;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                onLoaded: (count: any) => {
                    this.totalCount = count;
                }
            })
        });
        this.searchValue = '';
        if (this.userManagementService.checkBankCodeFeature()) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
            this.pipelineSelectFields.push('BankCode');
        }
    }

    ngOnInit() {
        this.loadOrganizationUnits();
        combineLatest(
            this.chartComponent.summaryBy$,
            this.filterChanged$.pipe(startWith(null))
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            filter(() => this.showChart)
        ).subscribe(() => {
            this.chartDataSource.load();
        });

        const queryDataLayoutType$ = this.queryParams$.pipe(
            pluck('dataLayoutType'),
            filter((dataLayoutType: DataLayoutType) => dataLayoutType && dataLayoutType != this.dataLayoutType.value)
        );
        queryDataLayoutType$.subscribe((dataLayoutType) => {
            this.toggleDataLayout(+dataLayoutType);
        });
        queryDataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType == DataLayoutType.DataGrid),
            switchMap(() => this.pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId))
        ).subscribe(() => {
            this.onStagesLoaded.bind(this);
        });

        this.queryParams$.pipe(
            pluck('action'),
            filter((action: string) => action === 'addNew')
        ).subscribe(() => {
            setTimeout(() => this.createLead());
        });

        this.queryParams$.pipe(
            pluck('refresh'),
            filter(Boolean)
        ).subscribe(() => {
            this.refresh();
            this.filterChanged = true;
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

        this.mapInfoItems$.pipe(
            takeUntil(this.destroy$),
            map((mapInfoItems) => mapInfoItems[0].value)
        ).subscribe((totalCount: number) => {
            this.totalCount = totalCount;
        });
    }

    ngAfterViewInit() {
        this.initDataSource();
    }

    private loadOrganizationUnits() {
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
        this.store$.pipe(
            select(OrganizationUnitsStoreSelectors.getOrganizationUnits),
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe((organizationUnits: OrganizationUnitDto[]) => {
            this.organizationUnits = organizationUnits;
        });
    }

    get showPipeline(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Pipeline;
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

    private get contactGroup(): string {
        return invert(ContactGroup)[this.contactGroupId.value.toString()];
    }

    private getUserGroup(contactGroup: string): string {
        return this.l('ContactGroup_' + contactGroup);
    }

    getOrganizationUnitName = (e) => {
        return DataGridService.getOrganizationUnitName(e.OrganizationUnitId, this.organizationUnits);
    }

    toggleToolbar() {
        this.repaintDataGrid();
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    contactGroupOptionInit() {
        let cacheKey = this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY);
        if (this.cacheService.exists(cacheKey)) {
            this.selectedContactGroup = this.cacheService.get(cacheKey);
            this.contactGroupId.next(ContactGroup[this.selectedContactGroup]);
            this.createButtonEnabledSet();
        }
    }

    private createButtonEnabledSet() {
        this.headlineButtons[0].enabled =
            this.contactService.checkCGPermission(this.contactGroupId.value);
    }

    onContentReady(event) {
        if (this.exportCallback)
            this.exportCallback();
        else {
            if (this.showDataGrid)
                this.setGridDataLoaded();
            event.component.columnOption('command:edit', {
                visibleIndex: -1,
                width: 40
            });
        }
    }

    refresh(invalidateDashboard = true, allViews = false) {
        if (this.showPipeline || this.showPivotGrid || this.showDataGrid) {
            setTimeout(() => {
                this.processFilterInternal(allViews ? [ this.pipelineComponent, this ] : undefined);
            });
        }
        if (this.showChart) {
            this.chartDataSource.load();
        }
        this._refresh.next(null);
        if (invalidateDashboard) {
            (this.reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate(quiet = false, stageId?: number) {
        this.lifeCycleSubjectsService.activate$.pipe(first()).subscribe(() => {
            this.refresh(false, true);
        });
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedClientKeys = [];
        this.dataLayoutType.next(dataLayoutType);
        this.initToolbarConfig();
        this.pipelineService.toggleDataLayoutType(this.dataLayoutType.value);
        this.initDataSource();
        if (!this.showPipeline) {
            this.pipelineComponent.deselectAllCards();
            if (this.showDataGrid) {
                setTimeout(() => this.dataGrid.instance.repaint());
            }
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            if (!this.showPipeline) {
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
    }

    initFilterConfig(): void {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'name',
                    items: { Name: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    caption: 'Email',
                    items: { Email: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'creation',
                    field: this.dateField,
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
                }),
                this.filterModelStages = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'stages',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource$: this.store$.pipe(select(PipelinesStoreSelectors.getPipelineTreeSource({purpose: this.pipelinePurposeId}))),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
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
                new FilterModel({
                    component: FilterInputsComponent,
                    caption: 'SourceCode',
                    items: { SourceCode: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'Industry',
                    items: { Industry: new FilterItemModel() }
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
                new FilterModel({
                    component: FilterInputsComponent,
                    caption: 'Campaign',
                    field: 'CampaignCode',
                    items: { CampaignCode: new FilterItemModel() }
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
            ], this._activatedRoute.snapshot.queryParams);
        }
        this.filtersService.apply(() => {
            this.selectedClientKeys = [];
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this.manageDisabled = !this.contactService.checkCGPermission(this.contactGroupId.value);
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                                this.pivotGridComponent.pivotGrid.instance.updateDimensions();
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
                            placeholder: this.l('Search') + ' ' + this.l('Leads').toLowerCase(),
                            onValueChanged: (e) => this.searchValueChange(e)
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
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId.value, 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected
                        }
                    },
                    {
                        name: 'stage',
                        disabled: this.manageDisabled,
                        action: this.toggleStages.bind(this),
                        attr: {
                            'filter-selected': this.filterModelStages && this.filterModelStages.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId.value, 'ManageListsAndTags'),
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId.value, 'ManageListsAndTags'),
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId.value, 'ManageRatingAndStars'),
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId.value, 'ManageRatingAndStars'),
                        action: this.toggleStars.bind(this),
                        attr: {
                            'filter-selected': this.filterModelStar && this.filterModelStar.isSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'delete',
                        disabled: !this.selectedLeads.length ||
                        !this.contactService.checkCGPermission(this.contactGroupId.value) ||
                        this.selectedLeads.length > 1 && !this.isGranted(AppPermissions.CRMBulkUpdates),
                        action: this.deleteLeads.bind(this)
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
                                    action: this.exportData.bind(this, options => {
                                        if (this.showPivotGrid) {
                                            this.pivotGridComponent.pivotGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(
                                                    null,
                                                    'PivotGrid',
                                                    this.getUserGroup(this.contactGroup)
                                                )
                                            );
                                            this.pivotGridComponent.pivotGrid.instance.exportToExcel();
                                        } else if (this.showPipeline || this.showDataGrid) {
                                            return this.exportToXLS(
                                                options,
                                                null,
                                                this.getUserGroup(this.contactGroup)
                                            );
                                        }
                                    }),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                    visible: this.showDataGrid || this.showPipeline || this.showPivotGrid
                                },
                                {
                                    action: this.exportData.bind(this, options => this.exportToCSV(
                                        options,
                                        null,
                                        this.getUserGroup(this.contactGroup)
                                    )),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.showPipeline || this.showDataGrid
                                },
                                {
                                    action: this.exportData.bind(this, options => this.exportToGoogleSheet(
                                        options,
                                        null,
                                        this.getUserGroup(this.contactGroup)
                                    )),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet',
                                    visible: this.showPipeline || this.showDataGrid
                                },
                                {
                                    type: 'downloadOptions',
                                    visible: this.showPipeline || this.showDataGrid
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
                        name: 'pipeline',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                        options: {
                            checkPressed: () => this.showPipeline
                        }
                    },
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
        ];
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
    }

    exportPipelineSelectedItemsFilter(dataSource) {
        let selectedLeads = this.pipelineComponent.getSelectedEntities();
        if (selectedLeads.length) {
            dataSource.filter(selectedLeads.map((lead) => {
                return ['Id', '=', lead.Id];
            }).reduce((r, a) => r.concat([a, 'or']), []));
        }
        return selectedLeads.length;
    }

    private exportToImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format, this.getUserGroup(this.contactGroup));
        } else if (this.showMap) {
            this.mapComponent.exportTo(format, this.getUserGroup(this.contactGroup));
        }
    }

    exportData(callback, options) {
        if (this.showPipeline) {
            let importOption = 'all',
                instance = this.dataGrid.instance,
                dataSource = instance && instance.getDataSource(),
                checkExportOption = (dataSource, ignoreFilter = false) => {
                    if (options == importOption)
                        ignoreFilter || this.processFilterInternal([this]);
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

    toggleCompactView() {
        this.pipelineService.toggleContactView();
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.processFilterInternal();
        }
    }

    processFilterInternal(cxts?: any[]) {
        if (this.showPipeline) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }

        if (this.showPipeline || this.showDataGrid || this.showPivotGrid) {
            let contexts = cxts && cxts.length ? cxts : [ this.showPipeline ? this.pipelineComponent : this ];
            contexts.forEach(context => {
                if (context && context.processODataFilter) {
                    const filterQuery = context.processODataFilter.call(
                        context,
                        this.showPivotGrid ? this.pivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                        this.dataSourceURI,
                        this.filters,
                        this.filtersService.getCheckCustom
                    );
                    if (this.showDataGrid) {
                        this.totalDataSource['_store']['_url'] = this.getODataUrl(this.totalDataSourceURI, filterQuery);
                        this.totalDataSource.load();
                    }
                }
            });
        }
    }

    initDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => this.pipelineDataSource = cloneDeep(this.dataSource));
        } else if (this.showDataGrid) {
            this.totalDataSource.load();
            this.setDataGridInstance();
        } else if (this.showPivotGrid) {
            this.setPivotGridInstance();
        } else if (this.showChart) {
            this.setChartInstance();
        }
    }

    private setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.isDataLoaded = false;
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

    createLead() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => {
                    this.refresh();
                    this.filterChanged = true;
                },
                isInLeadMode: true,
                customerType: ContactGroup[this.selectedContactGroup]
            }
        });
    }

    onSelectionChanged($event) {
        this.selectedLeads = $event.component.getSelectedRowsData();
    }

    onStagesLoaded($event) {
        this.stages = $event.stages.map((stage) => {
            return {
                id: this.pipelineService.getPipeline(
                    this.pipelinePurposeId).id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name
            };
        });

        this.initToolbarConfig();
    }

    updateLeadsStage($event) {
        if (this.isGranted(AppPermissions.CRMBulkUpdates)) {
            this.stagesComponent.tooltipVisible = false;
            this.pipelineService.updateEntitiesStage(
                this.pipelinePurposeId,
                this.selectedLeads,
                $event.name
            ).subscribe((declinedList) => {
                this.filterChanged = true;
                if (this.showPipeline)
                    this.pipelineComponent.refresh();
                else {
                    let gridInstance = this.dataGrid && this.dataGrid.instance;
                    if (gridInstance && declinedList && declinedList.length)
                        gridInstance.selectRows(declinedList.map(item => item.Id), false);
                    else
                        gridInstance.clearSelection();
                }
                this.notify.success(this.l('StageSuccessfullyUpdated'));
            });
        }
    }

    showLeadDetails(event) {
        let leadId = event.data && event.data.Id,
            clientId = event.data && event.data.CustomerId;
        if (!leadId || !clientId)
            return;

        this.searchClear = false;
        let orgId = event.data.OrganizationId;
        event.component && event.component.cancelEditData();
        setTimeout(() => {
            this._router.navigate(['app/crm/contact', clientId, 'lead', leadId].concat(orgId ? ['company', orgId] : []),
                {queryParams: {referrer: 'app/crm/leads', dataLayoutType: this.dataLayoutType.value}});
        });
    }

    onCellClick($event) {
        let col = $event.column;
        if (col && col.command)
            return;
        this.showLeadDetails($event);
    }

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
    }

    toggleStages() {
        this.stagesComponent.toggle();
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

    deleteLeads() {
        let selectedIds: number[] = this.selectedLeads.map(lead => lead.Id);
        this.message.confirm(
            this.l('LeadsDeleteWarningMessage'),
            isConfirmed => {
                if (isConfirmed)
                    this.deleteLeadsInternal(selectedIds);
            }
        );
    }

    private deleteLeadsInternal(selectedIds: number[]) {
        let request = selectedIds.length > 1 ?
            this.leadService.deleteLeads(selectedIds) :
            this.leadService.deleteLead(selectedIds[0]);

        request.subscribe(() => {
            this.refresh();
            this.dataGrid.instance.deselectAll();
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.filterChanged = true;
        });
    }

    ngOnDestroy() {
        this.deactivate();
        this.lifeCycleSubjectsService.destroy.next();
    }

    activate() {
        super.activate();
        this.lifeCycleSubjectsService.activate.next();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.showHostElement(() =>
            this.pipelineComponent.detectChanges()
        );
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        if (!this.showPipeline) {
            this.itemDetailsService.setItemsSource(ItemTypeEnum.Lead, this.dataGrid.instance.getDataSource());
        }
        this.hideHostElement();
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCardClick({entity, entityStageDataSource, loadMethod}) {
        this.showLeadDetails({data: entity});
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Lead, entityStageDataSource, loadMethod);
    }

    onLeadStageChanged(lead) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.getVisibleRows().some((row) => {
                if (lead.Id == row.data.Id) {
                    row.data.Stage = lead.Stage;
                    row.data.StageId = lead.StageId;
                    return true;
                }
            });
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

    getHeadlineButtonName() {
        return this.l('CreateNew') + ' ' + this.getUserGroup(this.selectedContactGroup).slice(0, -1);
    }

    onContactGroupChanged(event) {
        if (event.previousValue != event.value) {
            this.totalCount = null;
            this.contactGroupId.next(ContactGroup[event.value]);
            this.headlineButtons[0].label = this.getHeadlineButtonName();
            this.cacheService.set(this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY), event.value);
            this.createButtonEnabledSet();
            this.filterChanged = true;
            this.initToolbarConfig();
            if (!this.showPipeline)
                this.refresh(false);
        }
    }

    updateTotalCount(totalCount: number) {
        this.totalCount = totalCount;
    }
}