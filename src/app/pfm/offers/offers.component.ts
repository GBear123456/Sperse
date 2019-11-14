/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import DataSource from 'devextreme/data/data_source';
import 'devextreme/data/odata/store';
import difference from 'lodash/difference';
import startCase from 'lodash/startCase';

/** Application imports */
import { AppService } from '@app/app.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import {
    RankRequest,
    OfferServiceProxy,
    CampaignCategory,
    OfferManagementServiceProxy,
    OfferFlagType,
    OfferFilter,
    OfferAttributeType,
    CampaignStatus
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { AppRatingComponent } from '@app/shared/common/rating/rating.component';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { FilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';
import { AppStore, RatingsStoreSelectors } from '@app/store';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';

@Component({
    templateUrl: './offers.component.html',
    styleUrls: ['./offers.component.less'],
    providers: [ OfferServiceProxy, OfferManagementServiceProxy ]
})
export class OffersComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxContextMenuComponent) pullContextComponent: DxContextMenuComponent;
    @ViewChild('categoriesComponent') categoriesComponent: StaticListComponent;
    @ViewChild('flagsComponent') flagsComponent: StaticListComponent;
    @ViewChild('attributesComponent') attributesComponent: StaticListComponent;
    @ViewChild('statusesComponent') statusesComponent: StaticListComponent;
    @ViewChild(AppRatingComponent) ratingComponent: AppRatingComponent;

    private readonly dataSourceURI = 'Offer';
    private rootComponent: any;

    headlineButtons: HeadlineButton[] = [
        {
            id: 'PullOffers',
            enabled: true,
            class: 'button-layout button-primary menu',
            action: (event) => {
                this.pullOffers(false, event);
            },
            label: this.l('Offers_PullChanges')
        }
    ];
    filterModelCategories: FilterModel;
    filterModelFlags: FilterModel;
    filterModelAttributes: FilterModel;
    filterModelStatuses: FilterModel;
    filterModelRank: FilterModel;
    pullContextMenuItems = [
        { text: this.l('Offers_PullAll'), icon: 'arrowdown', selected: false }
    ];
    selectedOfferKeys = [];
    categories = Object.keys(CampaignCategory).map(key => ({ id: CampaignCategory[key], name: this.l(key) }));
    flags = Object.keys(OfferFlagType).map(key => ({ id: OfferFlagType[key], name: startCase(key) }));
    attributes = Object.keys(OfferAttributeType).map(key => ({
        id: OfferAttributeType[key],
        name: startCase(key) })
    );
    statuses = Object.keys(CampaignStatus).map(key => ({ id: CampaignStatus[key], name: startCase(key) }));
    displayedRatingValue: number;
    private filters: FilterModel[] = [
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
            field: 'Flags',
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
            field: 'Attributes',
            items: {
                element: new FilterCheckBoxesModel({
                    dataSource: this.attributes,
                    nameField: 'name',
                    keyExpr: 'id'
                })
            }
        }),
        this.filterModelStatuses = new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Status',
            field: 'Status',
            isSelected: true,
            items: {
                element: new FilterCheckBoxesModel({
                    dataSource: this.statuses,
                    nameField: 'name',
                    keyExpr: 'id',
                    value: [CampaignStatus.Active]
                })
            }
        }),
        this.filterModelRank = new FilterModel({
            component: FilterRangeComponent,
            operator: {from: 'ge', to: 'le'},
            caption: 'Rank',
            field: 'Rank',
            items$: this.store$.pipe(select(RatingsStoreSelectors.getRatingItems))
        }),
        this.filterModelRank = new FilterModel({
            caption: 'TrafficSource',
            hidden: true
        })
    ];

    constructor(
        private injector: Injector,
        private appService: AppService,
        private filtersService: FiltersService,
        private offerProxy: OfferServiceProxy,
        private offersProxy: OfferManagementServiceProxy,
        private store$: Store<AppStore.State>,
        private itemDetailsService: ItemDetailsService
    ) {
        super(injector);

        this.searchColumns = ['Name'];
        this.searchValue = '';
    }

    ngOnInit(): void {
        this.rootComponent = this.getRootComponent();
        this.dataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI,
                    [this.filterByStatus(this.filterModelStatuses), this.filterByTrafficSource()]),
                deserializeDates: false,
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            select: ['Id', 'CampaignId', 'LogoUrl', 'Name', 'CardNetwork', 'Categories', 'Status', 'Rank', 'OverallRating', 'IsPublished', 'Created'],
            sort: [
                { selector: 'Created', desc: true }
            ]
        });
        this.activate();
    }

    toggleToolbar() {
        setTimeout(() => this.dataGrid.instance.repaint(), 0);
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.appService.updateToolbar([
                {
                    location: 'before',
                    items: [
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
                    location: 'before',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'status',
                            action: this.toggleStatuses.bind(this),
                            attr: {
                                'filter-selected': this.filterModelStatuses && this.filterModelStatuses.isSelected
                            }
                        },
                        {
                            name: 'rating',
                            widget: 'dxButton',
                            options: {
                                text: this.l('Rank')
                            },
                            action: this.toggleRating.bind(this)
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        { name: 'showCompactRowsHeight', action: DataGridService.toggleCompactRowsHeight.bind(this, this.dataGrid) },
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
                        { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                    ]
                }
            ]);
        }
    }

    toggleRating() {
        this.ratingComponent.toggle();
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

    toggleStatuses() {
        this.statusesComponent.toggle();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
        this.initToolbarConfig();
    }

    filterByCategory(filter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = [];
            filter.items.element.value.forEach(category => {
                filterData.push({ or: [{ Categories: { any: { CampaignCategory: category } } }] });
            });
            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByStatus(filter) {
        return FilterHelpers.filterBySetOfValues(filter);
    }

    filterByRank(filter: FilterModel) {
        return FilterHelpers.filterByRating(filter);
    }

    filterByTrafficSource() {
        return {'TrafficSource': {'ne': 'Decline'}};
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    initFiltering() {
        this.filtersService.apply(() => {
            this.processFilterInternal();
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
            },
            null,
            this.getCustomFiltersParams()
        );
    }

    private getCustomFiltersParams() {
        return [ ...this.getFilterParams('Flags'), ...this.getFilterParams('Attributes')];
    }

    private getFilterParams(filterField: string): { name: string, value: string }[] {
        let filterParams = [];
        const filterValue = this['filterModel' + filterField].items.element.value;
        filterValue && filterValue.forEach(filterValue => {
            filterParams.push({ name: filterField, value: filterValue });
        });
        return filterParams;
    }

    onSelectionChanged(event) {
        const selectedOffers = event.component.getSelectedRowKeys();
        this.selectedOfferKeys = selectedOffers.map(item => item.CampaignId);
        this.displayedRatingValue = this.getSelectedOffersValue(selectedOffers);
    }

    /**
     * If only one offer is selected - get its rating value, else - get the minimal rating
     * @return {undefined}
     */
    getSelectedOffersValue(selectedOffers): number {
        return selectedOffers.length === 1
            ? selectedOffers[0].Rank
            : this.ratingComponent.ratingMin;
    }

    openOfferEdit(e) {
        this.searchClear = false;
        this._router.navigate(['./', e.data.CampaignId], {
            relativeTo: this._activatedRoute
        });
    }

    invalidate() {
        this.dataGrid.instance.deselectAll();
        this.processFilterInternal();
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        super.activate();
        this.filtersService.setup(this.filters, this._activatedRoute.snapshot.queryParams, false);
        this.initFiltering();
        this.initToolbarConfig();
        this.rootComponent.overflowHidden(true);
        this.showHostElement();
    }

    deactivate() {
        super.deactivate();
        this.filtersService.unsubscribe();
        this.appService.updateToolbar(null);
        this.rootComponent.overflowHidden();
        this.itemDetailsService.setItemsSource(ItemTypeEnum.Offer, this.dataGrid.instance.getDataSource());
    }

    pullOffers(fetchAll, event?) {
        if (event && event.offsetX > 150)
           return this.pullContextComponent.instance.option('visible', true);

        this.notify.info(this.l('Offers_PullStarted'));
        this.offersProxy.pull(fetchAll).subscribe(
            () => this.notify.info(this.l('Offers_PullFinished')),
            e => this.message.error(e.message)
        );
    }

    getCategoryValue(data) {
        return data.Categories.map(item => item.Name).join(', ');
    }

    onFlagOptionChanged(data) {
        if (data.name == 'selectedItems' && this.selectedOfferKeys.length
            && data.value.length != data.previousValue.length
        ) {
            let exclude = data.previousValue.length > data.value.length,
                selected = difference(exclude ? data.previousValue : data.value, exclude ? data.value : data.previousValue);
            if (selected.length)
                this.offersProxy.setFlag(selected[0]['id'], !exclude,
                    OfferFilter.fromJS({ campaignIds: this.selectedOfferKeys })).subscribe(() => {
                        this.notify.info(this.l('AppliedSuccessfully'));
                    }
                );
        }
    }

    onAttributeValueApply(data) {
        this.offersProxy.setAttribute(
            data.id,
            data.bottomInputValue,
            OfferFilter.fromJS({campaignIds: this.selectedOfferKeys})
        ).subscribe(() => {
            this.notify.info(this.l('AppliedSuccessfully'));
        });
    }

    onRankChanged(rank) {
        this.offerProxy.rank(new RankRequest({
            ids: this.dataGrid.instance.getSelectedRowKeys().map(item => item.Id),
            rank: rank
        })).subscribe(() => {
            this.invalidate();
            this.notify.info(this.l('AppliedSuccessfully'));
        });
    }
}
