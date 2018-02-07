import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { AppService } from '@app/app.service';

import { ClassificationServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';

import { MatDialog } from '@angular/material';
import { RuleDialogComponent } from './rule-edit-dialog/rule-edit-dialog.component';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';

import DataSource from 'devextreme/data/data_source';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxTreeListComponent } from 'devextreme-angular';

import 'devextreme/data/odata/store';

import * as _ from 'underscore';
import * as moment from 'moment';

@Component({
    templateUrl: './rules.component.html',
    styleUrls: ['./rules.component.less'],
    animations: [appModuleAnimation()],
    providers: [ClassificationServiceProxy]
})
export class RulesComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxTreeListComponent) treeList: DxTreeListComponent;

    private rootComponent: any;
    public ruleTreeListDataSource: DataSource = new DataSource([]);
    private filters: FilterModel[];
    public headlineConfig = {
        names: [this.l('Manage rules')],
        iconSrc: 'assets/common/icons/manage-icon.svg',
        buttons: [
            {
                enabled: true,
                action: this.showEditDialog.bind(this),
                lable: this.l('+ Add New')
            }
        ]
    };

    constructor(injector: Injector,
        public dialog: MatDialog,
        public filtersService: FiltersService,
        private _appService: AppService,
        private _ClassificationService: ClassificationServiceProxy
    ) {
        super(injector);

        this.initToolbarConfig();
        this.filtersService.localizationSourceName = this.localizationSourceName;
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        adaptive: false,
                        action: (event) => {
                            setTimeout(() => {
                                this.treeList.instance.repaint();
                            }, 1000);
                            this.filtersService.fixed =
                                !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this.filtersService.enable();
                            },
                            mouseout: (event) => {
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
                location: 'after', items: [
                    { name: 'fullscreen', action: this.fullscreen.bind(this) },
                    { name: 'refresh', action: this.refreshList.bind(this) }
                ]
            }
        ];
    }

    refreshList() {
        this._ClassificationService.getRules(InstanceType[this.instanceType], this.instanceId, null)
            .subscribe(result => {
                this.ruleTreeListDataSource = new DataSource(
                    _.sortBy(result.map((item) => {
                        item['order'] =
                            this.normalize(Number(item.parentId)) +
                            this.normalize(item.sortOrder) +
                            this.normalize(item.id);
                        return item;
                    }), 'order'));
            });
    }

    fullscreen() {
        this.toggleFullscreen(document.body);
    }

    normalize(value: number): string {
        let s = "0".repeat(5) + value;
        return s.substr(s.length - 5);
    }

    onEditingStart(e) {
        this.showEditDialog(e.data);
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onRowRemoved($event) {
        this._ClassificationService.deleteRule(InstanceType[this.instanceType], this.instanceId, [], null, $event.key);
    }

    showEditDialog(data = {}) {
        this.dialog.open(RuleDialogComponent, {
            panelClass: 'slider', data: _.extend(data, {
                instanceId: this.instanceId,
                instanceType: this.instanceType,
                refershParent: this.ngOnInit.bind(this)
            })
        }).afterClosed().subscribe(result => { });
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.refreshList();
        this.filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Name',
                    field: 'name',
                    items: { name: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: '>=', to: '<=' },
                    caption: 'CreationDate',
                    field: 'creationTime',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                })
            ]
        );

        this.filtersService.apply(() => {
            this.initToolbarConfig();

            var dataSourceFilters = [];
            for (let filter of this.filters) {
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod) {
                    var customFilters: any[] = filterMethod(filter);
                    if (customFilters && customFilters.length)
                        customFilters.forEach((v) => dataSourceFilters.push(v));
                }
                else {
                    _.pairs(filter.items).forEach((pair) => {
                        let val = pair.pop().value, key = pair.pop(), operator = {};
                        if (val)
                            dataSourceFilters.push([key, filter.operator, val]);
                    });
                }
            }

            dataSourceFilters = dataSourceFilters.length ? dataSourceFilters : null;
            this.ruleTreeListDataSource.filter(dataSourceFilters);
            this.ruleTreeListDataSource.load();
        });
    }

    filterByCreationDate(filter: FilterModel): any[][] {
        let result: any[][] = [];

        _.each(filter.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's');
                }

                result.push([filter.field, filter.operator[key], date.toDate()]);
            }
        });

        return result;
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
        this.rootComponent.overflowHidden();
        this.filtersService.localizationSourceName
            = AppConsts.localization.defaultLocalizationSourceName;
        this.filtersService.unsubscribe();

        super.ngOnDestroy();
    }
}
