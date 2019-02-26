/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import { difference, startCase } from 'lodash';

/** Application imports */
import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    OfferFilterCategory,
    OfferManagementServiceProxy,
    OfferFlag,
    OfferFilter,
    OfferAttribute
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';

@Component({
    templateUrl: './offers.component.html',
    styleUrls: ['./offers.component.less'],
    providers: [OfferManagementServiceProxy]
})
export class OffersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxContextMenuComponent) pullContextComponent: DxContextMenuComponent;
    @ViewChild('categoriesComponent') categoriesComponent: StaticListComponent;
    @ViewChild('flagsComponent') flagsComponent: StaticListComponent;
    @ViewChild('attributesComponent') attributesComponent: StaticListComponent;

    private readonly dataSourceURI = 'Offer';
    private rootComponent: any;
    public headlineConfig;
    private filters: FilterModel[] = new Array<FilterModel>();
    private updateAfterActivation: boolean;
    filterModelCategories: FilterModel;
    filterModelFlags: FilterModel;
    filterModelAttributes: FilterModel;
    pullContextMenuItems = [];
    selectedOfferKeys = [];
    categories = [];
    flags = [];
    attributes = [];

    constructor(
        private injector: Injector,
        private _appService: AppService,
        private _filtersService: FiltersService,
        private _offersProxy: OfferManagementServiceProxy
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
                {
                    id: 'PullOffers',
                    enabled: true,
                    class: 'button-layout button-primary menu',
                    action: (event) => {
                        this.pullOffers(false, event);
                    },
                    lable: this.l('Offers_PullChanges')
                }
            ]
        };
        this.pullContextMenuItems = [
            { text: this.l('Offers_PullAll'), icon: 'arrowdown', selected: false }
        ];
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
                            action: this.toggleCategories.bind(this),
                            attr: {
                                'filter-selected': this.filterModelCategories && this.filterModelCategories.isSelected
                            }
                        }
                    ]
                },
                {
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'flag',
                            action: this.toggleFlags.bind(this),
                            attr: {
                                'filter-selected': this.filterModelFlags && this.filterModelFlags.isSelected
                            }
                        },
                        {
                            name: 'pen',
                            action: this.toggleAttributes.bind(this),
                            attr: {
                                'filter-selected': this.filterModelAttributes && this.filterModelAttributes.isSelected
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

    toggleCategories() {
        this.categoriesComponent.toggle();
    }

    toggleFlags() {
        this.flagsComponent.toggle();
    }

    toggleAttributes() {
        this.attributesComponent.toggle();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
        this.initToolbarConfig();
    }

    ngOnInit(): void {
        this.rootComponent = this.getRootComponent();
        this.dataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            sort: [
                { selector: 'Created', desc: true }
            ]
        });

        this.categories = Object.keys(OfferFilterCategory)
            .map(key => ({ id: OfferFilterCategory[key], name: this.l(key) }));

        this.flags = Object.keys(OfferFlag)
            .map(key => ({ id: OfferFlag[key], name: startCase(key) }));

        this.attributes = Object.keys(OfferAttribute)
            .map(key => ({ id: OfferAttribute[key], name: startCase(key) }));

        this.filters = [
            this.filterModelCategories = new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'Category',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource: this.categories,
                        nameField: 'name',
                        keyExpr: 'id'
                    })
                }
            }),
            this.filterModelFlags = new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'Flag',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource: this.flags,
                        nameField: 'name',
                        keyExpr: 'id'
                    })
                }
            }),
            this.filterModelAttributes = new FilterModel({
                component: FilterCheckBoxesComponent,
                caption: 'Attribute',
                items: {
                    element: new FilterCheckBoxesModel({
                        dataSource: this.attributes,
                        nameField: 'name',
                        keyExpr: 'id'
                    })
                }
            })
        ];
        this.activate();
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

    onSelectionChanged($event) {
        this.selectedOfferKeys = $event.component.getSelectedRowKeys().map(item => item.CampaignId);
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    openOfferEdit(e) {
        this.searchClear = false;
        this._router.navigate(['./', e.data.CampaignId], { relativeTo: this._activatedRoute });
    }

    invalidate() {
        this.processFilterInternal();
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        super.activate();
        this._filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams, false);
        this.initFiltering();
        this.initToolbarConfig();
        this.rootComponent.overflowHidden(true);
    }

    deactivate() {
        super.deactivate();
        this._filtersService.unsubscribe();
        this._appService.updateToolbar(null);
        this.rootComponent.overflowHidden(true);
    }

    pullOffers(fetchAll, event?) {
        if (event && event.offsetX > 150)
           return this.pullContextComponent.instance.option('visible', true);

        this.notify.info(this.l('Offers_PullStarted'));
        this._offersProxy.pull(fetchAll).subscribe(() => {
            this.notify.info(this.l('Offers_PullFinished'));
        }, (e) => {
            this.message.error(e.message);
        });
    }

    categoryGroupValue(data) {
        return data.Categories.map(item => item.Name).join(', ');
    }

    onFlagOptionChanged(data) {
        if (data.name == 'selectedItems' && this.selectedOfferKeys.length
            && data.value.length != data.previousValue.length
        ) {
            let exclude = data.previousValue.length > data.value.length,
                selected = difference(exclude ? data.previousValue : data.value, exclude ? data.value : data.previousValue);
            if (selected.length)
                this._offersProxy.setFlag(OfferFilter.fromJS({campaignIds: this.selectedOfferKeys}),
                    selected[0]['id'], !exclude).subscribe(() => {
                        this.notify.info(this.l('AppliedSuccessfully'));
                    }
                );
        }
    }

    onAttributeValueApply(data) {
        this._offersProxy.setAttribute(
            OfferFilter.fromJS({campaignIds: this.selectedOfferKeys}),
            data.id,
            data.bottomInputValue
        ).subscribe(() => {
            this.notify.info(this.l('AppliedSuccessfully'));
        });
    }
}
