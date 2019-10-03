/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { first, finalize, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import { FilterHelpers } from '@app/crm/shared/helpers/filter.helper';
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

@Component({
    templateUrl: './clients.component.html',
    styleUrls: ['./clients.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ClientService, LifecycleSubjectsService, ContactServiceProxy, ImpersonationService ]
})
export class ClientsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild(StaticListComponent) statusComponent: StaticListComponent;
    @ViewChild(PivotGridComponent) slicePivotGridComponent: PivotGridComponent;

    private readonly MENU_LOGIN_INDEX = 1;
    private readonly dataSourceURI: string = 'Customer';
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
                lable: this.l('CreateNewCustomer')
            }
        ]
    };

    actionEvent: any;
    actionMenuItems = [
        {
            text: this.l('Edit'),
            visible: true,
            action: () => {
                this.showClientDetails(this.actionEvent);
            }
        },
        {
            text: this.l('LoginAsThisUser'),
            visible: this.permission.isGranted(AppPermissions.AdministrationUsersImpersonation),
            action: () => {
                this.impersonationService.impersonate(this.actionEvent.data.UserId, this.appSession.tenantId);
            }
        }
    ];
    permissions = AppPermissions;
    private pivotGridDataSourceConfig = {
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
        ],
        select: [
            'BankCode',
            'City',
            'CompanyName',
            'CountryId',
            'CreationTime',
            'Rating',
            'StateId',
            'Status',
            'ZipCode'
        ]
    };
    pivotGridDataSource: any;
    dataLayoutType: DataLayoutType = DataLayoutType.DataGrid;
    sliceStorageKey = 'CRM_Clients_Slice_' + this.sessionService.tenantId + '_' + this.sessionService.userId;
    private filterChanged = false;
    contentHeight$: Observable<number> = this.crmService.contentHeight$;

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
        public dialog: MatDialog,
        public appService: AppService,
        public contactProxy: ContactServiceProxy,
        public userManagementService: UserManagementService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.filterModelStatus.updateCaptions();
        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI, this.filterByStatus(this.filterModelStatus)),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        };
        this.pivotGridDataSource = {
            ...this.dataSource,
            ...this.pivotGridDataSourceConfig
        };
        this.searchValue = '';
        this.pipelineService.stageChange.asObservable().subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this.pipelineService.getStages(AppConsts.PipelinePurposeIds.lead)).name);
        });

        this.getOrganizationUnits();
        this.activate();
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
        this.processFilterInternal();
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
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: () => {
                                    if (this.dataLayoutType === DataLayoutType.PivotGrid) {
                                        this.slicePivotGridComponent.pivotGrid.instance.exportToExcel();
                                    } else if (this.dataLayoutType === DataLayoutType.DataGrid) {
                                        this.exportToXLS.bind(this);
                                    }
                                },
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
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
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
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

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedClientKeys = [];
        this.dataLayoutType = dataLayoutType;
        this.initDataSource();
        if (this.showDataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint());
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => {
                if (this.showPivotGrid) {
                    this.slicePivotGridComponent.pivotGrid.instance.updateDimensions();
                }
                this.processFilterInternal();
            });
        }
    }

    initDataSource() {
        if (this.showDataGrid) {
            this.setDataGridInstance();
        } else if (this.showPivotGrid) {
            this.setPivotGridInstance();
        }
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
    }

    setPivotGridInstance() {
        let instance = this.slicePivotGridComponent && this.slicePivotGridComponent.pivotGrid && this.slicePivotGridComponent.pivotGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.pivotGridDataSource);
        }
    }

    get showDataGrid(): boolean {
        return this.dataLayoutType === DataLayoutType.DataGrid;
    }

    get showPivotGrid(): boolean {
        return this.dataLayoutType === DataLayoutType.PivotGrid;
    }

    filterByStates(filter: FilterModel) {
        return FilterHelpers.filterByStates(filter);
    }

    filterByStatus(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
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

    processFilterInternal() {
        if (this.dataGrid && this.dataGrid.instance
            || this.slicePivotGridComponent && this.slicePivotGridComponent.pivotGrid && this.slicePivotGridComponent.pivotGrid.instance) {
            this.processODataFilter(
                this.showPivotGrid ? this.slicePivotGridComponent.pivotGrid.instance : this.dataGrid.instance,
                this.dataSourceURI,
                this.filters,
                (filter) => {
                    let filterMethod = this['filterBy' +
                        this.capitalize(filter.caption)];
                    if (filterMethod)
                        return filterMethod.call(this, filter);
                }
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
