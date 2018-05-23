import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    Inject,
    ViewEncapsulation,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';

import { AppService } from '@app/app.service';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel, FilterModelBase } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';

import { DataLayoutType } from '@app/shared/layout/data-layout-type';

import { CommonLookupServiceProxy, LeadServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { CreateClientDialogComponent } from '../shared/create-client-dialog/create-client-dialog.component';
import { PipelineComponent } from '@app/shared/pipeline/pipeline.component';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { TagsListComponent } from '../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../shared/rating/rating.component';
import { StarsListComponent } from '../shared/stars-list/stars-list.component';
import query from 'devextreme/data/query';

import DataSource from 'devextreme/data/data_source';

import * as _ from 'underscore';
import * as moment from 'moment';

@Component({
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.less'],
    providers: [LeadServiceProxy],
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

    firstRefresh = false;
    pipelineDataSource: any;
    collection: any;
    showPipeline = true;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;
    selectedLeads = [];
    stages = [];
    selectedClientKeys = [];

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Lead';
    private filters: FilterModel[];
    private subRouteParams: any;
    private filterChanged = false;
    private masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    public headlineConfig = {
        names: [this.l('Leads')],
        onRefresh: this.refreshDataGrid.bind(this, false, false),
        icon: 'basket',
        buttons: [
            {
                enabled: true,
                action: this.createLead.bind(this),
                lable: this.l('CreateNewLead')
            }
        ]
    };

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _router: Router,
        private _route: ActivatedRoute,
        private _pipelineService: PipelineService,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _leadService: LeadServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
   
        this.dataSource = {
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            }
        };      
        
        this.searchColumns = ['FullName', 'CompanyName', 'Email'];
        this.searchValue = '';
    }
    
    private paramsSubscribe() {
        if (!this.subRouteParams || this.subRouteParams.closed)    
            this.subRouteParams = this._route.queryParams.subscribe(params => {
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
                if (params['refresh'])
                    this.refreshDataGrid();
            });       
    }

    onContentReady(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    refreshDataGrid(quiet = false, addedNew = false) {
        setTimeout(() => {
            this.pipelineComponent.refresh(
                quiet || !this.showPipeline, addedNew);
            this.dataGrid.instance.refresh().then(() => {
                this.setGridDataLoaded();
            });
        });
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    toggleDataLayout(dataLayoutType) {
        this.showPipeline = (dataLayoutType == DataLayoutType.Pipeline);
        this.dataLayoutType = dataLayoutType;
        this.initDataSource();
        if (!this.showPipeline)
            setTimeout(() => this.dataGrid.instance.repaint());            
        if (this.filterChanged) {
            this.filterChanged = false;
            setTimeout(() => this.processFilterInternal());
        }
    }

    initFilterConfig(): void {
        if (this.filters) {
            this._filtersService.setup(this.filters);
            this._filtersService.checkIfAnySelected();
        } else
            this._leadService.getFiltersInitialData().subscribe(result => {
                this._filtersService.setup(this.filters = [
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'Name',
                        items: { FullName: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'Email',
                        items: { Email: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterCalendarComponent,
                        operator: { from: 'ge', to: 'le' },
                        caption: 'creation',
                        field: 'CreationTime',
                        items: { from: new FilterItemModel(), to: new FilterItemModel() },
                        options: {method: 'getFilterByDate'}
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'stages',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource: FilterHelpers.ConvertPipelinesToTreeSource(result.pipelines),
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'SourceCode',
                        items: { SourceCode: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'Industry',
                        items: { Industry: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'assignedUser',
                        field: 'AssignedUserId',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource: result.users,
                                    nameField: 'name',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'Campaign',
                        items: { Campaign: new FilterItemModel() }
                    }),
                ], this._activatedRoute.snapshot.queryParams);
            });

        this._filtersService.apply(() => {
            this.filterChanged = true;
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
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
                            mouseout: (event) => {
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
                location: 'before', items: [
                    {
                        name: 'assign',
                        disabled: !this.selectedClientKeys.length,
                        action: this.toggleUserAssignment.bind(this)
                    },
                    {
                        widget: 'dxDropDownMenu',
                        disabled: !this.selectedLeads.length,
                        name: 'stage',
                        options: {
                            hint: this.l('Stage'),
                            items: this.stages
                        }
                    },
                    {
                        name: 'lists',
                        disabled: !this.selectedClientKeys.length,
                        action: this.toggleLists.bind(this)
                    },
                    {
                        name: 'tags',
                        disabled: !this.selectedClientKeys.length,
                        action: this.toggleTags.bind(this)
                    },
                    {
                        name: 'rating',
                        disabled: !this.selectedClientKeys.length,
                        action: this.toggleRating.bind(this)
                    },
                    {
                        name: 'star',
                        disabled: !this.selectedClientKeys.length,
                        action: this.toggleStars.bind(this)
                    }
                ]
            },
            {
                location: 'before', items: [
                    {
                        name: 'delete',
                        disabled: !this.selectedLeads.length,
                        action: this.deleteLeads.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
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
                items: [
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                areItemsDependent: true,
                items: [
/*
                    {
                        name: 'box',
                        action: this.toggleDataLayout.bind(this, DataLayoutType.Box),
                        options: {
                            checkPressed: () => {
                                return (this.dataLayoutType == DataLayoutType.Box);
                            },
                        }
                    },
*/
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
                items: [
                    { name: 'fullscreen', action: Function() }
                ]
            }
        ];
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    filterByEmail(filter: FilterModel) {
        let filterField = filter.items.Email;
        let filterValue = filterField && filterField.value;
        if (filterValue)
            return {
                EmailAddresses: { any: 'contains(e,\'' + filterValue + '\')' }
            };
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

    filterByAssignedUser(filter: FilterModel) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    processFilterInternal() {
        if (this.showPipeline) {
            this.pipelineComponent.searchColumns = this.searchColumns;
            this.pipelineComponent.searchValue = this.searchValue;
        }

        let context = this.showPipeline ? this.pipelineComponent: this;
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
                this.pipelineDataSource = new DataSource(this.dataSource);
        }
    }

    createLead() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: (quite) => {
                    this.refreshDataGrid(quite, true);
                }, 
                isInLeadMode: true
            }
        });
    }

    onSelectionChanged($event) {
        this.selectedLeads = $event.component.getSelectedRowsData();
        this.selectedClientKeys = [];
        this.selectedLeads.forEach((item) => {
            if (item.CustomerId)
                this.selectedClientKeys.push(item.CustomerId);
        });
        this.initToolbarConfig();
    }

    onStagesLoaded($event) {        
        this.stages = $event.stages.map((stage) => {
            return {
                text: stage.name,
                action: this.updateLeadsStage.bind(this)
            };
        });
        this.initToolbarConfig();
    }

    updateLeadsStage($event) {
        let targetStage = $event.itemData.text,
            ignoredStages = [];
        this.selectedLeads.forEach((lead) => {
            if (!this._pipelineService.updateLeadStage(lead, lead.Stage, targetStage) 
                && ignoredStages.indexOf(lead.Stage) < 0)
                    ignoredStages.push(lead.Stage);
        });
        if (ignoredStages.length)
            this.message.warn(this.l('LeadStageChangeWarning', [ignoredStages.join(', ')]));
        if (this.selectedLeads.length)
            setTimeout(() => { //!!VP temporary solution for grid refresh 
                this.refreshDataGrid();
            }, 1000);
    }

    showLeadDetails(event) {
        let leadId = event.data && event.data.Id;
        let clientId = event.data && event.data.CustomerId;
        if (!leadId || !clientId)
            return;

        event.component.cancelEditData();
        this._router.navigate(['app/crm/client', clientId, 'lead', leadId, 'contact-information'],
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
        let selectedIds: number[] = this.dataGrid.instance.getSelectedRowKeys();
        this.message.confirm(
            this.l('LeadsDeleteWarningMessage'),
            isConfirmed => {
                if (isConfirmed)
                    this.deleteClientsInternal(selectedIds);
            }
        );
    }

    private deleteClientsInternal(selectedIds: number[]) {
        this._leadService.deleteLeads(selectedIds).subscribe(() => {
            this.notify.success(this.l('SuccessfullyDeleted'));
            this.refreshDataGrid();
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
        this._filtersService.localizationSourceName = 
            this.localizationSourceName;

        this.paramsSubscribe();
        this.initFilterConfig();
        this.initToolbarConfig();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);            

        this.showHostElement();
    }
    
    deactivate() {
        this._filtersService.localizationSourceName = 
            AppConsts.localization.defaultLocalizationSourceName;
        
        this._appService.toolbarConfig = null;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
        this.subRouteParams.unsubscribe();

        this.hideHostElement();
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }
}