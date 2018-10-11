/** Core imports */
import {
    Component,
    OnInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';

/** Application imports */
import { AppService } from '@app/app.service';
import {
    PartnerAssignedUsersStoreSelectors,
    AppStore,
    ListsStoreSelectors,
    PartnerTypesStoreSelectors,
    RatingsStoreSelectors,
    StarsStoreSelectors,
    StatusesStoreSelectors,
    TagsStoreSelectors
} from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { ODataSearchStrategy, ContactGroupType } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StaticListComponent } from '../shared/static-list/static-list.component';
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
import { FilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { ContactGroupStatusDto, BulkUpdatePartnerTypeInput, PartnerTypeServiceProxy, PartnerServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ClientService } from '@app/crm/clients/clients.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';

@Component({
    templateUrl: './partners.component.html',
    styleUrls: ['./partners.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ClientService, PartnerServiceProxy, PartnerTypeServiceProxy ]
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

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Partner';
    private filters: FilterModel[];
    private rootComponent: any;
    private formatting = AppConsts.formatting;
    private subRouteParams: any;
    private canSendVerificationRequest = false;
    private dependencyChanged = false;

    statuses: ContactGroupStatusDto[];
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
        onRefresh: this.invalidate.bind(this),
        buttons: [
            {
                enabled: true,
                action: this.createPartner.bind(this),
                lable: this.l('CreateNewPartner')
            }
        ]
    };

    partnerTypes: any/*PartnerTypeDto*/[];

    constructor(injector: Injector,
        public dialog: MatDialog,
        public partnerService: PartnerServiceProxy,
        private _router: Router,
        private _appService: AppService,
        private _pipelineService: PipelineService,
        private _filtersService: FiltersService,
        private _activatedRoute: ActivatedRoute,
        private _clientService: ClientService,
        private _partnerTypeService: PartnerTypeServiceProxy,
        private store$: Store<AppStore.State>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        };

        this.searchColumns = [
            {name: 'CompanyName', strategy: ODataSearchStrategy.StartsWith},
            {name: 'Email', strategy: ODataSearchStrategy.Equals},
            {name: 'Phone', strategy: ODataSearchStrategy.Equals},
            {name: 'City', strategy: ODataSearchStrategy.StartsWith},
            {name: 'State', strategy: ODataSearchStrategy.StartsWith},
            {name: 'StateId', strategy: ODataSearchStrategy.Equals}
        ];
        FilterHelpers.nameParts.forEach(x => {
            this.searchColumns.push({name: x, strategy: ODataSearchStrategy.StartsWith});
        });
        this.searchValue = '';

        this._pipelineService.stageChange.asObservable().subscribe((lead) => {
            this.dependencyChanged = (lead.Stage == _.last(this._pipelineService.getStages(AppConsts.PipelinePurposeIds.lead)).name);
        });

        this.canSendVerificationRequest = this._appService.canSendVerificationRequest();
    }

    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)
            this.subRouteParams = this._activatedRoute.queryParams
                .subscribe(params => {
                    if ('addNew' == params['action'])
                        setTimeout(() => this.createPartner());
                    if (params['refresh'])
                        this.invalidate();
            });
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
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
        super.invalidate();
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    createPartner() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: this.invalidate.bind(this),
                customerType: ContactGroupType.Partner
            }
        }).afterClosed().subscribe(() => this.invalidate());
    }

    isPartnerCFOAvailable(userId) {
        return this._appService.isCFOAvailable(userId);
    }

    showPartnerDetails(event) {
        let partnerId = event.data && event.data.Id;
        if (!partnerId)
            return;

        this.searchClear = false;
        event.component.cancelEditData();
        this._router.navigate(['app/crm/partner', partnerId],
            { queryParams: { referrer: 'app/crm/partners'} });
    }

    redirectToCFO(event, userId) {
        this._appService.redirectToCFO(userId);
    }

    toggleDataLayout(dataLayoutType) {
        this.dataLayoutType = dataLayoutType;
    }

    initFilterConfig() {
        if (this.filters) {
            this._filtersService.setup(this.filters);
            this._filtersService.checkIfAnySelected();
        } else {
            this._filtersService.setup(
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
                        options: {method: 'getFilterByDate'}
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
                                    dataSource$: this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)),
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
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
                                    dataSource$: this.store$.pipe(select(PartnerAssignedUsersStoreSelectors.getAssignedUsers)),
                                    nameField: 'name',
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
                                    dataSource$: this.store$.pipe(select(ListsStoreSelectors.getLists)),
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
                                    dataSource$: this.store$.pipe(select(TagsStoreSelectors.getTags)),
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

        this._filtersService.apply(() => {
            this.selectedPartnerKeys = [];
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: event => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: event => {
                                this._filtersService.enable();
                            },
                            mouseout: event => {
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
                        attr: {
                            'filter-selected': this.filterModelTypes && this.filterModelTypes.isSelected
                        }
                    },
                    {
                        name: 'lists',
                        action: this.toggleLists.bind(this),
                        attr: {
                            'filter-selected': this.filterModelLists && this.filterModelLists.isSelected
                        }
                    },
                    {
                        name: 'tags',
                        action: this.toggleTags.bind(this),
                        attr: {
                            'filter-selected': this.filterModelTags && this.filterModelTags.isSelected
                        }
                    },
                    {
                        name: 'rating',
                        action: this.toggleRating.bind(this),
                        attr: {
                            'filter-selected': this.filterModelRating && this.filterModelRating.isSelected
                        }
                    },
                    {
                        name: 'star',
                        action: this.toggleStars.bind(this),
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
                                action: this.exportToXLS.bind(this),
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
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
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

    filterByName(filter: FilterModel) {
        return FilterHelpers.filterByClientName(filter);
    }

    filterByStates(filter: FilterModel) {
        return FilterHelpers.filterByStates(filter);
    }

    filterByStatus(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByType(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
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
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    processFilterInternal() {
        this.processODataFilter(
            this.dataGrid.instance,
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

    updatePartnerStatuses(status) {
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        this._clientService.updateContactGroupStatuses(
            selectedIds,
            ContactGroupType.Partner,
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

    ngOnInit() {
        this.getStatuses();
        this.getPartnerTypes();
        this.activate();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    requestVerification(contactId: number) {
        this._appService.requestVerification(contactId);
    }

    activate() {
        super.activate();
        this._filtersService.localizationSourceName = this.localizationSourceName;

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
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;

        this.subRouteParams.unsubscribe();
        this._appService.updateToolbar(null);
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        this.hideHostElement();        
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    getAssignedUsersStoreSelectors() {
        return PartnerAssignedUsersStoreSelectors.getAssignedUsers;
    }
}
