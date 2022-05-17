/** Core imports */
import { AfterViewInit, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Params, RouteReuseStrategy } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { select, Store } from '@ngrx/store';
import {
    Subject,
    BehaviorSubject,
    combineLatest,
    concat,
    forkJoin,
    from,
    merge,
    Observable,
    of,
    interval,
    ReplaySubject
} from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    finalize,
    first,
    map,
    mapTo,
    pluck,
    publishReplay,
    refCount,
    skip,
    switchMap,
    takeUntil,
    tap,
    withLatestFrom,
    debounceTime
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import cloneDeep from 'lodash/cloneDeep';
import invert from 'lodash/invert';
import pluralize from 'pluralize';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import {
    AppStore,
    ContactAssignedUsersStoreSelectors,
    ListsStoreSelectors,
    RatingsStoreSelectors,
    StarsStoreSelectors,
    TagsStoreSelectors
} from '@app/store';
import {
    OrganizationUnitsStoreActions,
    OrganizationUnitsStoreSelectors,
    PipelinesStoreActions,
    PipelinesStoreSelectors
} from '@app/crm/store';
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
import {
    ContactServiceProxy,
    LayoutType,
    LeadServiceProxy,
    OrganizationUnitDto,
    PipelineDto,
    PipelineServiceProxy,
    PipelineRenameInput,
    StageDto,
    UpdateLeadSourceContactsInput
} from '@shared/service-proxies/service-proxies';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
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
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { SourceFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { FilterStatesService } from '@shared/filters/states/filter-states.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { FilterMultilineInputComponent } from '@root/shared/filters/multiline-input/filter-multiline-input.component';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterMultilineInputModel } from '@root/shared/filters/multiline-input/filter-multiline-input.model';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { LeadDto } from '@app/crm/leads/lead-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { LeadFields } from '@app/crm/leads/lead-fields.enum';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { MessageService } from 'abp-ng2-module';
import { EntityCheckListDialogComponent } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { TypeItem } from '@app/crm/shared/types-dropdown/type-item.interface';
import { CreateEntityDialogData } from '@shared/common/create-entity-dialog/models/create-entity-dialog-data.interface';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './leads.component.less'
    ],
    providers: [LeadServiceProxy, ContactServiceProxy, LifecycleSubjectsService, MapService]
})
export class LeadsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('stageList') stagesComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent, {static: true}) chartComponent: ChartComponent;
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;
    @ViewChild('sourceList') sourceComponent: SourceContactListComponent;

    private readonly dataSourceURI = 'Lead';
    private readonly totalDataSourceURI = 'Lead/$count';
    private readonly groupDataSourceURI = 'LeadSlice';
    private readonly dateField = 'LeadDate';
    private _selectedLeads: LeadDto[];
    rowsViewHeight: number;
    get selectedLeads(): LeadDto[] {
        return this._selectedLeads || [];
    }
    set selectedLeads(leads: LeadDto[]) {
        this._selectedLeads = leads;
        this.selectedClientKeys = [];
        leads.forEach((lead: LeadDto) => {
            if (lead && lead.CustomerId)
                this.selectedClientKeys.push(lead.CustomerId);
        });
        this.initToolbarConfig();
    }
    impersonationIsGranted = this.permission.isGranted(
        AppPermissions.AdministrationUsersImpersonation
    );
    pipelineEditIsGranted =  this.permission.isGranted(
        AppPermissions.CRMPipelinesConfigure
    );
    actionEvent: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    actionMenuGroups: ActionMenuGroup[];
    /** Get all leads pipelines */
    pipelines$: Observable<PipelineDto[]> = this.store$.pipe(
        select(PipelinesStoreSelectors.getPipelines({
            purpose: this.pipelinePurposeId
        })),
        filter((pipelines: PipelineDto[]) => !!pipelines)
    );
    pipelineTypes$: Observable<TypeItem[]> = this.pipelines$.pipe(
        map((pipelines: PipelineDto[]) => {
            return pipelines.map((pipeline: PipelineDto) => {
                return {
                    text: pipeline.name,
                    value: pipeline.id
                };
            });
        })
    );
    private readonly CONTACT_GROUP_CACHE_KEY = 'SELECTED_PIPELINE_ID';
    private readonly cacheKey = this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY, this.dataSourceURI);
    selectedPipelineId: number;
    private _selectedPipelineId: ReplaySubject<number> = new ReplaySubject(1);
    selectedPipelineId$: Observable<number> = this._selectedPipelineId.asObservable().pipe(
        distinctUntilChanged()
    );
    selectedPipeline$: Observable<PipelineDto> = combineLatest(
        this.pipelines$,
        this.selectedPipelineId$
    ).pipe(
        map(([pipelines, pipelineId]: [PipelineDto[], number]) => {
            return pipelines.find((pipeline: PipelineDto) => pipeline.id == pipelineId);
        })
    );
    isPropertyPipeline$: Observable<boolean> = this.selectedPipeline$
        .pipe(
            map(selectedPipeline => selectedPipeline.entityTypeSysId &&
                    (selectedPipeline.entityTypeSysId == EntityTypeSys.PropertyAcquisition || selectedPipeline.entityTypeSysId.startsWith(EntityTypeSys.PropertyRentAndSale)))
        );
    /** Get pipeline contactGroup @todo remove using of contact group in all places */
    selectedContactGroup$: Observable<ContactGroup> = this.selectedPipeline$.pipe(
        map((pipeline: PipelineDto) => pipeline.contactGroupId)
    );
    selectedContactGroup: ContactGroup;
    contactGroupNames = invert(ContactGroup);
    selectedPipelineName$: Observable<string> = this.selectedPipeline$.pipe(
        map((selectedPipeline: PipelineDto) => selectedPipeline.name)
    );
    userGroupText$: Observable<string> = this.selectedPipelineName$.pipe(
        map((selectedPipelineName: string) => this.getUserGroup(selectedPipelineName))
    );
    userGroupText: string;

    stages = [];
    pipelineDataSource: any;
    collection: any;
    selectedClientKeys = [];
    manageDisabled = true;
    manageCGPermission = '';
    sliceStorageKey = 'CRM_Contacts_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;

    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelSource: FilterModel;
    filterModelAssignment: FilterModel;
    filterDate = new FilterModel({
        component: FilterCalendarComponent,
        operator: { from: 'ge', to: 'le' },
        caption: 'creation',
        field: this.dateField,
        items: { from: new FilterItemModel(), to: new FilterItemModel() },
        options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
    });
    filterModelOrgUnit: FilterModel;
    filterModelStages: FilterModel;
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;
    filterCountryStates: FilterModel = new FilterModel({
        component: FilterStatesComponent,
        caption: 'states',
        items: {
            countryStates: new FilterStatesModel(this.filterStatesService)
        }
    });
    pipelineFilter = new FilterModel({
        hidden: true,
        caption: 'pipelineId',
        items: {
            PipelineId: new FilterItemModel({ isClearAllowed: false }, true)
        }
    });

    private exportCallback: Function;
    private isSlice = this.appService.getModule() === 'slice';
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.isSlice ? DataLayoutType.PivotGrid : DataLayoutType.Pipeline
    );
    private gridCompactView: BehaviorSubject<Boolean> = new BehaviorSubject(true);
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable().pipe(tap((layoutType) => {
        this.appService.isClientSearchDisabled = layoutType != DataLayoutType.DataGrid;
    }));
    showCompactView$: Observable<Boolean> = combineLatest(
        this.dataLayoutType$,
        this.pipelineService.compactView$,
        this.gridCompactView.asObservable(),
    ).pipe(
        map(([layoutType, pipelineCompactView, gridCompactView]: [DataLayoutType, Boolean, Boolean]) => {
            return layoutType == DataLayoutType.Pipeline ? pipelineCompactView : gridCompactView;
        })
    );
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
    private filters: FilterModel[];
    formatting = AppConsts.formatting;

    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    public headlineButtons$: Observable<HeadlineButton[]> = this.selectedPipeline$.pipe(
        map((selectedPipeline: PipelineDto) => {
            let localizedLabel = this.l('Pipeline_' + selectedPipeline.name + '_Single');
            localizedLabel = this.l('Pipeline_' + selectedPipeline.name + '_Single') !== localizedLabel
                ? localizedLabel
                : pluralize.singular(selectedPipeline.name);
            return [
                {
                    enabled: this.permission.checkCGPermission([selectedPipeline.contactGroupId]),
                    action: this.createLead.bind(this),
                    label: this.l('CreateNew') + ' ' + localizedLabel
                }
            ];
        })
    );
    permissions = AppPermissions;
    pivotGridDataIsLoading: boolean;
    searchValue: string = this._activatedRoute.snapshot.queryParams.search || '';
    searchClear = false;
    dataSourceConfig: any;
    private pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;
            return this.selectedContactGroup$.pipe(
                first(),
                switchMap((selectedContactGroup: ContactGroup) => {
                    return this.crmService.loadSlicePivotGridData(
                        this.getODataUrl(this.groupDataSourceURI),
                        this.filters,
                        loadOptions,
                        { contactGroupId: selectedContactGroup.toString() }
                    );
                })
            ).toPromise();
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
                dataField: 'SourceAffiliateCode'
            },
            {
                area: 'filter',
                dataField: 'SourceCampaignCode'
            },
            {
                area: 'filter',
                dataField: 'SourceChannelCode'
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
                dataField: 'SourceEntryUrl'
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
    chartDataUrl: string;
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            return this.odataRequestValues$.pipe(
                first(),
                withLatestFrom(this.selectedContactGroup$),
                switchMap(([odataRequestValues, selectedContactGroup]: [ODataRequestValues, ContactGroup]) => {
                    const chartDataUrl = this.chartDataUrl || this.crmService.getChartDataUrl(
                        this.getODataUrl(this.groupDataSourceURI),
                        odataRequestValues,
                        this.chartComponent.summaryBy.value,
                        this.dateField,
                        { contactGroupId: selectedContactGroup.toString() }
                    );
                    return this.httpClient.get(chartDataUrl);
                })
            ).toPromise().then((result: any) => {
                result = this.crmService.parseChartData(result);
                this.chartDataUrl = null;
                this.chartInfoItems = result.infoItems;
                return result.items;
            });
        }
    });
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    odataRequestValues$: Observable<ODataRequestValues>;
    loadTotalsRequest: Subject<ODataRequestValues> = new Subject<ODataRequestValues>(); 
    loadTotalsRequest$: Observable<ODataRequestValues> = this.loadTotalsRequest.asObservable();
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    mapData$: Observable<MapData>;
    mapInfoItems$: Observable<InfoItem[]>;
    private organizationUnits: OrganizationUnitDto[];
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
    isSmsAndEmailSendingAllowed: boolean = false;
    readonly leadFields: KeysEnum<LeadDto> = LeadFields;
    pipelineSelectFields: string[] = [
        this.leadFields.Id,
        this.leadFields.CustomerId,
        this.leadFields.Name,
        this.leadFields.CompanyName,
        this.leadFields[this.dateField],
        this.leadFields.PhotoPublicId,
        this.leadFields.PropertyName,
        this.leadFields.PropertyId,
        this.leadFields.Email,
        this.leadFields.Phone,
        this.leadFields.Amount
    ]; 
    loadAssignUsersList: Subject<any> = new Subject<null>();
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );
    totalCount: number;
    totalErrorMsg: string;
    toolbarConfig: ToolbarGroupModel[];
    private _activate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private activate$: Observable<boolean> = this._activate.asObservable();
    isBankCodeLayoutType: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    isMergeAllowed = this.isGranted(AppPermissions.CRMMerge);
    hasBulkPermission: boolean = this.permission.isGranted(AppPermissions.CRMBulkUpdates);
    assignedUsersSelector$: any = this.selectedContactGroup$.pipe(
        map((selectedContactGroup: ContactGroup) => {
            return select(
                ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
                { contactGroup: selectedContactGroup }
            );
        })
    );

    constructor(
        injector: Injector,
        private authService: AppAuthService,
        private contactService: ContactsService,
        private leadService: LeadServiceProxy,
        private pipelineService: PipelineService,
        private pipelineServiceProxy: PipelineServiceProxy,
        private filtersService: FiltersService,
        private store$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private cacheService: CacheService,
        private sessionService: AppSessionService,
        private crmService: CrmService,
        private mapService: MapService,
        private impersonationService: ImpersonationService,
        private filterStatesService: FilterStatesService,
        private nameParserService: NameParserService,
        private messageService: MessageService,
        private httpClient: HttpClient,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService,
        public appService: AppService
    ) {
        super(injector);
        this.setInitialPipelineId();
        this.listenAndUpdateContactGroup();
        this.crmService.updateDateFilter(this._activatedRoute.snapshot.queryParams, this.filterDate);
        this.crmService.updateCountryStateFilter(this._activatedRoute.snapshot.queryParams, this.filterCountryStates);
        this.selectedPipelineId$.pipe(first()).subscribe((selectedPipelineId: number) => {
            this.pipelineFilter.items.PipelineId.value = selectedPipelineId;
            this.dataSourceConfig = {
                uri: this.dataSourceURI,
                requireTotalCount: true,
                store: {
                    type: 'odata',
                    key: this.leadFields.Id,
                    url: this.getODataUrl(this.dataSourceURI, this.getInitialFilter()),
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.contactGroupId = this.selectedContactGroup;
                        request.params.$select = DataGridService.getSelectFields(
                            this.dataGrid,
                            [
                                this.leadFields.Id,
                                this.leadFields.CustomerId,
                                this.leadFields.PropertyId,
                                this.leadFields.OrganizationId,
                                this.leadFields.UserId,
                                this.leadFields.Email,
                                this.leadFields.Phone
                            ]
                        );
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    onLoaded: (records) => {
                        let dataSource = this.showPipeline ? this.pipelineDataSource : this.dataSource;
                        if (records instanceof Array)
                            dataSource['entities'] = (dataSource['entities'] || []).concat(records);
                        this.loadTotalsRequest.next();
                    },
                    errorHandler: (error) => {
                        setTimeout(() => this.isDataLoaded = true);
                    },
                    deserializeDates: false
                }
            };
            this.dataSource = new DataSource(this.dataSourceConfig);
            this.dataSource.exportIgnoreOnLoaded = true;
            this.totalDataSource = new DataSource({
                paginate: false,
                store: new ODataStore({
                    version: AppConsts.ODataVersion,
                    beforeSend: (request) => {
                        this.totalCount = this.totalErrorMsg = undefined;
                        request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                        request.params.contactGroupId = this.selectedContactGroup;
                        request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    },
                    onLoaded: (count: any) => {
                        let dataSource = this.showPipeline ? this.pipelineDataSource : this.dataSource;
                        if (!isNaN(count))
                            dataSource['total'] = this.totalCount = count;
                    },
                    errorHandler: (e: any) => {
                        this.totalErrorMsg = this.l('AnHttpErrorOccured');
                    }
                })
            });
            this.odataRequestValues$ = concat(
                this.oDataService.getODataFilter(
                    [this.filterDate, this.filterCountryStates, this.pipelineFilter],
                    this.filtersService.getCheckCustom
                ).pipe(first()),
                this.filterChanged$.pipe(
                    switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
                )
            ).pipe(
                filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues)
            );
            this.handleTotalCountUpdate();
            this.handleLayoutDataUpdate();
            this.handleDataGridUpdate();
            this.initLayoutDataSource();
        });
        this.addBankCodeField();
    }

    ngOnInit() {
        this.loadOrganizationUnits();
        this.handleMapUpdate();
        this.handleModuleChange();
        this.activate();
        this.handleFiltersPining();
        this.handleUserGroupTextUpdate();
        this.setupFilterCacheChangeInterval();
    }

    ngAfterViewInit() {
        this.handleChartUpdate();
        this.selectedPipelineId$.pipe(takeUntil(this.destroy$)).subscribe((selectedPipelineId: number) => {
            this.selectedPipelineId = selectedPipelineId;
        });
    }

    private initContactGroupRelatedProperties() {
        this.isSmsAndEmailSendingAllowed = this.permission.checkCGPermission(
            [this.selectedContactGroup],
            'ViewCommunicationHistory.SendSMSAndEmail'
        );

        if (this.isSmsAndEmailSendingAllowed)
            this.pipelineSelectFields.push(this.leadFields.Phone);

        this.actionMenuGroups = [
            {
                key: '',
                visible: true,
                items: [
                    {
                        text: this.l('SMS'),
                        class: 'sms fa fa-commenting-o',
                        action: (data?) => {
                            this.contactService.showSMSDialog({
                                phoneNumber: (data || this.actionEvent.data || this.actionEvent).Phone
                            });
                        },
                        checkVisible: (lead: LeadDto) => this.permission.checkCGPermission([this.selectedContactGroup], 'ViewCommunicationHistory.SendSMSAndEmail')
                    },
                    {
                        text: this.l('SendEmail'),
                        class: 'email',
                        action: (data?) => {
                            this.contactService.showEmailDialog({
                                contactId: (data || this.actionEvent.data || this.actionEvent).CustomerId
                            }).subscribe();
                        },
                        checkVisible: (lead: LeadDto) => this.permission.checkCGPermission([this.selectedContactGroup], 'ViewCommunicationHistory.SendSMSAndEmail')
                    },
                ]
            },
            {
                key: '',
                visible: true,
                items: [
                    {
                        text: this.l('LoginAsThisUser'),
                        class: 'login',
                        checkVisible: (lead: LeadDto) => {
                            return !!lead.UserId && (
                                this.impersonationIsGranted ||
                                this.permission.checkCGPermission([this.selectedContactGroup], 'UserInformation.AutoLogin')
                            );
                        },
                        action: (data?) => {
                            const lead: LeadDto = data || this.actionEvent.data || this.actionEvent;
                            this.impersonationService.impersonate(lead.UserId, this.appSession.tenantId);
                        }
                    },
                    {
                        text: this.l('LoginToPortal'),
                        class: 'login',
                        checkVisible: (lead: LeadDto) => !!lead.UserId && !!AppConsts.appMemberPortalUrl
                            && (
                                this.impersonationIsGranted ||
                                this.permission.checkCGPermission([this.selectedContactGroup], 'UserInformation.AutoLogin')
                            ),
                        action: (data?) => {
                            const lead: LeadDto = data || this.actionEvent.data || this.actionEvent;
                            this.impersonationService.impersonate(lead.UserId, this.appSession.tenantId, AppConsts.appMemberPortalUrl);
                        }
                    },
                    {
                        text: this.l('NotesAndCallLog'),
                        class: 'notes',
                        action: (data?) => {
                            this.showLeadDetails({ data: data || this.actionEvent }, 'notes');
                        },
                        button: {
                            text: '+' + this.l('Add'),
                            action: (data?) => {
                                this.showLeadDetails({ data: data || this.actionEvent }, 'notes', {
                                    addNew: true
                                });
                            },
                            checkVisible: () => this.permission.checkCGPermission([this.selectedContactGroup])
                        }
                    },
                    {
                        text: this.l('Appointment'),
                        class: 'appointment',
                        disabled: true,
                        action: () => {}
                    },
                    {
                        text: this.l('Orders'),
                        class: 'orders',
                        action: (data?) => {
                            this.showLeadDetails({ data: data || this.actionEvent }, 'invoices');
                        }
                    },
                    {
                        text: this.l('Notifications'),
                        class: 'notifications',
                        disabled: true,
                        action: () => {}
                    },
                    {
                        getText: (lead: LeadDto) => {
                            const stage: StageDto = this.pipelineService.getStageByName(
                                this.pipelinePurposeId,
                                lead.Stage,
                                this.selectedContactGroup,
                                this.selectedPipelineId
                            );
                            return this.l('Checklist') + ' (' + lead.StageChecklistPointDoneCount + '/' + stage.checklistPoints.length + ')';
                        },
                        class: 'checklist',
                        checkVisible: (lead: LeadDto) => {
                            const stage = this.pipelineService.getStageByName(
                                this.pipelinePurposeId,
                                lead.Stage,
                                this.selectedContactGroup,
                                this.selectedPipelineId
                            );
                            return !!(!stage.isFinal && stage.checklistPoints && stage.checklistPoints.length);
                        },
                        action: (data?) => {
                            this.openEntityChecklistDialog(data);
                        }
                    }
                ]
            },
            {
                key: '',
                visible: true,
                items: [
                    {
                        text: this.l('Delete'),
                        class: 'delete',
                        disabled: false,
                        action: (data?) => {
                            this.deleteLeads([(data || this.actionEvent.data || this.actionEvent).Id]);
                        },
                        checkVisible: (lead: LeadDto) => this.permission.checkCGPermission([this.selectedContactGroup])
                    },
                    {
                        text: this.l('EditRow'),
                        class: 'edit',
                        action: (data?) => this.showLeadDetails({ data: data || this.actionEvent }),
                        checkVisible: (lead: LeadDto) => this.permission.checkCGPermission([this.selectedContactGroup])
                    }
                ]
            }
        ];
    }

    private handleUserGroupTextUpdate() {
        this.userGroupText$.pipe(takeUntil(this.lifeCycleSubjectsService.destroy$))
            .subscribe((userGroupText: string) => {
                 this.userGroupText = userGroupText;
            });
    }

    private setInitialPipelineId() {
        this.pipelines$.subscribe((pipelines: PipelineDto[]) => {
            /** Get initial opened pipeline from queryParams or cache */
            let pipelineId = this._activatedRoute.snapshot.queryParams.pipelineId || this.cacheService.get(this.cacheKey);
            /** If cached pipeline id is not in the pipeline list - then it was deleted and we have to get the first pipeline */
            if (!pipelineId || pipelines.every((pipeline: PipelineDto) => pipeline.id !== pipelineId)) {
                pipelineId = pipelines[0].id;
            }
            /** If there is contactGroup in query params - then find first pipeline with
             *  that contactGroup and set its id, else set first pipeline id */
            const contactGroup = this._activatedRoute.snapshot.queryParams.contactGroup;
            if (contactGroup) {
                const pipeline = pipelines.find((pipeline: PipelineDto) => {
                    return pipeline.contactGroupId === ContactGroup[contactGroup];
                });
                if (pipeline) {
                    pipelineId = pipeline.id;
                }
            }
            this._selectedPipelineId.next(pipelineId);
        });
    }

    private listenAndUpdateContactGroup() {
        this.selectedContactGroup$.pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
        ).subscribe((selectedContactGroup: ContactGroup) => {
            this.selectedContactGroup = selectedContactGroup;
            this.initContactGroupRelatedProperties();
        });
    }

    private addBankCodeField() {
        if (this.userManagementService.checkBankCodeFeature()) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
            this.pipelineSelectFields.push('BankCode');
        }
    }

    private getInitialFilter() {
        return [
            this.filterDate.getODataFilterObject(),
            this.filtersService.getCheckCustom(this.filterCountryStates),
            this.pipelineFilter.getODataFilterObject()
        ];
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
                    this.pivotGridComponent.dataGrid.instance.updateDimensions();
                }, 1001);
            }
        });
    }

    private handleTotalCountUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            debounceTime(300),
            filter(() => !this.showPipeline),
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(([odataRequestValues, ]: [ODataRequestValues, null]) => {
                return this.loadTotalsRequest$.pipe(first(), map(() => odataRequestValues));
            })
        ).subscribe((odataRequestValues: ODataRequestValues) => {
            let url = this.getODataUrl(this.totalDataSourceURI,
                odataRequestValues.filter, null, odataRequestValues.params);
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_url'] = url;
                this.totalDataSource.load();
            }
        });
    }

    private handleLayoutDataUpdate() {
        [
            DataLayoutType.PivotGrid,
            DataLayoutType.Pipeline
        ].forEach(layout => {
            this.listenForUpdate(layout).pipe(
                debounceTime(300)
            ).subscribe(() => {
                this.processFilterInternal();
            });
        });
    }

    private handleDataGridUpdate() {
        this.listenForUpdate(DataLayoutType.DataGrid).pipe(
            skip(1), debounceTime(300)
        ).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handleChartUpdate() {
        combineLatest(
            this.chartComponent.summaryBy$,
            this.listenForUpdate(DataLayoutType.Chart)
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe(([summaryBy, [odataRequestValues, contactGroup ]]: [SummaryBy, [ODataRequestValues, ContactGroup ]]) => {
            const chartDataUrl = this.crmService.getChartDataUrl(
                this.getODataUrl(this.groupDataSourceURI),
                odataRequestValues,
                summaryBy,
                this.dateField,
                { contactGroupId: contactGroup.toString() }
            );
            if (!this.oDataService.requestLengthIsValid(chartDataUrl)) {
                this.message.error(this.l('QueryStringIsTooLong'));
            } else {
                this.chartDataUrl = chartDataUrl;
                this.chartDataSource.load();
            }
        });
    }

    private handleMapUpdate() {
        const contactsData$: Observable<any> = this.getContactsData();
        this.mapData$ = this.mapService.getAdjustedMapData(contactsData$);
        this.mapInfoItems$ = this.mapService.getMapInfoItems(contactsData$, this.selectedMapArea$);
    }

    private handleModuleChange() {
        merge(
            this.dataLayoutType$,
            this.activate$.pipe(filter(Boolean))
        ).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.crmService.handleModuleChange(this.dataLayoutType.value);
        });
    }

    private handleQueryParams() {
        this.handleDataLayoutParam();
        this.handleContactGroupParam();
        this.handleFilterParams();
        this.handleAddNewParam();
        this.handleRefreshParam();
    }

    private handleFilterParams() {
        this.queryParams$.pipe(
            skip(1),
            /** Wait for activation to update the filters */
            switchMap((queryParams: Params) => this.activate$.pipe(
                filter(Boolean),
                mapTo(queryParams))
            )
        ).subscribe((params: Params) => {
            let filtersToChange = [];
            const searchValueChanged = params.search && this.searchValue !== params.search;
            if (searchValueChanged) {
                this.searchValue = params.search;
                this.initToolbarConfig();
            }
            if (this.crmService.updateCountryStateFilter(params, this.filterCountryStates)) {
                filtersToChange.push(this.filterCountryStates);
            }
            if (this.crmService.updateDateFilter(params, this.filterDate)) {
                filtersToChange.push(this.filterDate);
            }
            if (filtersToChange.length) {
                this.filtersService.change(filtersToChange);
            } else if (searchValueChanged) {
                setTimeout(() => this.filtersService.clearAllFilters());
                this.refresh();
            }
        });
    }

    mapItemClick(params: Params) {
        this.toggleDataLayout(DataLayoutType.DataGrid);
        this.crmService.updateCountryStateFilter(params, this.filterCountryStates);
        this.filtersService.change([this.filterCountryStates]);
    }

    private handleContactGroupParam() {
        this.queryParams$.pipe(
            pluck('contactGroup'),
            filter((contactGroup: string) => contactGroup && this.selectedContactGroup !== contactGroup),
            withLatestFrom(this.pipelines$)
        ).subscribe(([contactGroup, pipelines]: [string, PipelineDto[]]) => {
            /** If contact group is in query params - then update pipelineId with the
             *  first pipeline that has that contact group
             *  @todo remove using of contact group in future */
            const pipeline: PipelineDto = pipelines.find((pipeline: PipelineDto) => {
                return pipeline.contactGroupId === ContactGroup[contactGroup];
            });
            if (pipeline) {
                this._selectedPipelineId.next(pipeline.id);
            }
            this.clearQueryParams();
        });
    }

    private handleDataLayoutParam() {
        const queryDataLayoutType$ = this.queryParams$.pipe(
            pluck('dataLayoutType'),
            filter((dataLayoutType: DataLayoutType) => dataLayoutType && dataLayoutType != this.dataLayoutType.value)
        );
        queryDataLayoutType$.subscribe((dataLayoutType: DataLayoutType) => {
            this.toggleDataLayout(+dataLayoutType);            
        });
        queryDataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType == DataLayoutType.DataGrid),
            withLatestFrom(this.selectedPipelineId$),
            switchMap(([dataLayoutType, selectedPipelineId]: [DataLayoutType, number]) => {
                return this.pipelineService.getPipelineDefinitionObservable(
                    this.pipelinePurposeId, this.selectedContactGroup, selectedPipelineId
                );
            })
        ).subscribe((pipelineDefinition: PipelineDto) => {
            this.onStagesLoaded(pipelineDefinition);
        });
    }

    private handleAddNewParam() {
        this.queryParams$.pipe(
            pluck('action'),
            filter((action: string) => action === 'addNew')
        ).subscribe(() => {
            setTimeout(() => this.createLead());
        });
    }

    private handleRefreshParam() {
        this.queryParams$.subscribe((queryParams: Params) => {
            /** Contact group is handled in different method and it cause refresh by it own */
            if (queryParams.refresh && !queryParams.contactGroup) {
                this.refresh();
            }
        });
    }

    private listenForUpdate(layoutType: DataLayoutType) {
        return combineLatest(
            this.odataRequestValues$,
            this.selectedContactGroup$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(layoutType))
        );
    }

    private waitUntil(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value == layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType == layoutType),
            first(), mapTo(data)
        );
    }

    private getContactsData(): Observable<any> {
        return combineLatest(
            this.listenForUpdate(DataLayoutType.Map),
            this.selectedMapArea$
        ).pipe(
            map(([[oDataRequestValues, contactGroupId, ], mapArea]: [[ODataRequestValues, ContactGroup, null], MapArea]) => {
                return this.mapService.getSliceMapUrl(
                    this.getODataUrl(this.groupDataSourceURI),
                    oDataRequestValues,
                    mapArea,
                    this.dateField,
                    { contactGroupId: contactGroupId.toString() }
                );
            }),
            filter((mapUrl: string) => {
                if (!this.oDataService.requestLengthIsValid(mapUrl)) {
                    this.message.error(this.l('QueryStringIsTooLong'));
                    return false;
                }
                return true;
            }),
            tap(() => this.mapDataIsLoading = true),
            switchMap((mapUrl: string) => this.httpClient.get(mapUrl)),
            publishReplay(),
            refCount(),
            tap(() => this.mapDataIsLoading = false)
        );
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

    private getUserGroup(pipelineName: string): string {
        let userGroup = this.l('Pipeline_' + pipelineName + '_Plural');
        return userGroup !== 'Pipeline_' + pipelineName + '_Plural'
            ? userGroup
            : pluralize.plural(pipelineName);
    }

    getOrganizationUnitName = (e) => {
        return DataGridService.getOrganizationUnitName(e.SourceOrganizationUnitId, this.organizationUnits);
    }

    toggleToolbar() {
        this.repaintDataGrid();
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
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
        if (!this.rowsViewHeight)
            this.rowsViewHeight = DataGridService.getDataGridRowsViewHeight();

        setTimeout(() => {
            this.appService.isClientSearchDisabled = 
                this.dataLayoutType.value == DataLayoutType.Pipeline;
        });
    }

    refresh(invalidateDashboard: boolean = true) {
        this._refresh.next(null);
        if (invalidateDashboard) {
            (this.reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate(quiet: boolean = false, stageId?: number) {
        this.activate$.pipe(filter(Boolean), first()).subscribe(() => {
            this.refresh(false);
        });
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedClientKeys = [];
        this.dataLayoutType.next(dataLayoutType);
        this.initToolbarConfig();
        this.pipelineService.toggleDataLayoutType(this.dataLayoutType.value);
        this.initLayoutDataSource();
        if (!this.showPipeline) {
            if (this.pipelineComponent) {
                this.pipelineComponent.deselectAllCards();
            }
            if (this.showDataGrid) {
                setTimeout(() => this.dataGrid.instance.repaint());
            }
        }
        this.clearQueryParams();
    }

    initFilterConfig(): void {
        if (this.filters) {
            this.filtersService.setup(this.filters);
            this.filtersService.checkIfAnySelected();
        } else {
            this.filtersService.setup(this.filters = [
                this.pipelineFilter,
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'name',
                    items: {Name: new FilterItemModel()}
                }),
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
                    hidden: this.appSession.hideUserSourceFilters,
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
                    field: 'ContactAffiliateCode',
                    items: {
                        element: new FilterMultilineInputModel({
                            ls: this.localizationService,
                            name: 'AffiliateCode'
                        })
                    }
                }),
                this.filterDate,
                this.filterModelStages = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'stages',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource$: this.selectedPipelineId$.pipe(
                                    switchMap((selectedPipelineId: number) => {
                                        return this.store$.pipe(
                                            select(PipelinesStoreSelectors.getPipelineTreeSource(
                                                { id: selectedPipelineId }
                                            ))
                                        );
                                    })
                                ),
                                nameField: 'name',
                                keyExpr: 'id'
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
                }),
                this.filterCountryStates,
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
                    operator: 'startswith',
                    caption: 'Industry',
                    items: { Industry: new FilterItemModel() }
                }),
                this.filterModelAssignment = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'assignedUser',
                    hidden: this.appSession.hideUserSourceFilters,
                    field: 'AssignedUserId',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource$: this.assignedUsersSelector$.pipe(
                                    switchMap((assignedUsersSelector: any) => this.store$.pipe(assignedUsersSelector))
                                ),
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                    }
                }),
                this.filterModelOrgUnit = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'SourceOrganizationUnitId',
                    hidden: this.appSession.hideUserSourceFilters,
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
                this.filterModelSource = new FilterModel({
                    component: FilterSourceComponent,
                    caption: 'Source',
                    hidden: this.appSession.hideUserSourceFilters,
                    items: {
                        element: new SourceFilterModel({
                            ls: this.localizationService
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
                    hidden: this.appSession.hideUserSourceFilters,
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
                    hidden: this.appSession.hideUserSourceFilters,
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
            ], this._activatedRoute.snapshot.queryParams);
        }
        this.filtersService.apply(() => {
            this.selectedClientKeys = [];
            this.initToolbarConfig();
        });
    }

    initToolbarConfig() {
        if (this.selectedContactGroup) {
            this.manageDisabled = !this.permission.checkCGPermission([this.selectedContactGroup]);
            this.manageCGPermission = this.permission.getCGPermissionKey([this.selectedContactGroup], 'Manage');
        }
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
                        disabled: !this.permission.checkCGPermission([this.selectedContactGroup], 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected,
                            class: 'assign-to'
                        }
                    },
                    {
                        name: 'archive',
                        disabled: this.manageDisabled,
                        options: {
                            text: this.l('Toolbar_ReferredBy'),
                            hint: this.l('Toolbar_ReferredBy')
                        },
                        action: this.toggleSource.bind(this),
                        attr: {
                            'filter-selected': !!this.filterModelSource.items.element['contact']
                                || !!this.filterModelOrgUnit.items.element.value.length,
                            class: 'referred-by'
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
                        disabled: !this.permission.checkCGPermission([this.selectedContactGroup], ''),
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        disabled: !this.permission.checkCGPermission([this.selectedContactGroup], ''),
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        disabled: !this.permission.checkCGPermission([this.selectedContactGroup], ''),
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: !this.permission.checkCGPermission([this.selectedContactGroup], ''),
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
                        name: 'actions',
                        widget: 'dxDropDownMenu',
                        disabled: !this.selectedLeads.length || !this.permission.checkCGPermission([this.selectedContactGroup]),
                        options: {
                            items: [
                                {
                                    text: this.l('Delete'),
                                    disabled: this.selectedLeads.length > 1 && !this.isGranted(AppPermissions.CRMBulkUpdates),
                                    action: this.deleteLeads.bind(this, undefined)
                                },
                                {
                                    text: this.l('Toolbar_Merge'),
                                    disabled: this.selectedLeads.length != 2 || !this.isMergeAllowed,
                                    action: () => {
                                        this.contactService.mergeContact(
                                            this.selectedLeads[0],
                                            this.selectedLeads[1],
                                            this.selectedContactGroup,
                                            false,
                                            true,
                                            () => this.refresh(),
                                            true
                                        );
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'message',
                        widget: 'dxDropDownMenu',
                        disabled: !this.selectedClientKeys.length || this.selectedClientKeys.length > 1 || !this.isSmsAndEmailSendingAllowed,
                        options: {
                            items: [
                                {
                                    text: this.l('Email'),
                                    disabled: this.selectedClientKeys.length > 1,
                                    action: () => {
                                        this.contactService.showEmailDialog({
                                            contactId: this.selectedClientKeys[0],
                                            to: this.selectedLeads.map(lead => lead.Email).filter(Boolean)
                                        }).subscribe();
                                    }
                                },
                                {
                                    text: this.l('SMS'),
                                    disabled: this.selectedClientKeys.length > 1,
                                    action: () => {
                                        const selectedLeads = this.selectedLeads;
                                        const contact = selectedLeads && selectedLeads[selectedLeads.length - 1];
                                        const parsedName = contact && this.nameParserService.getParsed(contact.Name);
                                        this.contactService.showSMSDialog({
                                            phoneNumber: contact && contact.Phone,
                                            firstName: parsedName && parsedName.first,
                                            lastName: parsedName && parsedName.last
                                        });
                                    }
                                },
                                {
                                    text: this.l('RP Email'),
                                    disabled: this.selectedClientKeys.length < 1,
                                    visible: this.appSession.isPerformancePartnerTenant && this.selectedContactGroup == ContactGroup.Partner,
                                    action: () => {
                                        this.message.confirm('', this.l('ReferralPartnersSendEmailConfirmation', this.selectedClientKeys.length), (res) => {
                                            if (res) {
                                                this.loadingService.startLoading();
                                                this.contactProxy
                                                    .sendReferralPartnersEmail(this.selectedClientKeys)
                                                    .pipe(finalize(() => this.loadingService.finishLoading()))
                                                    .subscribe();
                                            }
                                        });
                                    }
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
                                            this.pivotGridComponent.dataGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(
                                                    null,
                                                    'PivotGrid',
                                                    this.userGroupText
                                                )
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
                                        } else if (this.showPipeline || this.showDataGrid) {
                                            return this.exportToXLS(
                                                options,
                                                null,
                                                this.userGroupText
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
                                        this.userGroupText
                                    )),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet',
                                    visible: this.showPipeline || this.showDataGrid
                                },
                                {
                                    action: this.exportData.bind(this, options => this.exportToGoogleSheet(
                                        options,
                                        null,
                                        this.userGroupText
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
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.PivotGrid),
                        options: {
                            checkPressed: () => this.showPivotGrid
                        }
                    },
                    {
                        name: 'chart',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Chart),
                        options: {
                            checkPressed: () => this.showChart
                        }
                    },
                    {
                        name: 'map',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Map),
                        options: {
                            checkPressed: () => this.showMap
                        }
                    }
                ]
            }
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
            this.chartComponent.exportTo(format, this.userGroupText);
        } else if (this.showMap) {
            this.mapComponent.exportTo(format, this.userGroupText);
        }
    }

    exportData(callback, options) {
        if (this.showPipeline) {
            let importOption = 'all',
                instance = this.dataGrid.instance,
                dataSource = instance && instance.getDataSource(),
                checkExportOption = (dataSource, ignoreFilter: boolean = false) => {
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
                dataSource = new DataSource(this.dataSourceConfig);
                dataSource['exportIgnoreOnLoaded'] = true;
                instance.option('dataSource', dataSource);
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
        if (this.showPipeline)
            this.pipelineService.toggleContactView();
        else {
            DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
            this.gridCompactView.next(DataGridService.isCompactView(this.dataGrid));
        }
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this._router.navigate([], {queryParams: {
                ...this._activatedRoute.snapshot.queryParams,
                search: this.searchValue
            }});
            this._refresh.next(null);
        }
    }

    processFilterInternal(contexts?: any[]) {
        if (this.showPipeline && this.pipelineComponent) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }
        if (this.showPipeline || this.showDataGrid || this.showPivotGrid) {
            contexts = contexts && contexts.length ? contexts : [ this.showPipeline ? this.pipelineComponent : this ];
            contexts.forEach(context => {
                if (context && context.processODataFilter) {
                    const dataGridInstance = this.showPivotGrid
                        ? this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance
                        : context.dataGrid && context.dataGrid.instance;
                    if (this.showPipeline || dataGridInstance) {
                        if (this.pipelineDataSource)
                            this.pipelineDataSource['total'] = this.pipelineDataSource['entities'] = undefined;
                        if (this.dataSource)
                            this.dataSource['total'] = this.dataSource['entities'] = undefined;
                        const filterQuery$: Observable<string> = context.processODataFilter.call(
                            context,
                            dataGridInstance,
                            this.dataSourceURI,
                            this.filters,
                            this.filtersService.getCheckCustom
                        );
                    }
                }
            });
        }
    }

    initLayoutDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => {
                    this.pipelineDataSource = cloneDeep(this.dataSourceConfig);
                    this.pipelineDataSource['exportIgnoreOnLoaded'] = true;
                });
        } else if (this.showDataGrid) {
            this.setDataGridInstance();
        } else if (this.showPivotGrid) {
            this.setPivotGridInstance();
        } else if (this.showChart) {
            this.setChartInstance();
        }
    }

    private clearQueryParams() {
        setTimeout(() =>
            this._router.navigate([], {
                relativeTo: this._activatedRoute,
                queryParams: { 
                    dataLayoutType: null,
                    contactGroup: null
                },
                queryParamsHandling: 'merge'
            }), 500
        );
    }

    private setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            this.oDataService.getODataFilter(
                this.filters, 
                this.filtersService.getCheckCustom
            ).subscribe((odataRequestValues: ODataRequestValues) => {
                this.dataSource['_store']['_url'] = this.getODataUrl(
                    this.dataSourceURI, odataRequestValues.filter, null, odataRequestValues.params);
                this.dataGrid.dataSource = this.dataSource;                
            });
            if (!instance.option('paging.pageSize'))
                instance.option('paging.pageSize', 20);            
            this.isDataLoaded = false;
        }
    }

    setupFilterCacheChangeInterval() {
    /* 
        !!VP This is necessary to update server cache 
        outdated filters in grid infinity scroll mode
    */
        interval(30000).pipe(
            takeUntil(this.destroy$),
            filter(() => this.componentIsActivated),
            switchMap(() => this.oDataService.getODataFilter(
                this.filters, 
                this.filtersService.getCheckCustom
            ))
        ).subscribe((odataRequestValues: ODataRequestValues) => {
            let url = this.getODataUrl(this.dataSourceURI, 
                odataRequestValues.filter, null, odataRequestValues.params);
            if (this.pipelineDataSource && this.pipelineDataSource.store.url != url) {
                this.pipelineDataSource.store.url = url;
                if (this.pipelineComponent.params && this.pipelineComponent.params.length) {
                    let params = UrlHelper.getQueryParametersUsingParameters(url.split('?').pop());
                    this.pipelineComponent.params.forEach(param => {
                        param.value = params[param.name];
                    });
                }
                this.pipelineComponent.clearStageDataSources();
            }
            this.checkSetDataSourceUrl(this.dataSource, url);
        });
    }

    checkSetDataSourceUrl(dataSource: DataSource, url: string): Boolean {
        if (dataSource && dataSource['_store'] && dataSource['_store']['_url'] != url)
            return Boolean(dataSource['_store']['_url'] = url);
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance;
        CrmService.setDataSourceToComponent(this.pivotGridDataSource, pivotGridInstance);
    }

    private setChartInstance() {
        const chartInstance = this.chartComponent && this.chartComponent.chart && this.chartComponent.chart.instance;
        CrmService.setDataSourceToComponent(this.chartDataSource, chartInstance);
    }

    createLead() {
        this.selectedPipeline$.pipe(first()).subscribe((selectedPipeline: PipelineDto) => {
            const dialogData: CreateEntityDialogData = {
                refreshParent: () => this.refresh(),
                isInLeadMode: true,
                customerType: this.selectedContactGroup,
                entityTypeId: selectedPipeline.entityTypeId,
                entityTypeSysId: selectedPipeline.entityTypeSysId as EntityTypeSys,
                pipelineId: selectedPipeline.id
            };
            this.dialog.open(CreateEntityDialogComponent, {
                panelClass: 'slider',
                disableClose: true,
                closeOnNavigation: false,
                data: dialogData
            });
        });
    }

    onSelectionChanged($event) {
        this.selectedLeads = $event.component.getSelectedRowsData();
    }

    onStagesLoaded(pipeline: PipelineDto) {
        this.stages = pipeline.stages.map((stage: StageDto) => {
            return {
                id: pipeline.id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name
            };
        });
        this.initToolbarConfig();
    }

    updateLeadsStage($event) {
        if (this.hasBulkPermission) {
            this.stagesComponent.tooltipVisible = false;
            this.pipelineService.updateEntitiesStage(
                this.pipelinePurposeId,
                this.selectedLeads.filter(lead =>
                    lead.Stage != $event.name),
                $event.name,
                this.selectedContactGroup
            ).subscribe(declinedList => {
                if (this.showDataGrid) {
                    let gridInstance = this.dataGrid && this.dataGrid.instance;
                    if (gridInstance && declinedList && declinedList.length)
                        gridInstance.selectRows(declinedList.map((item: LeadDto) => item.Id), false);
                    else
                        gridInstance.clearSelection();
                } else {
                    this._refresh.next(null);
                }
                if (!declinedList.length) {
                    this.notify.success(this.l('StageSuccessfullyUpdated'));
                }
            });
        }
    }

    showLeadDetails(event, section?: string, queryParams?: Params) {
        const lead: LeadDto = event.data;
        let leadId = lead && lead.Id,
            clientId = lead && lead.CustomerId;
        if (!leadId || !clientId)
            return;
        this.selectedPipeline$.pipe(first()).subscribe((selectedPipeline: PipelineDto) => {
            if (!section && typeof lead.PropertyId === 'number') {
                if (selectedPipeline.entityTypeSysId === EntityTypeSys.PropertyAcquisition) {
                    section = 'property-information';
                }
                queryParams = { ...queryParams, propertyId: lead.PropertyId };
            }

            this.searchClear = false;
            let orgId = lead.OrganizationId;
            event.component && event.component.cancelEditData();
            this.itemDetailsService.setItemsSource(ItemTypeEnum.Lead, event.dataSource
                || this.dataSource, event.loadMethod);
            setTimeout(() => {
                this._router.navigate(
                    CrmService.getEntityDetailsLink(clientId, section, leadId, orgId),
                    { queryParams: {
                            referrer: 'app/crm/leads',
                            contactGroupId: this.selectedContactGroup,
                            dataLayoutType: this.dataLayoutType.value,
                            ...queryParams
                        }
                    }
                );
            });
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

    toggleSource() {
        this.sourceComponent.toggle();
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

    toggleColumnChooser() {
        if (this.showDataGrid) {
            DataGridService.showColumnChooser(this.dataGrid);
        } else if (this.showPivotGrid) {
            this.pivotGridComponent.toggleFieldPanel();
        }
    }

    deleteLeads(leadIds?: number[]) {
        let selectedIds: number[] = leadIds || this.selectedLeads.map(lead => lead.Id);
        ContactsHelper.showConfirmMessage(
            this.l('LeadsDeleteWarningMessage'),
            (isConfirmed: boolean, [ forceDelete ]: boolean[]) => {
                if (isConfirmed) {
                    let request = this.getDeleteMethod(selectedIds, forceDelete);
                    request.subscribe(() => {
                        this.refresh();
                        if (this.dataGrid && this.dataGrid.instance) {
                            this.dataGrid.instance.deselectAll();
                            this.selectedClientKeys = [];
                        }
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            },
            [ { text: this.l('ForceDelete'), visible: this.permission.isGranted(AppPermissions.CRMForceDeleteEntites), checked: false } ]
        );
    }

    private getDeleteMethod(selectedIds: number[], forceDelete): Observable<void> {
        return selectedIds.length > 1 ?
            this.leadService.deleteLeads(forceDelete, selectedIds) :
            this.leadService.deleteLead(selectedIds[0], forceDelete);
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    ngOnDestroy() {
        this.deactivate();
        this.lifeCycleSubjectsService.destroy.next();
    }

    activate() {
        this.searchClear = false;
        super.activate();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.handleQueryParams();

        this.showHostElement(() => {
            this.repaintToolbar();
            this.pipelineComponent.detectChanges();
        });
        this._activate.next(true);
    }

    deactivate() {
        super.deactivate();
        this._activate.next(false);
        this.filtersService.unsubscribe();
        this.pipelineComponent.deactivate();
        this.hideHostElement();
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onCardClick({entity, entityStageDataSource, loadMethod}) {
        this.showLeadDetails({
            data: entity,
            dataSource: entityStageDataSource,
            loadMethod: loadMethod
        });
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

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe((actionRecord) => {
            const lead: LeadDto = event.data;
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, lead);
            this.actionEvent = actionRecord;
        });
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onSelectedPipelineChanged(event) {
        if (event.previousValue != event.value) {
            this.filterModelStages.clearFilterItems();
            this.filterModelStages.isSelected = false;
            this.pipelineFilter.items.PipelineId.value = +event.value;
            this._selectedPipelineId.next(event.value);
            this.cacheService.set(this.cacheKey, event.value);
            this.initToolbarConfig();
        }
    }

    editPipeline({ id, value }) {
        if (this.pipelineEditIsGranted)
            this.pipelineServiceProxy.rename(new PipelineRenameInput({
                id: id,
                name: value
            })).subscribe(() => {
                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
            });
    }

    onOwnerFilterApply(event?) {
        let filter = this.filterModelOrgUnit.items.element.value;
        this.filterModelOrgUnit.items.element.value = filter && (!event || filter[0] == event.id) ? [] : [event.id];
        this.filtersService.change([this.filterModelOrgUnit]);
    }

    onSourceApply(contacts) {
       if (this.isGranted(AppPermissions.CRMBulkUpdates)) {
            ContactsHelper.showConfirmMessage(
                this.l('UpdateForSelected', this.l('SourceContactName'), this.l('ContactGroup_' + this.contactGroupNames[String(this.selectedContactGroup)])),
                (confirmed: boolean, [ applyCode ]: boolean[]) => {
                    if (confirmed)
                        this.leadService.updateSourceContacts(new UpdateLeadSourceContactsInput({
                            leadIds: this.selectedLeads.map(lead => lead.Id),
                            sourceContactId: contacts[0].id,
                            applyCurrentAffiliateCode: applyCode
                        })).subscribe(() => {
                            this.selectedLeads = [];
                            if (this.dataGrid && this.dataGrid.instance)
                                this.dataGrid.instance.deselectAll();
                            this.processFilterInternal();
                            this.notify.success(this.l('AppliedSuccessfully'));
                        });
                },
                [{
                    text: this.l('ApplyCurrentFrom', this.l('SourceContactName'), this.l('AffiliateCode')),
                    visible: true,
                    checked: false
                }],
                this.l('SourceUpdateConfirmation', this.l('ContactGroup_' + this.contactGroupNames[String(this.selectedContactGroup)]))
            );
        }
    }

    onDragEnd = e => {
        if (e && e.fromIndex != e.toIndex) {
            forkJoin(
                from(e.component.byKey(e.component.getKeyByRowIndex(e.fromIndex))),
                from(e.component.byKey(e.component.getKeyByRowIndex(e.toIndex)))
            ).subscribe(([source, target]: [LeadDto, LeadDto]) => {
                this.contactService.mergeContact(source, target, this.selectedContactGroup, false, true, () => this.refresh(), true);
            });
        }
    }

    onTotalChange(totalCount: number) {
        this.totalCount = totalCount;
        this.loadAssignUsersList.next();
    }

    openEntityChecklistDialog(data?) {
        this.dialog.closeAll();
        let lead = data || this.actionEvent.data || this.actionEvent;
        this.dialog.open(EntityCheckListDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                entity: lead,
                pipelinePurposeId: this.pipelinePurposeId
            }
        });
    }
}