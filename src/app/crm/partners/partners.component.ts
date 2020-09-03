/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, concat, merge, Observable, of, forkJoin, from } from 'rxjs';
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
import * as _ from 'underscore';
import DataSource from '@root/node_modules/devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { AppService } from '@app/app.service';
import {
    AppStore,
    ContactAssignedUsersStoreSelectors,
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
import { TagsListComponent } from '@app/shared/common/lists/tags-list/tags-list.component';
import { ListsListComponent } from '@app/shared/common/lists/lists-list/lists-list.component';
import { TypesListComponent } from '@app/shared/common/lists/types-list/types-list.component';
import { UserAssignmentComponent } from '@app/shared/common/lists/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '@app/shared/common/lists/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import { CreateEntityDialogComponent } from '@shared/common/create-entity-dialog/create-entity-dialog.component';
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
    BulkUpdatePartnerTypeInput,
    ContactServiceProxy,
    ContactStatusDto,
    LayoutType,
    PartnerServiceProxy,
    PartnerTypeServiceProxy
} from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ClientService } from '@app/crm/clients/clients.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { AppPermissions } from '@shared/AppPermissions';
import { OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PivotGridComponent } from '@app/shared/common/slice/pivot-grid/pivot-grid.component';
import { CrmService } from '@app/crm/crm.service';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { ChartComponent } from '@app/shared/common/slice/chart/chart.component';
import { ImageFormat } from '@shared/common/export/image-format.enum';
import { MapData } from '@app/shared/common/slice/map/map-data.model';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { MapArea } from '@app/shared/common/slice/map/map-area.enum';
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { MapService } from '@app/shared/common/slice/map/map.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import { FilterStatesService } from '@shared/filters/states/filter-states.service';
import { FilterSourceComponent } from '../shared/filters/source-filter/source-filter.component';
import { SourceFilterModel } from '../shared/filters/source-filter/source-filter.model';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { FilterMultilineInputComponent } from '@root/shared/filters/multiline-input/filter-multiline-input.component';
import { FilterMultilineInputModel } from '@root/shared/filters/multiline-input/filter-multiline-input.model';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { PartnerDto } from '@app/crm/partners/partner-dto.interface';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { PartnerFields } from '@app/crm/partners/partner-fields.enum';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { FilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { Status } from '@app/crm/contacts/operations-widget/status.interface';

@Component({
    templateUrl: './partners.component.html',
    styleUrls: [
        '../shared/styles/grouped-action-menu.less',
        './partners.component.less'
    ],
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
    @ViewChild(PipelineComponent, {static: false}) pipelineComponent: PipelineComponent;
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent, { static: false }) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent, { static: false }) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent, { static: false }) typesComponent: TypesListComponent;
    @ViewChild('sourceList', { static: false }) sourceComponent: SourceContactListComponent;
    @ViewChild(UserAssignmentComponent, { static: false }) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent, { static: false }) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent, { static: false }) starsListComponent: StarsListComponent;
    @ViewChild('statusesList', { static: false }) statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent, { static: false }) pivotGridComponent: PivotGridComponent;
    @ViewChild(ChartComponent, { static: true }) chartComponent: ChartComponent;
    @ViewChild(MapComponent, { static: false }) mapComponent: MapComponent;
    @ViewChild(ToolBarComponent, { static: false }) toolbar: ToolBarComponent;

    private isSlice = this.appService.getModule() === 'slice';
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject(
        this.isSlice ? DataLayoutType.PivotGrid : DataLayoutType.DataGrid
    );
    public readonly partnerContactGroup = ContactGroup.Partner;
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable();
    hideDataGrid$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.DataGrid;
    }));
    hidePipeline$: Observable<boolean> = this.dataLayoutType$.pipe(map((dataLayoutType: DataLayoutType) => {
        return dataLayoutType !== DataLayoutType.Pipeline;
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

    private readonly dataSourceURI = 'Contact';
    private readonly totalDataSourceURI: string = 'Contact/$count';
    private readonly groupDataSourceURI = 'ContactSlice';
    public readonly dateField = 'ContactDate';
    private rootComponent: any;
    private subRouteParams: any;
    private dependencyChanged = false;

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
                            contactId: (this.actionEvent.data || this.actionEvent).Id
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
                    checkVisible: (partner: PartnerDto) => !!partner.UserId && this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
                    action: () => {
                        const partner: PartnerDto = this.actionEvent.data || this.actionEvent;
                        this.impersonationService.impersonate(partner.UserId, this.appSession.tenantId);
                    }
                },
                {
                    text: this.l('NotesAndCallLog'),
                    class: 'notes',
                    action: () => {
                        this.showPartnerDetails(this.actionEvent, 'notes');
                    },
                    button: {
                        text: '+' + this.l('Add'),
                        action: () => {
                            this.showPartnerDetails(this.actionEvent, 'notes', {
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
                        this.showPartnerDetails(this.actionEvent, 'invoices');
                    }
                },
                {
                    text: this.l('Notifications'),
                    class: 'notifications',
                    disabled: true,
                    action: () => {}
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
                        this.contactService.deleteContact(
                            this.actionEvent.Name,
                            ContactGroup.Client,
                            this.actionEvent.Id,
                            () => this.invalidate()
                        );
                    }
                },
                {
                    text: this.l('EditRow'),
                    class: 'edit',
                    action: () => this.showPartnerDetails(this.actionEvent)
                }
            ]
        }
    ];

    formatting = AppConsts.formatting;
    statuses: ContactStatusDto[];
    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelTypes: FilterModel;
    filterModelSource: FilterModel = new FilterModel({
        component: FilterSourceComponent,
        hidden: this.appSession.userIsMember,
        caption: 'Source',
        items: {
            element: new SourceFilterModel({
                ls: this.localizationService
            })
        }
    });
    filterModelOrgUnit: FilterModel = new FilterModel({
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
    });
    filterCountryStates: FilterModel = new FilterModel({
        component: FilterStatesComponent,
        caption: 'states',
        items: {
            countryStates: new FilterStatesModel(this.filterStatesService)
        }
    });
    filterModelAssignment: FilterModel;
    filterModelStatus: FilterModel = new FilterModel({
        component: FilterCheckBoxesComponent,
        caption: 'status',
        filterMethod: FilterHelpers.filterByCustomerStatus,
        field: 'StatusId',
        items: {
            element: new FilterCheckBoxesModel(
                {
                    dataSource$: this.store$.pipe(select(StatusesStoreSelectors.getStatuses)),
                    nameField: 'name',
                    keyExpr: 'id',
                    selectedKeys$: of(['A'])
                })
        }
    });
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;
    tenantHasBankCodeFeature = this.userManagementService.checkBankCodeFeature();
    selectedPartnerKeys: any = [];
    _selectedPartners: any = [];
    get selectedPartners(): any[] {
        return this._selectedPartners || [];
    }
    set selectedPartners(items: any[]) {
        this._selectedPartners = items;
        this.selectedPartnerKeys = [];
        items.forEach((item: any) => {
            if (item && item.Id)
                this.selectedPartnerKeys.push(item.Id);
        });
        this.initToolbarConfig();
    }

    public headlineButtons: HeadlineButton[] = [
        {
            enabled: this.permission.checkCGPermission(this.partnerContactGroup),
            action: this.createPartner.bind(this),
            label: this.l('CreateNewPartner')
        }
    ];

    partnerTypes: any/*PartnerTypeDto*/[];
    permissions = AppPermissions;
    pivotGridDataIsLoading: boolean;
    private pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            this.pivotGridDataIsLoading = true;
            return this.crmService.loadSlicePivotGridData(
                this.getODataUrl(this.groupDataSourceURI),
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
    contentHeight$: Observable<number> = this.crmService.contentHeight$;
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    mapHeight$: Observable<number> = this.crmService.mapHeight$;
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
                        this.dateField
                    );
                    return this.oDataService.requestLengthIsValid(chartDataUrl)
                        ? this.httpClient.get(chartDataUrl)
                        : of(null);
                })
            ).toPromise().then((result: any) => {
                this.chartDataUrl = null;
                if (result) {
                    result = this.crmService.parseChartData(result);
                    this.chartInfoItems = result.infoItems;
                    return result.items;
                } else {
                    this.chartInfoItems = [];
                    return [];
                }
            });
        }
    });
    private _refresh: BehaviorSubject<null> = new BehaviorSubject<null>(null);
    private refresh$: Observable<null> = this._refresh.asObservable();
    mapDataIsLoading = false;
    filterChanged$: Observable<FilterModel[]> = this.filtersService.filtersChanged$.pipe(
        filter(() => this.componentIsActivated)
    );
    selectedMapArea$: Observable<MapArea> = this.mapService.selectedMapArea$;
    assignedUsersSelector = select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: this.partnerContactGroup });
    totalCount: number;
    toolbarConfig: ToolbarGroupModel[];
    private filters: FilterModel[] = this.getFilters();
    odataRequestValues: ODataRequestValues;
    odataRequestValues$: Observable<ODataRequestValues> = concat(
        this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom).pipe(first()),
        this.filterChanged$.pipe(
            switchMap(() => this.oDataService.getODataFilter(this.filters, this.filtersService.getCheckCustom))
        )
    ).pipe(
        filter((odataRequestValues: ODataRequestValues) => !!odataRequestValues),
        tap((odataRequestValues: ODataRequestValues) => this.odataRequestValues = odataRequestValues)
    );
    mapData$: Observable<MapData>;
    mapInfoItems$: Observable<InfoItem[]>;
    private queryParams$: Observable<Params> = this._activatedRoute.queryParams.pipe(
        takeUntil(this.destroy$),
        filter(() => this.componentIsActivated)
    );
    isBankCodeLayoutType: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    rowsViewHeight: number;
    isMergeAllowed = this.isGranted(AppPermissions.CRMMerge);
    readonly partnerFields: KeysEnum<PartnerDto> = PartnerFields;
    manageDisabled = !this.permission.checkCGPermission(this.partnerContactGroup);
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    pipelineSelectFields: string[];
    pipelineDataSource: any;
    dataStore = {
        key: this.partnerFields.Id,
        deserializeDates: false,
        url: this.getODataUrl(
            this.dataSourceURI,
            [
                this.filterModelStatus.filterMethod(this.filterModelStatus),
                FiltersService.filterByPartnerGroupId(),
                FiltersService.filterByParentId()
            ]
        ),
        version: AppConsts.ODataVersion,
        beforeSend: (request) => {
            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            request.params.$select =
            this.pipelineSelectFields = DataGridService.getSelectFields(
                this.dataGrid,
                [
                    this.partnerFields.Id,
                    this.partnerFields.OrganizationId,
                    this.partnerFields.Email,
                    this.partnerFields.Phone,
                    this.partnerFields.UserId
                ]
            );
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        }
    };

    constructor(
        injector: Injector,
        private contactService: ContactsService,
        private partnerService: PartnerServiceProxy,
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
        private filterStatesService: FilterStatesService,
        private nameParserService: NameParserService,
        private userManagementService: UserManagementService,
        private httpClient: HttpClient,
        public appService: AppService,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy
    ) {
        super(injector);
        this.searchValue = '';
        this.dataSource = new DataSource({store: new ODataStore(this.dataStore)});
        this.pipelineService.stageChange$.subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(this.pipelinePurposeId)).name);
        });
        if (this.userManagementService.checkBankCodeFeature()) {
            this.pivotGridDataSource.fields.unshift({
                area: 'filter',
                dataField: 'BankCode'
            });
        }
        this.totalDataSource = new DataSource({
            paginate: false,
            store: new ODataStore({
                url: this.getODataUrl(this.totalDataSourceURI, [
                    FiltersService.filterByParentId()
                ]),
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
    }

    ngOnInit() {
        this.getStatuses();
        this.getPartnerTypes();
        this.activate();
        this.handleModuleChange();
        this.handleTotalCountUpdate();
        this.handleDataGridUpdate();
        this.handlePivotGridUpdate();
        this.handleChartUpdate();
        this.handleMapUpdate();
        this.handleDataLayoutTypeInQuery();
        this.crmService.handleCountryStateParams(this.queryParams$, this.filterCountryStates);
        this.handleFiltersPining();
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

    private waitUntil(layoutType: DataLayoutType) {
        return (data) => this.dataLayoutType.value === layoutType ? of(data) : this.dataLayoutType$.pipe(
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === layoutType),
            first(),
            mapTo(data)
        );
    }

    private listenForUpdate(layoutType: DataLayoutType) {
        return combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            switchMap(this.waitUntil(layoutType))
        );
    }

    private handleDataGridUpdate() {
        this.listenForUpdate(DataLayoutType.DataGrid).pipe(skip(1)).subscribe(() => {
            this.processFilterInternal();
        });
    }

    private handleTotalCountUpdate() {
        combineLatest(
            this.odataRequestValues$,
            this.refresh$
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$)
        ).subscribe(([odataRequestValues, ]: [ODataRequestValues, null]) => {
            let url = this.getODataUrl(
                this.totalDataSourceURI,
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

    private handlePivotGridUpdate() {
        this.listenForUpdate(DataLayoutType.PivotGrid).pipe(skip(1)).subscribe(() => {
            this.pivotGridComponent.dataGrid.instance.updateDimensions();
            this.processFilterInternal();
        });
    }

    private handleChartUpdate() {
        combineLatest(
            this.chartComponent.summaryBy$,
            this.listenForUpdate(DataLayoutType.Chart)
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
        ).subscribe(([summaryBy, [odataRequestValues, ]]: [SummaryBy, [ODataRequestValues, ]]) => {
            const chartDataUrl = this.crmService.getChartDataUrl(
                this.getODataUrl(this.groupDataSourceURI),
                odataRequestValues,
                summaryBy,
                this.dateField
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
        const partnersData$: Observable<any> = combineLatest(
            this.listenForUpdate(DataLayoutType.Map),
            this.selectedMapArea$
        ).pipe(
            map(([[odataRequestValues, ], mapArea]: [[ODataRequestValues, null], MapArea]) => {
                return this.mapService.getSliceMapUrl(
                    this.getODataUrl(this.groupDataSourceURI),
                    odataRequestValues,
                    mapArea,
                    this.dateField
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
        this.mapData$ = this.mapService.getAdjustedMapData(partnersData$);
        this.mapInfoItems$ = this.mapService.getMapInfoItems(partnersData$, this.selectedMapArea$);
    }

    private handleDataLayoutTypeInQuery() {
        this.queryParams$.pipe(
            pluck('dataLayoutType'),
            filter((dataLayoutType: DataLayoutType) => dataLayoutType && dataLayoutType != this.dataLayoutType.value)
        ).subscribe((dataLayoutType: DataLayoutType) => {
            this.toggleDataLayout(+dataLayoutType);
        });
    }

    toggleToolbar() {
        this.repaintDataGrid();
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
                    }
            });
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

    onSelectionChanged($event) {
        this.selectedPartnerKeys = $event.component.getSelectedRowKeys();
        this.selectedPartners = $event.component.getSelectedRowsData();
        this.initToolbarConfig();
    }

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dependencyChanged = false;
        this._refresh.next(null);
    }

    createPartner() {
        this.dialog.open(CreateEntityDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: () => this.invalidate(),
                customerType: this.partnerContactGroup
            }
        }).afterClosed().subscribe(() => this.invalidate());
    }

    showPartnerDetails(event, section?: string, queryParams?: Params) {
        let partner: PartnerDto = event.data || event,
            orgId = partner.OrganizationId,
            partnerId = partner.Id;

        if (partnerId) {
            if (event.component)
                event.component.cancelEditData();

            this.searchClear = false;
            setTimeout(() => {
                this._router.navigate(
                    ['app/crm/contact', partnerId]
                        .concat(orgId ? ['company', orgId] : [])
                        .concat(section ? [ section ] : []),
                { queryParams: { referrer: 'app/crm/partners', ...queryParams } });
            });
        }
    }

    onCardClick({entity, entityStageDataSource, loadMethod}) {
        this.showPartnerDetails({data: entity});
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Partner, entityStageDataSource, loadMethod);
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedPartnerKeys = [];
        this.dataLayoutType.next(dataLayoutType);
        this.pipelineService.toggleDataLayoutType(dataLayoutType);
        this.initDataSource();
        this.initToolbarConfig();
        if (dataLayoutType != DataLayoutType.Pipeline) {
            if (this.pipelineComponent)
                this.pipelineComponent.deselectAllCards();
            if (this.showDataGrid)
                setTimeout(() => this.repaintDataGrid());
        }
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
            this.selectedPartnerKeys = [];
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
                field: 'Xref',
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
                field: 'AffiliateCode',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'AffiliateCode'
                    })
                }
            }),
            new FilterModel({
                component: FilterCalendarComponent,
                operator: {from: 'ge', to: 'le'},
                caption: 'creation',
                field: this.dateField,
                items: { from: new FilterItemModel(), to: new FilterItemModel() },
                options: { method: 'getFilterByDate', params: { useUserTimezone: true }, allowFutureDates: true }
            }),
            this.filterModelStatus,
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
                component: FilterMultilineInputComponent,
                caption: 'phone',
                filterMethod: this.filtersService.filterByMultiline,
                field: 'Phone',
                items: {
                    element: new FilterMultilineInputModel({
                        ls: this.localizationService,
                        name: 'Phone'
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
            this.filterModelOrgUnit,
            this.filterModelSource,
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
            }),
            new FilterModel({
                caption: 'partnerGroupId',
                hidden: true
            }),
            new FilterModel({
                caption: 'parentId',
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
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, 'ManageAssignments'),
                        attr: {
                            'filter-selected': this.filterModelAssignment && this.filterModelAssignment.isSelected
                        }
                    },
                    {
                        name: 'archive',
                        disabled: !this.permission.checkCGPermission(ContactGroup.Client, ''),
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
                        name: 'status',
                        action: this.toggleStatus.bind(this),
                        attr: {
                            'filter-selected': this.filterModelStatus && this.filterModelStatus.isSelected
                        }
                    },
                    {
                        name: 'partnerType',
                        action: this.toggleType.bind(this),
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, ''),
                        attr: {
                            'filter-selected': this.filterModelTypes && this.filterModelTypes.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, ''),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, ''),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, ''),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        action: this.toggleStars.bind(this),
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, ''),
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
                        disabled: !this.selectedPartners.length || !this.isGranted(AppPermissions.CRMPartnersManage) || this.selectedPartners.length > 2,
                        options: {
                            items: [
                                {
                                    text: this.l('Delete'),
                                    disabled: this.selectedPartners.length != 1, // need update
                                    action: () => {
                                        const client = this.selectedPartners[0];
                                        this.contactService.deleteContact(
                                            client.Name,
                                            ContactGroup.Client,
                                            client.Id,
                                            () => {
                                                this.invalidate();
                                                this.dataGrid.instance.clearSelection();
                                            }
                                        );
                                    }
                                },
                                {
                                    text: this.l('Toolbar_Merge'),
                                    disabled: this.selectedPartners.length != 2 || !this.isMergeAllowed,
                                    action: () => {
                                        this.contactService.mergeContact(
                                            this.selectedPartners[0],
                                            this.selectedPartners[1],
                                            true,
                                            true,
                                            () => { this.invalidate(); this.dataGrid.instance.deselectAll(); }
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
                        disabled: !this.permission.checkCGPermission(this.partnerContactGroup, 'ViewCommunicationHistory.SendSMSAndEmail'),
                        options: {
                            items: [
                                {
                                    text: this.l('Email'),
                                    disabled: this.selectedPartnerKeys.length > 1,
                                    action: () => {
                                        this.contactService.showEmailDialog({
                                            contactId: this.selectedPartnerKeys[0],
                                            to: this.selectedPartners.map(lead => lead.Email).filter(Boolean)
                                        }).subscribe();
                                    }
                                },
                                {
                                    text: this.l('SMS'),
                                    disabled: this.selectedPartnerKeys.length > 1,
                                    action: () => {
                                        const selectedPartners = this.selectedPartners;
                                        const contact = selectedPartners && selectedPartners[selectedPartners.length - 1];
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
                                    disabled: this.selectedPartnerKeys.length < 1,
                                    visible: this.appSession.isPerformancePartnerTenant,
                                    action: () => {
                                        this.message.confirm('', this.l('ReferralPartnersSendEmailConfirmation', this.selectedPartnerKeys.length), (res) => {
                                            if (res) {
                                                abp.ui.setBusy();
                                                this.contactProxy
                                                    .sendReferralPartnersEmail(this.selectedPartnerKeys)
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
                                    action: (options) => {
                                        if (this.showPivotGrid) {
                                            this.pivotGridComponent.dataGrid.instance.option(
                                                'export.fileName',
                                                this.exportService.getFileName(null, 'PivotGrid')
                                            );
                                            this.pivotGridComponent.dataGrid.instance.exportToExcel();
                                        } else if (this.showDataGrid) {
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
                    { name: 'print', action: Function(), visible: false }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    {
                        name: 'dataGrid',
                        visible: this.crmService.showSliceButtons,
                        action: this.toggleDataLayout.bind(this, DataLayoutType.DataGrid),
                        options: {
                            checkPressed: () => this.showDataGrid
                        }
                    },
                    {
                        name: 'pipeline',
                        action: () => {
                            //!! should be uncommented when API will be changed accordingly
                            //this.toggleDataLayout.bind(this, DataLayoutType.Pipeline);
                            this._router.navigate(['app/crm/leads'], { queryParams: {
                                contactGroup: 'Partner',
                                dataLayoutType: 0
                            }});
                        },
                        options: {
                            checkPressed: () => this.showPipeline
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

    toggleSource() {
        this.sourceComponent.toggle();
    }

    toggleColumnChooser() {
        if (this.showDataGrid) {
            DataGridService.showColumnChooser(this.dataGrid);
        } else if (this.showPivotGrid) {
            this.pivotGridComponent.toggleFieldPanel();
        }
    }

    repaintDataGrid(delay = 0) {
        setTimeout(() => this.dataGrid.instance.repaint(), delay);
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

    get showPipeline(): boolean {
        return this.dataLayoutType.value === DataLayoutType.Pipeline;
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

    private exportToImage(format: ImageFormat) {
        if (this.showChart) {
            this.chartComponent.exportTo(format);
        }
    }

    searchValueChange(e: object) {
        if (this.searchValue != e['value']) {
            this.searchValue = e['value'];
            this._refresh.next(null);
        }
    }

    processFilterInternal() {
        if (this.showDataGrid || this.showPivotGrid) {
            this.processODataFilter(
                (this.showPivotGrid ? this.pivotGridComponent : this).dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                this.filtersService.getCheckCustom
            );
        }
    }

    initDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => {
                    this.pipelineDataSource = {
                        uri: this.dataSourceURI,
                        requireTotalCount: true,
                        store: new ODataStore(this.dataStore)
                    };
                });
        } else if (this.showDataGrid) {
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
        const pivotGridInstance = this.pivotGridComponent && this.pivotGridComponent.dataGrid && this.pivotGridComponent.dataGrid.instance;
        CrmService.setDataSourceToComponent(this.pivotGridDataSource, pivotGridInstance);
    }

    private setChartInstance() {
        const chartInstance = this.chartComponent && this.chartComponent.chart && this.chartComponent.chart.instance;
        CrmService.setDataSourceToComponent(this.chartDataSource, chartInstance);
    }

    updatePartnerStatuses(status: Status) {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        this.clientService.updateContactStatuses(
            selectedIds,
            this.partnerContactGroup,
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
        this.lifeCycleSubjectsService.activate.next();
        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        if (this.dependencyChanged)
            this.invalidate();

        this.showHostElement(() => {
            this.pipelineComponent.detectChanges();
        });
    }

    repaintToolbar() {
        if (this.toolbar) {
            this.toolbar.toolbarComponent.instance.repaint();
        }
    }

    deactivate() {
        super.deactivate();
        this.subRouteParams.unsubscribe();
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Partner, this.dataGrid.instance.getDataSource());
        this.showHostElement(() => {
            this.repaintToolbar();
        });
    }

    toggleActionsMenu(event) {
        ActionMenuService.toggleActionMenu(event, this.actionEvent).subscribe((actionRecord) => {
            const partner: PartnerDto = event.data;
            ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, partner);
            this.actionEvent = actionRecord;
        });
    }

    mapItemClick(params: Params) {
        this.toggleDataLayout(DataLayoutType.DataGrid);
        this.crmService.updateCountryStateFilter(params, this.filterCountryStates);
        this.filtersService.change([this.filterCountryStates]);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionEvent = null;
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onStageChanged(lead) {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.getVisibleRows().some((row) => {
                if (lead.Id == row.data.Id) {
                    row.data.Stage = lead.Stage;
                    row.data.StageId = lead.StageId;
                    return true;
                }
            });
    }

    onOwnerFilterApply(event) {
        let filter = this.filterModelOrgUnit.items.element.value;
        this.filterModelOrgUnit.items.element.value = filter &&
            (!event || filter[0] == event.id) ? [] : [event.id];
        this.filtersService.change([this.filterModelOrgUnit]);
    }

    onDragEnd = e => {
        if (e && e.fromIndex != e.toIndex) {
            forkJoin(
                from(e.component.byKey(e.component.getKeyByRowIndex(e.fromIndex))),
                from(e.component.byKey(e.component.getKeyByRowIndex(e.toIndex)))
            ).subscribe(([source, target]: [PartnerDto, PartnerDto]) => {
                this.contactService.mergeContact(source, target, true, true, () => this.invalidate());
            });
        }
    }
}