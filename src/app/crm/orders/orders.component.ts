/** Core imports */
import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    Injector,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import * as _ from 'underscore';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { AppService } from '@app/app.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel, FilterModelBase } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterDropDownComponent } from '@shared/filters/dropdown/filter-dropdown.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { FilterHelpers } from '../shared/helpers/filter.helper';

@Component({
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.less'],
    animations: [appModuleAnimation()],
    providers: [OrderServiceProxy]
})
export class OrdersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    items: any;
    showPipeline = false;
    firstRefresh = false;
    gridDataSource: any = {};
    pipelinePurposeId = AppConsts.PipelinePurposeIds.order;

    private rootComponent: any;
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;
    private readonly dataSourceURI = 'Order';
    private filters: FilterModel[];

    masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    public headlineConfig = {
        names: [this.l('Orders')],
        onRefresh: this.refreshDataGrid.bind(this),
        icon: 'briefcase',
        buttons: [
            {
                enabled: true,
                action: Function(),
                lable: this.l('CreateNewOrder')
            }
        ]
    };

    constructor(injector: Injector,
                private _filtersService: FiltersService,
                private _orderService: OrderServiceProxy,
                private _appService: AppService,
                private store$: Store<CrmStore.State>
                ) {
        super(injector);

        this._filtersService.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: 4,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: true
            }
        };

        this.initToolbarConfig();
    }

    onContentReady(event) {
        this.setGridDataLoaded();
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
        if (!this.firstRefresh) {
            this.firstRefresh = true;
            abp.ui.setBusy(
                '',
                this.dataGrid.instance.refresh()
            );
        }
    }

    ngOnInit(): void {
        this._orderService.getFiltersInitialData().subscribe(result => {
            this._filtersService.setup(this.filters = [
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: {from: 'ge', to: 'le'},
                    caption: 'creation',
                    field: 'CreationTime',
                    items: {from: new FilterItemModel(), to: new FilterItemModel()},
                    options: {method: 'getFilterByDate'}
                }),
                new FilterModel({
                    component: FilterCheckBoxesComponent,
                    caption: 'orderStages',
                    items: {
                        element: new FilterCheckBoxesModel(
                            {
                                dataSource$: this.store$.pipe(select(PipelinesStoreSelectors.getPipelineTreeSource({purpose: AppConsts.PipelinePurposeIds.order}))),
                                nameField: 'name',
                                parentExpr: 'parentId',
                                keyExpr: 'id'
                            })
                    }
                }),
                new FilterModel({
                    component: FilterDropDownComponent,
                    caption: 'paymentType',
                    items: {
                        paymentType: new FilterDropDownModel({
                            displayName: 'Payment Type',
                            elements: null,
                            filterField: 'paymentTypeId',
                            onElementSelect: (event, filter: FilterModelBase<FilterDropDownModel>) => {
                                filter.items['paymentType'].value = event.value;
                            }
                        })
                    }
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'product',
                    items: {}
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'orderTotals',
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
                    caption: 'recurrence',
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
                    caption: 'zipCode',
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
                }),
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'cardBins',
                    items: {}
                })
            ]);
        });

        this._filtersService.apply(() => {
            this.initToolbarConfig();
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
        });
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
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
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Orders').toLowerCase()
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
                location: 'before',
                locateInMenu: 'auto',
                items: [
                    { name: 'assign' }, { name: 'status' }, { name: 'delete' }
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
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                areItemsDependent: true,
                items: [
                    // {
                    //     name: 'box',
                    //     action: this.toggleDataLayout.bind(this, DataLayoutType.Box),
                    //     options: {
                    //         checkPressed: () => {
                    //             return (this.dataLayoutType == DataLayoutType.Box);
                    //         },
                    //     }
                    // },
                    // {
                    //     name: 'pipeline',
                    //     action: this.toggleDataLayout.bind(this, DataLayoutType.Pipeline),
                    //     options: {
                    //         checkPressed: () => {
                    //             return (this.dataLayoutType == DataLayoutType.Pipeline);
                    //         },
                    //     }
                    // },
                    // {
                    //     name: 'grid',
                    //     action: this.toggleDataLayout.bind(this, DataLayoutType.Grid),
                    //     options: {
                    //         checkPressed: () => {
                    //             return (this.dataLayoutType == DataLayoutType.Grid);
                    //         },
                    //     }
                    // }
                ]
            }
        ]);
    }

    filterByOrderStages(filter: FilterModel) {
        let data = {};
        if (filter.items.element) {
            let filterData = FilterHelpers.ParsePipelineIds(filter.items.element.value);
            data = {
                or: filterData
            };
        }

        return data;
    }

    ngAfterViewInit(): void {
        //this.gridDataSource = this.dataGrid.instance.getDataSource();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
        this._filtersService.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this._filtersService.unsubscribe();
        this.rootComponent.overflowHidden();
    }
}
