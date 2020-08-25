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
import { BehaviorSubject, combineLatest, concat, forkJoin, from, merge, Observable, of } from 'rxjs';
import {
    filter,
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
    finalize
} from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import invert from 'lodash/invert';
import cloneDeep from 'lodash/cloneDeep';

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
    LayoutType,
    PipelineDto,
    LeadServiceProxy,
    OrganizationUnitDto,
    ContactServiceProxy,
    UpdateLeadSourceContactsInput
} from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service.ts';
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
import { MessageService } from '@abp/message/message.service';
import { EntityCheckListDialogComponent } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './leads.component.less'
    ],
    providers: [LeadServiceProxy, ContactServiceProxy, LifecycleSubjectsService, PipelineService, MapService],
    animations: [appModuleAnimation()]
})
export class LeadsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent, {static: false}) dataGrid: DxDataGridComponent;
    @ViewChild(PipelineComponent, {static: false}) pipelineComponent: PipelineComponent;
    @ViewChild(TagsListComponent, {static: false}) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, {static: false}) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent, {static: false}) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent, {static: false}) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent, {static: false}) starsListComponent: StarsListComponent;
    @ViewChild('stageList', {static: false}) stagesComponent: StaticListComponent;
    @ViewChild(PivotGridComponent, {static: false}) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent, {static: true}) chartComponent: ChartComponent;
    @ViewChild(MapComponent, {static: false}) mapComponent: MapComponent;
    @ViewChild(ToolBarComponent, {static: false}) toolbar: ToolBarComponent;
    @ViewChild('sourceList', { static: false }) sourceComponent: SourceContactListComponent;

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
    actionEvent: any;
    actionMenuGroups: ActionMenuGroup[] = [
        {
            key: '',
            visible: true,
            items: [
                {
                    text: this.l('Call'),
                    class: 'call',
                    disabled: true,
                    action: () => {}
                },
                {
                    text: this.l('SendEmail'),
                    class: 'email',
                    action: () => {
                        this.contactService.showEmailDialog({
                            contactId: (this.actionEvent.data || this.actionEvent).CustomerId
                        }).subscribe();
                    }
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
                        return !!lead.UserId && this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation);
                    },
                    action: () => {
                        const lead: LeadDto = this.actionEvent.data || this.actionEvent;
                        this.impersonationService.impersonate(lead.UserId, this.appSession.tenantId);
                    }
                },
                {
                    text: this.l('NotesAndCallLog'),
                    class: 'notes',
                    action: () => {
                        this.showLeadDetails({ data: this.actionEvent }, 'notes');
                    },
                    button: {
                        text: '+' + this.l('Add'),
                        action: () => {
                            this.showLeadDetails({ data: this.actionEvent }, 'notes', {
                                addNew: true
                            });
                        }
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
                    action: () => {
                        this.showLeadDetails({ data: this.actionEvent }, 'invoices');
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
                        const stage = this.pipelineService.getStageByName(this.pipelinePurposeId, lead.Stage);
                        return this.l('Checklist') + ' (' + lead.StageChecklistPointDoneCount + '/' + stage.checklistPoints.length + ')';
                    },
                    class: 'checklist',
                    checkVisible: (lead: LeadDto) => {
                        const stage = this.pipelineService.getStageByName(this.pipelinePurposeId, lead.Stage);
                        return !!(!stage.isFinal && stage.checklistPoints && stage.checklistPoints.length);
                    },
                    action: () => {
                        this.openEntityChecklistDialog();
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
                    action: () => {
                        this.deleteLeads([(this.actionEvent.data || this.actionEvent).Id]);
                    }
                },
                {
                    text: this.l('EditRow'),
                    class: 'edit',
                    action: () => this.showLeadDetails({ data: this.actionEvent })
                }
            ]
        }
    ];
    contactGroups = Object.keys(ContactGroup)
        .filter((group: string) => this.permission.checkCGPermission(ContactGroup[group], ''))
        .map((group: string) => ({
            text: this.getUserGroup(group),
            value: group
        }));
    selectedContactGroup = Object.keys(ContactGroup).shift();
    contactGroupId: BehaviorSubject<ContactGroup> = new BehaviorSubject(ContactGroup[this.selectedContactGroup]);
    contactGroupId$: Observable<ContactGroup> = this.contactGroupId.asObservable();
    userGroupText$: Observable<string> = this.contactGroupId$.pipe(
        map((contactGroupId: ContactGroup) => {
            this.initAssignedUsersSelector();
            return this.getUserGroup(invert(ContactGroup)[contactGroupId.toString()]).toLowerCase();
        })
    );

    stages = [];
    pipelineDataSource: any;
    collection: any;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    selectedClientKeys = [];
    manageDisabled = true;
    manageCGPermision = '';
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
    private filters: FilterModel[];
    formatting = AppConsts.formatting;

    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.permission.checkCGPermission(ContactGroup.Client),
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
                switchMap((odataRequestValues: ODataRequestValues) => {
                    const chartDataUrl = this.chartDataUrl || this.crmService.getChartDataUrl(
                        this.getODataUrl(this.groupDataSourceURI),
                        odataRequestValues,
                        this.chartComponent.summaryBy.value,
                        this.dateField,
                        { contactGroupId: this.contactGroupId.value.toString() }
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
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    mapData$: Observable<MapData>;
    mapInfoItems$: Observable<InfoItem[]>;

    private readonly CONTACT_GROUP_CACHE_KEY = 'CONTACT_GROUP';
    private readonly cacheKey = this.getCacheKey(
        this.CONTACT_GROUP_CACHE_KEY, this.dataSourceURI);
    private organizationUnits: OrganizationUnitDto[];
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
    isSmsAndEmailSendingAllowed: boolean = this.permission.checkCGPermission(this.contactGroupId.value, 'ViewCommunicationHistory.SendSMSAndEmail');
    readonly leadFields: KeysEnum<LeadDto> = LeadFields;
    pipelineSelectFields: string[] = [
        this.leadFields.Id,
        this.leadFields.CustomerId,
        this.leadFields.Name,
        this.leadFields.CompanyName,
        this.leadFields[this.dateField],
        this.leadFields.PhotoPublicId,
        this.leadFields.Email
    ].concat(
        this.isSmsAndEmailSendingAllowed ? [ this.leadFields.Phone ] : []
    );
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );
    assignedUsersSelector;
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    private _activate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private activate$: Observable<boolean> = this._activate.asObservable();
    isBankCodeLayoutType: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    isMergeAllowed = this.isGranted(AppPermissions.CRMMerge);
    hasBulkPermission: boolean = this.permission.isGranted(AppPermissions.CRMBulkUpdates);

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
        this.contactGroupOptionInit();
        this.crmService.updateDateFilter(this._activatedRoute.snapshot.queryParams, this.filterDate);
        this.crmService.updateCountryStateFilter(this._activatedRoute.snapshot.queryParams, this.filterCountryStates);
        this.odataRequestValues$ = concat(
            this.oDataService.getODataFilter(
                [this.filterDate, this.filterCountryStates],
                this.filtersService.getCheckCustom
            ).pipe(first()),
            this.filterChanged$.pipe(
                switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
            )
        ).pipe(
            filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues)
        );
        this.dataSource = {
            uri: this.dataSourceURI,
            requireTotalCount: true,
            store: {
                key: this.leadFields.Id,
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI, this.getInitialFilter()),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.params.contactGroupId = this.contactGroupId.value;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(
                        this.dataGrid,
                        [
                            this.leadFields.Id,
                            this.leadFields.CustomerId,
                            this.leadFields.OrganizationId,
                            this.leadFields.UserId,
                            this.leadFields.Email,
                            this.leadFields.Phone,
                            this.leadFields.StageChecklistPointDoneCount
                        ]
                    );
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                deserializeDates: false
            }
        };
        this.totalDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    this.totalCount = undefined;
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
        this.initAssignedUsersSelector();
    }

    ngOnInit() {
        this.loadOrganizationUnits();
        this.handleTotalCountUpdate();
        this.handlePipelineUpdate();
        this.handleDataGridUpdate();
        this.handlePivotGridUpdate();
        this.handleChartUpdate();
        this.handleMapUpdate();
        this.handleModuleChange();
        this.activate();
        this.handleQueryParams();
        this.handleFiltersPining();
    }

    ngAfterViewInit() {
        this.initDataSource();
    }

    private getInitialFilter() {
        return [
            this.filterDate.getODataFilterObject(),
            this.filtersService.getCheckCustom(this.filterCountryStates)
        ];
    }

    private initAssignedUsersSelector() {
        this.assignedUsersSelector = select(
            ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers,
            { contactGroup: this.contactGroupId.value }
        );
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
                    this.pivotGridComponent.updateTotalCellsSizes();
                }, 1001);
            }
        });
    }

    private handleTotalCountUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$,
            this.contactGroupId$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
        ).subscribe(([odataRequestValues, ]) => {
            let url = this.getODataUrl(this.totalDataSourceURI,
                odataRequestValues.filter, null, odataRequestValues.params);
            if (url && this.oDataService.requestLengthIsValid(url)) {
                this.totalDataSource['_store']['_url'] = url;
                this.totalDataSource.load();
            }
        });
    }

    private handlePipelineUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(DataLayoutType.Pipeline)),
            filter(() => this.pipelineDataSource)
        ).subscribe(() => this.processFilterInternal());
    }

    private handleDataGridUpdate() {
        this.listenForUpdate(DataLayoutType.DataGrid).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handlePivotGridUpdate() {
        this.listenForUpdate(DataLayoutType.PivotGrid).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handleChartUpdate() {
        combineLatest(
            this.chartComponent.summaryBy$,
            this.listenForUpdate(DataLayoutType.Chart)
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe(([summaryBy, [odataRequestValues, ]]: [SummaryBy, [ODataRequestValues, ]]) => {
            const chartDataUrl = this.crmService.getChartDataUrl(
                this.getODataUrl(this.groupDataSourceURI),
                odataRequestValues,
                summaryBy,
                this.dateField,
                { contactGroupId: this.contactGroupId.value.toString() }
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
            if (this.crmService.updateCountryStateFilter(params, this.filterCountryStates)) {
                filtersToChange.push(this.filterCountryStates);
            }
            if (this.crmService.updateDateFilter(params, this.filterDate)) {
                filtersToChange.push(this.filterDate);
            }
            if (filtersToChange.length) {
                this.filtersService.change(filtersToChange);
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
            filter((contactGroup: string) => contactGroup && this.selectedContactGroup !== contactGroup)
        ).subscribe((contactGroup: string) => {
            this.selectedContactGroup = contactGroup;
            this.contactGroupId.next(ContactGroup[this.selectedContactGroup]);
        });
    }

    private handleDataLayoutParam() {
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
        ).subscribe((pipelineDefinition: PipelineDto) => {
            this.onStagesLoaded({ stages: pipelineDefinition.stages });
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
            this.contactGroupId$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(layoutType))
        );
    }

    private waitUntil(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value === layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === layoutType),
            first(),
            mapTo(data)
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

    private get contactGroup(): string {
        return invert(ContactGroup)[this.contactGroupId.value.toString()];
    }

    private getUserGroup(contactGroup: string): string {
        return this.l('ContactGroup_' + contactGroup);
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

    contactGroupOptionInit() {
        if (this.cacheService.exists(this.cacheKey)) {
            this.selectedContactGroup = this.cacheService.get(this.cacheKey);
            this.contactGroupId.next(ContactGroup[this.selectedContactGroup]);
            this.createButtonEnabledSet();
        }
    }

    private createButtonEnabledSet() {
        this.headlineButtons[0].enabled =
            this.permission.checkCGPermission(this.contactGroupId.value);
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
    }

    refresh(invalidateDashboard = true) {
        this._refresh.next(null);
        if (invalidateDashboard) {
            (this.reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate(quiet = false, stageId?: number) {
        this.activate$.pipe(filter(Boolean), first()).subscribe(() => {
            this.refresh(false);
        });
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedClientKeys = [];
        this.dataLayoutType.next(dataLayoutType);
        this.initToolbarConfig();
        this.pipelineService.toggleDataLayoutType(this.dataLayoutType.value);
        this.initDataSource();
        if (!this.showPipeline) {
            if (this.pipelineComponent) {
                this.pipelineComponent.deselectAllCards();
            }
            if (this.showDataGrid) {
                setTimeout(() => this.dataGrid.instance.repaint());
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
                                dataSource$: this.store$.pipe(
                                    select(PipelinesStoreSelectors.getPipelineTreeSource(
                                        { purpose: this.pipelinePurposeId })
                                    )
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
                    hidden: this.appSession.userIsMember,
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
                this.filterModelOrgUnit = new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'SourceOrganizationUnitId',
                    hidden: this.appSession.userIsMember,
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
                    hidden: this.appSession.userIsMember,
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
                    hidden: this.appSession.userIsMember,
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
                    hidden: this.appSession.userIsMember,
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
        this.manageDisabled = !this.permission.checkCGPermission(this.contactGroupId.value);
        this.manageCGPermision = this.permission.getCGPermissionKey(this.contactGroupId.value, 'Manage');
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
                        disabled: !this.permission.checkCGPermission(this.contactGroupId.value, 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected
                        }
                    },
                    {
                        name: 'archive',
                        disabled: this.manageDisabled,
                        options: {
                            text: this.l('Source'),
                            hint: this.l('Source')
                        },
                        action: this.toggleSource.bind(this),
                        attr: {
                            'filter-selected': !!this.filterModelSource.items.element['contact']
                                || !!this.filterModelOrgUnit.items.element.value.length
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
                        disabled: !this.permission.checkCGPermission(this.contactGroupId.value, ''),
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        disabled: !this.permission.checkCGPermission(this.contactGroupId.value, ''),
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        disabled: !this.permission.checkCGPermission(this.contactGroupId.value, ''),
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: !this.permission.checkCGPermission(this.contactGroupId.value, ''),
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
                        disabled: !this.selectedLeads.length || !this.permission.checkCGPermission(this.contactGroupId.value),
                        options: {
                            items: [
                                {
                                    text: this.l('Delete'),
                                    disabled: this.selectedLeads.length > 1 && !this.isGranted(AppPermissions.CRMBulkUpdates),
                                    action: this.deleteLeads.bind(this)
                                },
                                {
                                    text: this.l('Toolbar_Merge'),
                                    disabled: this.selectedLeads.length != 2 || !this.isMergeAllowed,
                                    action: () => {
                                        this.contactService.mergeContact(this.selectedLeads[0], this.selectedLeads[1], false, true, () => this.refresh(), true);
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
                        disabled: !this.isSmsAndEmailSendingAllowed,
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
                                    visible: this.appSession.isPerformancePartnerTenant && ContactGroup[this.selectedContactGroup] == ContactGroup.Partner,
                                    action: () => {
                                        this.message.confirm("", this.l('ReferralPartnersSendEmailConfirmation', this.selectedClientKeys.length), (res) => {
                                            if (res) {
                                                abp.ui.setBusy();
                                                this.contactProxy
                                                    .sendReferralPartnersEmail(this.selectedClientKeys)
                                                    .pipe(finalize(() => abp.ui.clearBusy()))
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
                                                    this.getUserGroup(this.contactGroup)
                                                )
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
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
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
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
                        const filterQuery$: Observable<string> = context.processODataFilter.call(
                            context,
                            dataGridInstance,
                            this.dataSourceURI,
                            this.filters,
                            this.filtersService.getCheckCustom
                        );
                        if (this.showDataGrid) {
                            filterQuery$.subscribe((filterQuery: string) => {
                                if (filterQuery && filterQuery !== 'canceled') {
                                    this.totalDataSource['_store']['_url'] = this.getODataUrl(this.totalDataSourceURI, filterQuery);
                                    this.dataSource.store.url = this.getODataUrl(this.dataSourceURI, filterQuery);
                                }
                            });
                        }
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
            this.processFilterInternal();
            this.isDataLoaded = false;
        }
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
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => this.refresh(),
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
        if (this.hasBulkPermission) {
            this.stagesComponent.tooltipVisible = false;
            this.pipelineService.updateEntitiesStage(
                this.pipelinePurposeId,
                this.selectedLeads,
                $event.name
            ).subscribe((declinedList) => {
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

        this.searchClear = false;
        let orgId = lead.OrganizationId;
        event.component && event.component.cancelEditData();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Lead, event.dataSource
            || this.dataGrid.instance.getDataSource(), event.loadMethod);
        setTimeout(() => {
            this._router.navigate(
                ['app/crm/contact', clientId, 'lead', leadId]
                    .concat(orgId ? ['company', orgId] : [])
                    .concat(section ? [ section ] : []),
                    { queryParams: {
                        referrer: 'app/crm/leads',
                        dataLayoutType: this.dataLayoutType.value,
                        ...queryParams
                    }}
                );
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
            this.l('ForceDelete'),
            (isConfirmed: boolean, forceDelete: boolean) => {
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
        this.permission.isGranted(AppPermissions.CRMForceDeleteEntites));
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
        super.activate();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
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
        this.rootComponent.overflowHidden();
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

    getHeadlineButtonName() {
        return this.l('CreateNew') + ' ' + this.getUserGroup(this.selectedContactGroup).slice(0, -1);
    }

    onContactGroupChanged(event) {
        if (event.previousValue != event.value) {
            this._router.navigate([], {
                queryParamsHandling: 'merge',
                relativeTo: this._activatedRoute,
                queryParams: {
                    contactGroup: event.value,
                    dataLayoutType: this.dataLayoutType.value
                }
            });

            this.headlineButtons[0].label = this.getHeadlineButtonName();
            this.cacheService.set(this.cacheKey, event.value);
            this.createButtonEnabledSet();
            this.initToolbarConfig();
        }
    }

    onOwnerFilterApply(event) {
        let filter = this.filterModelOrgUnit.items.element.value;
        this.filterModelOrgUnit.items.element.value = filter && filter[0] == event.id ? [] : [event.id];
        this.filtersService.change([this.filterModelOrgUnit]);
    }

    onSourceApply(contacts) {
       if (this.isGranted(AppPermissions.CRMBulkUpdates)) {
            ContactsHelper.showConfirmMessage(
                this.l('UpdateForSelected', this.l('SourceContactName'), this.l('ContactGroup_' + this.selectedContactGroup)),
                this.l('ApplyCurrentFrom', this.l('SourceContactName'), this.l('AffiliateCode')),
                (confirmed: boolean, applyCode: boolean) => {
                    if (confirmed)
                        this.leadService.updateSourceContacts(new UpdateLeadSourceContactsInput({
                            leadIds: this.selectedLeads.map(lead => lead.Id),
                            sourceContactId: contacts[0].id,
                            applyCurrentAffiliateCode: applyCode
                        })).subscribe(res => {
                            this.selectedLeads = [];
                            if (this.dataGrid && this.dataGrid.instance)
                                this.dataGrid.instance.deselectAll();
                            this.processFilterInternal();
                            this.notify.success(this.l('AppliedSuccessfully'));
                        });
                }, true, this.l('SourceUpdateConfirmation', this.l('ContactGroup_' + this.selectedContactGroup))
            );
        }
    }

    onDragEnd = e => {
        if (e && e.fromIndex != e.toIndex) {
            forkJoin(
                from(e.component.byKey(e.component.getKeyByRowIndex(e.fromIndex))),
                from(e.component.byKey(e.component.getKeyByRowIndex(e.toIndex)))
            ).subscribe(([source, target]: [LeadDto, LeadDto]) => {
                this.contactService.mergeContact(source, target, false, true, () => this.refresh(), true);
            });
        }
    }

    openEntityChecklistDialog() {
        this.dialog.closeAll();
        let lead = this.actionEvent.data || this.actionEvent;
        this.dialog.open(EntityCheckListDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                entity: lead,
                pipelinePurposeId: this.pipelinePurposeId,
                contactGroupId: this.contactGroupId
            }
        });
    }
}