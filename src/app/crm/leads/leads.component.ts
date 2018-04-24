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
import { ActivatedRoute } from '@angular/router';
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

import { DxDataGridComponent } from 'devextreme-angular';
import query from 'devextreme/data/query';

import 'devextreme/data/odata/store';

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

    firstRefresh = false;
    gridDataSource: any = {};
    collection: any;
    showPipeline = false;
    pipelinePurposeId = AppConsts.PipelinePurposeIds.lead;

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Lead';
    private filters: FilterModel[];

    private masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    public headlineConfig = {
        names: [this.l('Leads')],
        onRefresh: this.refreshDataGrid.bind(this),
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
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _leadService: LeadServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._filtersService.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                },
                paginate: true
            }
        };

        this.initToolbarConfig();

        this.searchColumns = ['FullName', 'CompanyName', 'Email'];
        this.searchValue = '';
    }

    onContentReady(event) {
        event.component.columnOption('command:edit', {
            visibleIndex: -1,
            width: 40
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    toggleDataLayout(dataLayoutType) {        
        this.showPipeline = (dataLayoutType == DataLayoutType.Pipeline);
        this.dataLayoutType = dataLayoutType;
        if (!this.showPipeline) {
            this.gridDataSource.pageSize(20);
            this.gridDataSource.filter(null);
            this.gridDataSource.load().then(() => {
                this.setGridDataLoaded();
            });
        }
    }

    ngOnInit(): void {
        this._leadService.getFiltersInitialData().subscribe(result => {
            this._filtersService.setup(this.filters = [
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
                    component: FilterCheckBoxesComponent,
                    caption: 'LeadType',
                    field: 'LeadTypeId',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource: result.leadTypes,
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
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'creation',
                    field: 'CreationTime',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: {method: 'getFilterByDate'}
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'updating',
                    field: 'UpdatingTime',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: {method: 'getFilterByDate'}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'product',
                    items: { product: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterDropDownComponent,
                    caption: 'paymentType',
                    items: {
                        paymentType: new FilterDropDownModel({
                            displayName: 'Payment Type',
                            elements: null,
                            filterField: 'paymentTypeId',
                            onElementSelect: (value, filter: FilterModelBase<FilterDropDownModel>) => {
                                filter.items['paymentType'].value = value;
                            }
                        })
                    }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'priceRange',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'currencies',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'regions',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringAffiliates',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'referringWebsites',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmSources',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'utmMediums',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'UtmCampaings',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'entryPages',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'salesAgents',
                    items: {}
                })
            ], this._activatedRoute.snapshot.queryParams);
        });

        this._filtersService.apply(() => {
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
                    { name: 'back' }
                ]
            },
            {
                location: 'before', items: [
                    { name: 'assign' }, 
                    { name: 'status' }, 
                    { name: 'lists' },
                    {
                        name: 'tags',
                        disabled: true
                    },
                    { name: 'rating' },
                    { name: 'star' }
                ]
            },
            {
                location: 'before', items: [
                    {
                        name: 'delete',
                        action: Function()
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

    filterByLeadType(filter: FilterModel) {
        let data = {};
        let element = filter.items.element;
        if (element && element.value) {
            let filterData = _.map(element.value, x => {
                let el = {};
                el[filter.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }

        return data;
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    processFilterInternal() {
        this.processODataFilter(this.dataGrid.instance,
            this.dataSourceURI, this.filters, (filter) => {
                let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    onGridInitialized($event) {
        this.gridDataSource = $event.component.getDataSource();
        this.showPipeline = (this.dataLayoutType == DataLayoutType.Pipeline);
    }

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
    }

    createLead() {
        this.dialog.open(CreateClientDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                refreshParent: this.refreshDataGrid.bind(this),
                isInLeadMode: true
            }
        }).afterClosed().subscribe(() => this.refreshDataGrid())
    }
}
