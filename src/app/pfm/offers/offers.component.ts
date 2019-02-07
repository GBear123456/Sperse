/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import * as _ from 'underscore';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
/** Application imports */
import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { OfferFilterCategory } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterHelpers } from '@app/cfo/shared/helpers/filter.helper';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { StaticListComponent } from '@app/crm/shared/static-list/static-list.component';
import { OfferCategoriesComponent } from '@app/pfm/shared/offer-categories/offer-categories.component';

@Component({
    templateUrl: './offers.component.html',
    styleUrls: ['./offers.component.less']
})
export class OffersComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    @ViewChild(OfferCategoriesComponent) stagesComponent: OfferCategoriesComponent;

    private readonly dataSourceURI = 'Offer';

    public headlineConfig;
    private filters: FilterModel[] = new Array<FilterModel>();
    private updateAfterActivation: boolean;
    filterModelStages: FilterModel;
    categories = [];

    constructor(
        private injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
        this._filtersService.localizationSourceName = AppConsts.localization.PFMLocalizationSourceName;

        this.searchColumns = ['Name'];
        this.searchValue = '';
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Offers')],
            onRefresh: this.refreshDataGrid.bind(this),
            icon: 'people',
            buttons: [
            ]
        };
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this._appService.updateToolbar([
                {
                    location: 'before',
                    items: [
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
                                placeholder: this.l('Search') + ' '
                                    + this.l('Offers').toLowerCase(),
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
                            name: 'category',
                            action: this.toggleStages.bind(this),
                            attr: {
                                'filter-selected': this.filterModelStages && this.filterModelStages.isSelected
                            }
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                        {
                            name: 'download',
                            widget: 'dxDropDownMenu',
                            options: {
                                hint: this.l('Download'),
                                items: [
                                    {
                                        action: Function(),
                                        text: this.ls(AppConsts.localization.defaultLocalizationSourceName, 'SaveAs', 'PDF'),
                                        icon: 'pdf',
                                    }, {
                                        action: this.exportToXLS.bind(this),
                                        text: this.l('Export to Excel'),
                                        icon: 'xls',
                                    }, {
                                        action: this.exportToGoogleSheet.bind(this),
                                        text: this.l('Export to Google Sheets'),
                                        icon: 'sheet'
                                    },
                                    { type: 'downloadOptions' }
                                ]
                            }
                        },
                        { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                    ]
                }
            ]);
        }
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
        this.initToolbarConfig();
    }

    ngOnInit(): void {
        this.activate();
        this.dataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            }
        });

        this.categories = Object.keys(OfferFilterCategory)
            .map(key => ({ id: OfferFilterCategory[key], name: this.l(key) }));

        this.filters = [
            this.filterModelStages = new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'Category',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource: this.categories,
                        nameField: 'name',
                        keyExpr: 'id'
                    })
                }
            })
        ];
        this._filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams, false);
        this.initFiltering();

        this.initHeadlineConfig();
    }

    filterByCategory(filter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = [];
            filter.items.element.value.forEach((category, i) => {
                filterData.push({ or: [{ Categories: { any: { CampaignCategory: category } } }] });
            });
            data = {
                or: filterData
            };
        }

        return data;
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }


    ngAfterViewInit(): void {
        this.showCompactRowsHeight();

        let rootComponent = this.getRootComponent();
        rootComponent.overflowHidden(true);
    }

    public refreshData(): void {
    }

    initFiltering() {
        this._filtersService.apply(() => {
            this.processFilterInternal();
            this.refreshData();
            this.initToolbarConfig();
        });
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

    expandColapseRow(e) {
        if (!e.data.sourceData) return;

        if (e.isExpanded) {
            e.component.collapseRow(e.key);
        } else {
            e.component.expandRow(e.key);
        }
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        super.activate();
        this.initToolbarConfig();
    }

    deactivate() {
        super.deactivate();
    }
}
