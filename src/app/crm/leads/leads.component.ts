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

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Store, select } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import {
    ContactAssignedUsersStoreSelectors,
    AppStore,
    TagsStoreSelectors,
    ListsStoreSelectors,
    StarsStoreSelectors,
    RatingsStoreSelectors
} from '@app/store';
import { PipelinesStoreSelectors } from '@app/crm/store';
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
import { LeadServiceProxy, ContactServiceProxy } from '@shared/service-proxies/service-proxies';
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

@Component({
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.less'],
    providers: [ LeadServiceProxy, ContactServiceProxy, LifecycleSubjectsService, PipelineService ],
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
        if (this._appService.toolbarConfig)
            this.initToolbarConfig();
    }

    contactGroups = Object.keys(ContactGroup).map((group) => {
        return {
            text: this.l('ContactGroup_' + group),
            value: group,
            disabled: !this._contactService.checkCGPermission(ContactGroup[group], '')
        };
    });
    selectedContactGroup = Object.keys(ContactGroup).shift();
    contactGroupId = ContactGroup[this.selectedContactGroup];

    stages = [];
    pipelineDataSource: any;
    collection: any;
    showPipeline = true;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    selectedClientKeys = [];
    manageDisabled = true;

    filterModelLists: FilterModel;
    filterModelTags: FilterModel;
    filterModelAssignment: FilterModel;
    filterModelStages: FilterModel;
    filterModelRating: FilterModel;
    filterModelStar: FilterModel;

    private rootComponent: any;
    private exportCallback: Function;
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Lead';
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
                enabled: this._contactService.checkCGPermission(ContactGroup.Client),
                action: this.createLead.bind(this),
                lable: this.l('CreateNewLead')
            }
        ]
    };
    permissions = AppPermissions;

    private readonly CONTACT_GROUP_CACHE_KEY = 'CONTACT_GROUP';

    constructor(injector: Injector,
        public dialog: MatDialog,
        public contactProxy: ContactServiceProxy,
        private _contactService: ContactsService,
        private _leadService: LeadServiceProxy,
        private _pipelineService: PipelineService,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private store$: Store<AppStore.State>,
        private _reuseService: RouteReuseStrategy,
        private lifeCycleSubjectsService: LifecycleSubjectsService,
        private itemDetailsService: ItemDetailsService,
        private _cacheService: CacheService,
        public userManagementService: UserManagementService
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
                    request.params.contactGroupId = this.contactGroupId;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                deserializeDates: false,
                paginate: true
            }
        };
        this.searchValue = '';
    }

    toggleToolbar() {
        this._appService.toolbarToggle();
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
        this._filtersService.fixed = false;
        this._filtersService.disable();
        this.initToolbarConfig();
    }

    contactGroupOptionInit() {
        let cacheKey = this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY);
        if (this._cacheService.exists(cacheKey)) {
            this.selectedContactGroup = this._cacheService.get(cacheKey);
            this.contactGroupId = ContactGroup[this.selectedContactGroup];
            this.createButtonEnabledSet();
        }
    }

    private createButtonEnabledSet() {
        this.headlineConfig.buttons[0].enabled =
            this._contactService.checkCGPermission(this.contactGroupId);
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
                        if (dataLayoutType == DataLayoutType.Grid)
                            this._pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId)
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
            if (this.dataLayoutType == DataLayoutType.Grid)
                this.setGridDataLoaded();
            event.component.columnOption('command:edit', {
                visibleIndex: -1,
                width: 40
            });
        }
    }

    refresh(invalidateDashboard = true) {
        setTimeout(() => {
            this.processFilterInternal();
        });
        if (invalidateDashboard) {
            (this._reuseService as CustomReuseStrategy).invalidate('dashboard');
        }
    }

    invalidate(quiet = false, stageId?: number) {
        this.lifeCycleSubjectsService.activate$.pipe(first()).subscribe(() => {
            this.refresh(false);
        });
    }

    toggleDataLayout(dataLayoutType: DataLayoutType) {
        this.selectedClientKeys = [];
        this.showPipeline = dataLayoutType == DataLayoutType.Pipeline;
        this.dataLayoutType = dataLayoutType;
        this._pipelineService.toggleDataLayoutType(this.dataLayoutType);
        this.initDataSource();
        if (this.showPipeline)
            this.dataGrid.instance.deselectAll();
        else {
            this.pipelineComponent.deselectAllCards();
            setTimeout(() => this.dataGrid.instance.repaint());
        }
        if (this.filterChanged) {
            this.filterChanged = false;
            if (!this.showPipeline)
                setTimeout(() => this.processFilterInternal());
        }
    }

    initFilterConfig(): void {
        if (this.filters) {
            this._filtersService.setup(this.filters);
            this._filtersService.checkIfAnySelected();
        } else {
            this._filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'name',
                    items: {Name: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Email',
                    items: {Email: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: {from: 'ge', to: 'le'},
                    caption: 'creation',
                    field: 'CreationTime',
                    items: {from: new FilterItemModel(), to: new FilterItemModel()},
                    options: {method: 'getFilterByDate', params: { useUserTimezone: true }}
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
                    items: {City: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'streetAddress',
                    items: {StreetAddress: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'zipCode',
                    items: {ZipCode: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    caption: 'SourceCode',
                    items: {SourceCode: new FilterItemModel()}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'startswith',
                    caption: 'Industry',
                    items: {Industry: new FilterItemModel()}
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
                    component: FilterInputsComponent,
                    caption: 'Campaign',
                    field: 'CampaignCode',
                    items: {CampaignCode: new FilterItemModel()}
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
                    operator: {from: 'ge', to: 'le'},
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
        this._filtersService.apply(() => {
            this.selectedClientKeys = [];
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this.manageDisabled = !this._contactService.checkCGPermission(this.contactGroupId);
        this.isActivated() && this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: (event) => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this._filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this._filtersService.fixed)
                                    this._filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this._filtersService.hasFilterSelected
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
                        disabled: !this._contactService.checkCGPermission(this.contactGroupId, 'ManageAssignments'),
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
                        disabled: !this._contactService.checkCGPermission(this.contactGroupId, 'ManageListsAndTags'),
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        disabled: !this._contactService.checkCGPermission(this.contactGroupId, 'ManageListsAndTags'),
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        disabled: !this._contactService.checkCGPermission(this.contactGroupId, 'ManageRatingAndStars'),
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        disabled: !this._contactService.checkCGPermission(this.contactGroupId, 'ManageRatingAndStars'),
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
                        disabled: !this.selectedLeads.length,
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
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportData.bind(this, options => {
                                    return this.exportToXLS(options);
                                }),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportData.bind(this, options => {
                                    return this.exportToCSV(options);
                                }),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportData.bind(this, options => {
                                    return this.exportToGoogleSheet(options);
                                }),
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
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Pipeline);
                            },
                        }
                    },
                    {
                        name: 'grid',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Grid);
                            },
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
                            this.toggleFullscreen(document.documentElement);
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
        if (this.showPipeline) {
            let importOption = 'all',
                instance = this.dataGrid.instance,
                dataSource = instance.option('dataSource'),
                checkExportOption = (dataSource, ignoreFilter = false) => {
                    if (options == importOption)
                        ignoreFilter || this.processFilterInternal(this);
                    else if (!this.exportPipelineSelectedItemsFilter(dataSource))
                        importOption = options;
                };

            if (dataSource) {
                checkExportOption(dataSource, true);
                callback(importOption).then(
                    () => dataSource.filter(null));
            } else {
                instance.option('dataSource',
                    dataSource = new DataSource(this.dataSource));
                checkExportOption(dataSource);
                this.exportCallback = () => {
                    this.exportCallback = null;
                    callback(importOption).then(
                        () => dataSource.filter(null));
                };
            }
        } else
            callback(options);
    }

    toggleCompactView() {
        this._pipelineService.toggleContactView();
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

    processFilterInternal(cxt?: any) {
        if (this.showPipeline) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }

        let context = cxt || (this.showPipeline ? this.pipelineComponent : this);
        context.processODataFilter.call(context,
            this.dataGrid.instance, this.dataSourceURI,
                this.filters, (filter) => {
                let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
                }
        );
    }

    initDataSource() {
        if (this.showPipeline) {
            if (!this.pipelineDataSource)
                setTimeout(() => { this.pipelineDataSource = this.dataSource; });
        } else {
            this.setDataGridInstance();
        }
    }

    setDataGridInstance() {
        let instance = this.dataGrid && this.dataGrid.instance;
        if (instance && !instance.option('dataSource')) {
            instance.option('dataSource', this.dataSource);
            this.startLoading();
        }
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
                id: this._pipelineService.getPipeline(
                    this.pipelinePurposeId).id + ':' + stage.id,
                index: stage.sortOrder,
                name: stage.name
            };
        });

        this.initToolbarConfig();
    }

    updateLeadsStage($event) {
        if (this.isGranted(AppPermissions.PagesCRMBulkUpdates)) {
            this.stagesComponent.tooltipVisible = false;
            this._pipelineService.updateEntitiesStage(
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
        this._leadService.deleteLeads(selectedIds).subscribe(() => {
            this.refresh();
            this.dataGrid.instance.deselectAll();
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.filterChanged = true;
        });
    }

    ngOnInit() {
        this.activate();
    }

    ngAfterViewInit() {
        this.initDataSource();
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
        this.showHostElement(() =>
            this.pipelineComponent.detectChanges());
    }

    deactivate() {
        super.deactivate();

        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
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
            this._cacheService.set(this.getCacheKey(this.CONTACT_GROUP_CACHE_KEY), event.value);
            this.createButtonEnabledSet();
            this.filterChanged = true;
            this.initToolbarConfig();
            if (!this.showPipeline)
                this.refresh(false);
        }
    }
}
