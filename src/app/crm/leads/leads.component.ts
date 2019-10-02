/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { first, filter, startWith, takeUntil } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';

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
import { FilterHelpers } from '../shared/helpers/filter.helper';
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
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { OrganizationUnitsStoreActions } from '@app/crm/store';
import { DataGridHelper } from '@app/crm/shared/helpers/data-grid.helper';
import { SlicePivotGridComponent } from '@app/shared/common/slice/pivot-grid/slice-pivot-grid.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SliceChartComponent } from '@app/shared/common/slice/chart/slice-chart.component';
import { CrmService } from '@app/crm/crm.service';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.less'],
    providers: [ LeadServiceProxy, ContactServiceProxy, LifecycleSubjectsService, PipelineService ],
    animations: [ appModuleAnimation() ]
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
    @ViewChild(SlicePivotGridComponent) slicePivotGridComponent: SlicePivotGridComponent;
    @ViewChild(SliceChartComponent) sliceChartComponent: SliceChartComponent;

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
        if (this.appService.toolbarConfig)
            this.initToolbarConfig();
    }

    contactGroups = Object.keys(ContactGroup).map((group) => {
        return {
            text: this.l('ContactGroup_' + group),
            value: group,
            disabled: !this.contactService.checkCGPermission(ContactGroup[group], '')
        };
    });
    selectedContactGroup = Object.keys(ContactGroup).shift();
    contactGroupId = ContactGroup[this.selectedContactGroup];

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
    private dataLayoutType: DataLayoutType = DataLayoutType.PivotGrid;
    private readonly dataSourceURI = 'Lead';
    private readonly groupDataSourceURI = 'LeadGroup';
    private filters: FilterModel[];
    private subRouteParams: any;
    private filterChanged = false;
    formatting = AppConsts.formatting;

    public headlineConfig = {
        names: [],
        // onRefresh: () => {
        //     this.refresh();
        // },
        toggleToolbar: this.toggleToolbar.bind(this),
        buttons: [
            {
                enabled: this.contactService.checkCGPermission(ContactGroup.Client),
                action: this.createLead.bind(this),
                lable: this.l('CreateNewLead')
            }
        ]
    };
    permissions = AppPermissions;
    pivotGridDataSource = {
        remoteOperations: true,
        load: (loadOptions) => {
            const params = {
                contactGroupId: this.contactGroupId,
            };
            if (loadOptions.take !== undefined) {
                params['take'] = loadOptions.take;
            }
            if (loadOptions.skip !== undefined) {
                params['skip'] = loadOptions.skip;
            }
            if (loadOptions.group) {
                params['group'] = JSON.stringify(loadOptions.group);
            }
            if (loadOptions.filter) {
                params['filter'] = JSON.stringify(loadOptions.filter);
            }
            if (loadOptions.totalSummary && loadOptions.totalSummary.length) {
                params['totalSummary'] = JSON.stringify(loadOptions.totalSummary);
            }
            if (loadOptions.groupSummary) {
                params['groupSummary'] = JSON.stringify(loadOptions.groupSummary);
            }
            const filter = this.oDataService.getODataFilter(this.filters, this.getCheckCustom);
            if (filter) {
                params['$filter'] = filter;
            }
            return this.http.get(this.getODataUrl(this.groupDataSourceURI), {
                params: params,
                headers: new HttpHeaders({
                    'Authorization': 'Bearer ' + abp.auth.getToken()
                })
            }).toPromise().then((data: any) => {
                console.log(data);
                return data;
            });
        },
        fields: [
            {
                area: 'row',
                dataField: 'CountryId',
                name: 'country',
                expanded: true,
                sortBy: 'displayText'
            },
            {
                area: 'row',
                dataField: 'StateId',
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
                area: 'row',
                dataField: 'Name',
                name: 'customerName',
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
                dataField: 'AffiliateCode'
            },
            {
                area: 'filter',
                dataField: 'BankCode'
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
                dataField: 'ChannelCode'
            },
            {
                area: 'filter',
                dataField: 'City'
            },
            {
                area: 'filter',
                dataField: 'CompanyName'
            },
            {
                area: 'filter',
                dataField: 'CreationTime'
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
                dataField: 'Website'
            },
            {
                area: 'filter',
                dataField: 'ZipCode'
            }
        ],
        select: [
            'AffiliateCode',
            'BankCode',
            'CampaignCode',
            'ChannelCode',
            'City',
            'CompanyName',
            'CountryId',
            'CreationTime',
            'EntryUrl',
            'Industry',
            'Rating',
            'SourceCode',
            'Stage',
            'StateId',
            'StreetAddress',
            'Title',
            'Website',
            'ZipCode'
        ]
    };
    chartDataSource = new DataSource({
        key: 'id',
        load: () => {
            const params = {
                contactGroupId: this.contactGroupId,
                group: `[{"selector":"CreationTime","groupInterval":"${this.sliceChartComponent.summaryBy.value}","isExpanded":false}]`,
                groupSummary: '[{"selector":"CreationTime","summaryType":"min"}]'
            };
            const filter = this.oDataService.getODataFilter(this.filters, this.getCheckCustom);
            if (filter) {
                params['$filter'] = filter;
            }
            return this.http.get(this.getODataUrl(this.groupDataSourceURI), {
                headers: new HttpHeaders({
                    'Authorization': 'Bearer ' + abp.auth.getToken()
                }),
                params: params
            }).toPromise().then((contacts: any) => {
                return contacts.data.map(contact => ({
                    creationDate: contact.summary[0],
                    count: contact.count
                })).sort((contactA, contactB) => {
                    const dateA = new Date(contactA.creationDate);
                    const dateB = new Date(contactB.creationDate);
                    return dateA > dateB ? 1 : (dateA === dateB ? 0 : -1);
                });
            });
        }
    });

    private readonly CONTACT_GROUP_CACHE_KEY = 'CONTACT_GROUP';
    private organizationUnits: OrganizationUnitDto[];
    contentWidth$: Observable<number> = this.crmService.contentWidth$;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;

    constructor(injector: Injector,
        private contactService: ContactsService,
        private leadService: LeadServiceProxy,
        private pipelineService: PipelineService,
        private filtersService: FiltersService,
        private appService: AppService,
        private store$: Store<AppStore.State>,
        private reuseService: RouteReuseStrategy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private cacheService: CacheService,
        private sessionService: AppSessionService,
        private http: HttpClient,
        private crmService: CrmService,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService
    ) {
        super(injector);

        this.contactGroupOptionInit();
        this.dataSource = new DataSource({
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.params.contactGroupId = this.contactGroupId;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                deserializeDates: false,
                paginate: true
            }
        });
        this.searchValue = '';
    }

    private static setDataSourceToComponent(dataSource: any, componentInstance: any) {
        if (componentInstance && !componentInstance.option('dataSource')) {
            componentInstance.option('dataSource', dataSource);
        }
    }

    ngOnInit() {
        this.loadOrganizationUnits();
        combineLatest(
            this.sliceChartComponent.summaryBy$,
            this.filtersService.filterChanged$.pipe(startWith(null))
        ).pipe(
            takeUntil(this.lifeCycleSubjectsService.destroy$),
            filter(() => this.dataLayoutType === DataLayoutType.Chart)
        ).subscribe(() => {
            this.chartDataSource.load();
        });
        this.activate();
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
        return this.dataLayoutType === DataLayoutType.Pipeline;
    }

    get showDataGrid(): boolean {
        return this.dataLayoutType === DataLayoutType.DataGrid;
    }

    get showPivotGrid(): boolean {
        return this.dataLayoutType === DataLayoutType.PivotGrid;
    }

    get showChart(): boolean {
        return this.dataLayoutType === DataLayoutType.Chart;
    }

    getOrganizationUnitName = (e) => {
        return DataGridHelper.getOrganizationUnitName(e.OrganizationUnitId, this.organizationUnits);
    }

    ngAfterViewInit() {
        this.initDataSource();
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this.filtersService.fixed = false;
        this.filtersService.disable();
        this.initToolbarConfig();
    }

    contactGroupOptionInit() {
        let cacheKey = this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY);
        if (this.cacheService.exists(cacheKey)) {
            this.selectedContactGroup = this.cacheService.get(cacheKey);
            this.contactGroupId = ContactGroup[this.selectedContactGroup];
            this.createButtonEnabledSet();
        }
    }

    private createButtonEnabledSet() {
        this.headlineConfig.buttons[0].enabled =
            this.contactService.checkCGPermission(this.contactGroupId);
    }

    private isActivated() {
        return this.subRouteParams && !this.subRouteParams.closed;
    }

    private paramsSubscribe() {
        if (!this.isActivated())
            this.subRouteParams = this._activatedRoute.queryParams.subscribe(params => {
                if (params['dataLayoutType']) {
                    let dataLayoutType = params['dataLayoutType'];
                    if (dataLayoutType != this.dataLayoutType) {
                        if (dataLayoutType == DataLayoutType.DataGrid)
                            this.pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId)
                                .subscribe(this.onStagesLoaded.bind(this));
                        this.toggleDataLayout(dataLayoutType);
                    }
                }

                if ('addNew' == params['action'])
                    setTimeout(() => this.createLead());
                if (params['refresh']) {
                    this.refresh();
                    this.filterChanged = true;
                }
            });
    }

    onContentReady(event) {
        this.finishLoading();
        if (this.exportCallback)
            this.exportCallback();
        else {
            if (this.dataLayoutType == DataLayoutType.DataGrid)
                this.setGridDataLoaded();
            event.component.columnOption('command:edit', {
                visibleIndex: -1,
                width: 40
            });
        }
    }

    refresh(invalidateDashboard = true, allViews = false) {
        if (this.showPivotGrid || this.showDataGrid) {
            setTimeout(() => {
                this.processFilterInternal(allViews ? [ this.pipelineComponent, this ] : undefined);
            });
        }
        if (this.showChart) {
            this.chartDataSource.load();
        }
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
        this.dataLayoutType = dataLayoutType;
        this.pipelineService.toggleDataLayoutType(this.dataLayoutType);
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
                        this.slicePivotGridComponent.pivotGrid.instance.updateDimensions();
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
                    field: 'CreationTime',
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
        this.manageDisabled = !this.contactService.checkCGPermission(this.contactGroupId);
        this.isActivated() && this.appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: () => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                                this.slicePivotGridComponent.pivotGrid.instance.updateDimensions();
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
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId, 'ManageAssignments'),
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
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId, 'ManageListsAndTags'),
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId, 'ManageListsAndTags'),
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId, 'ManageRatingAndStars'),
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: !this.contactService.checkCGPermission(this.contactGroupId, 'ManageRatingAndStars'),
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
                            !this.contactService.checkCGPermission(this.contactGroupId) ||
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
                                    action: Function(),
                                    text: this.l('Save as PDF'),
                                    icon: 'pdf',
                                },
                                {
                                    action: this.exportData.bind(this, options => {
                                        if (this.dataLayoutType === DataLayoutType.PivotGrid) {
                                            this.slicePivotGridComponent.pivotGrid.instance.exportToExcel();
                                        } else {
                                            this.exportToXLS(options);
                                        }
                                    }),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: this.exportData.bind(this, options => this.exportToCSV(options)),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportData.bind(this, options => this.exportToGoogleSheet(options)),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                },
                                {
                                    type: 'downloadOptions'
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
                    { name: 'showCompactRowsHeight', action: this.toggleCompactView.bind(this) },
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
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

    exportPipelineSelectedItemsFilter(dataSource) {
        let selectedLeads = this.pipelineComponent.getSelectedEntities();
        if (selectedLeads.length) {
            dataSource.filter(selectedLeads.map((lead) => {
                return ['Id', '=', lead.Id];
            }).reduce((r, a) => r.concat([a, 'or']), []));
        }
        return selectedLeads.length;
    }

    exportData(callback, options) {
        if (this.dataLayoutType === DataLayoutType.Pipeline) {
            let importOption = 'all',
                instance = this.showDataGrid ? this.dataGrid.instance : this.slicePivotGridComponent.pivotGrid.instance,
                dataSource = instance.option('dataSource'),
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

    filterByStages(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let filterData = FilterHelpers.ParsePipelineIds(filter.items.element.value);
            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByStates(filter: FilterModel) {
        return FilterHelpers.filterByStates(filter);
    }

    filterByAssignedUser(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByOrganizationUnitId(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByList(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByTag(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByRating(filter: FilterModel) {
        return FilterHelpers.filterByRating(filter);
    }

    filterByStar(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    searchValueChange(e: object) {
        if (this.filterChanged = (this.searchValue != e['value'])) {
            this.searchValue = e['value'];
            this.initToolbarConfig();
            this.processFilterInternal();
        }
    }

    processFilterInternal(cxts?: any[]) {
        if (this.showPipeline) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }

        let contexts = cxts && cxts.length ? cxts : [ this.showPipeline ? this.pipelineComponent : this ];
        contexts.forEach(context => {
            if (context && context.processODataFilter) {
                context.processODataFilter.call(
                    context,
                    this.showPivotGrid ? this.slicePivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                    this.dataSourceURI,
                    this.filters,
                    this.getCheckCustom
                );
            }
        });
    }

    getCheckCustom = (filter: FilterModel) => {
        let filterMethod = this['filterBy' +
        this.capitalize(filter.caption)];
        if (filterMethod)
            return filterMethod.call(this, filter);
    }

    initDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => { this.pipelineDataSource = this.dataSource; });
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
            this.startLoading();
        }
    }

    private setPivotGridInstance() {
        const pivotGridInstance = this.slicePivotGridComponent && this.slicePivotGridComponent.pivotGrid && this.slicePivotGridComponent.pivotGrid.instance;
        LeadsComponent.setDataSourceToComponent(this.pivotGridDataSource, pivotGridInstance);
    }

    private setChartInstance() {
        const chartInstance = this.sliceChartComponent && this.sliceChartComponent.chartComponent && this.sliceChartComponent.chartComponent.instance;
        LeadsComponent.setDataSourceToComponent(this.chartDataSource, chartInstance);
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
        this._router.navigate(['app/crm/contact', clientId, 'lead', leadId].concat(orgId ? ['company', orgId] : []),
            { queryParams: { referrer: 'app/crm/leads', dataLayoutType: this.dataLayoutType } });
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

        this.paramsSubscribe();
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

        this.appService.updateToolbar(null);
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.subRouteParams.unsubscribe();
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

    getAssignedUsersSelector() {
        return select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: ContactGroup.Client });
    }

    onContactGroupChanged(event) {
        if (event.previousValue != event.value) {
            this.contactGroupId = ContactGroup[event.value];
            this.cacheService.set(this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY), event.value);
            this.createButtonEnabledSet();
            this.filterChanged = true;
            this.initToolbarConfig();
            if (!this.showPipeline)
                this.refresh(false);
        }
    }

}
