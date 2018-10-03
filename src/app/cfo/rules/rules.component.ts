import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';

import { ClassificationServiceProxy, ApplyOption, InstanceType } from '@shared/service-proxies/service-proxies';

import { MatDialog } from '@angular/material';
import { RuleDialogComponent } from './rule-edit-dialog/rule-edit-dialog.component';
import { RuleDeleteDialogComponent } from './rule-delete-dialog/rule-delete-dialog.component';

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

    private lastRemovedItemID: number;
    private rootComponent: any;
    public ruleTreeListDataSource: DataSource = new DataSource([]);
    private filters: FilterModel[];
    public headlineConfig = {
        names: [this.l('Manage rules')],
        iconSrc: './assets/common/icons/manage-icon.svg',
        buttons: []
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
        this._appService.updateToolbar([
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
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
                    { name: 'refresh', action: this.refreshList.bind(this) },
                    { name: 'fullscreen', action: this.fullscreen.bind(this) }
                ]
            }
        ]);
    }

    refreshList() {
        this.startLoading();
        this._ClassificationService.getRules(InstanceType[this.instanceType], this.instanceId, null)
            .subscribe(result => {
                this.finishLoading();
                this.ruleTreeListDataSource = new DataSource({
                    store: {
                        key: 'id',
                        data: result,
                        type: 'array'
                    }
                });
            });
    }

    fullscreen() {
        this.toggleFullscreen(document.documentElement);
        setTimeout(() => {
            if (this.treeList && this.treeList.instance)
                this.treeList.instance.repaint();
        }, 100);
    }

    onEditingStart(e) {
        this.showEditDialog(e.data);
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    onRuleRemoving($event) {
        let itemId = $event.key,
            dialogData = {
                ruleId: itemId,
                reclassify: false
            };
        if ($event.cancel = this.lastRemovedItemID != itemId)
            this.dialog.open(RuleDeleteDialogComponent, {
                data: dialogData
            }).afterClosed().subscribe((result) => {
                if (result) {
                    this.startLoading(true);
                    this._ClassificationService.deleteRule(InstanceType[this.instanceType], this.instanceId,
                        [], ApplyOption[dialogData.reclassify ? 'MatchedAndUnclassified' : 'None'], itemId)
                        .subscribe((id) => {
                            this.lastRemovedItemID = itemId;
                            $event.component.deleteRow($event.component.getRowIndexByKey(itemId));
                            this.finishLoading(true);
                        });
                }
            });
    }

    showEditDialog(data = {}) {
        this.dialog.open(RuleDialogComponent, {
            panelClass: 'slider', data: _.extend(data, {
                instanceId: this.instanceId,
                instanceType: this.instanceType,
                refershParent: this.refreshList.bind(this)
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
                    items: { from: new FilterItemModel(), to: new FilterItemModel() },
                    options: { method: 'getFilterByDate' }
                })
            ]
        );

        this.filtersService.apply(() => {
            this.initToolbarConfig();

            let dataSourceFilters = [];
            for (let filter of this.filters) {
                let filterMethod = this['filterBy' + this.capitalize(filter.caption)];
                if (filterMethod) {
                    let customFilters: any[] = filterMethod(filter);
                    if (customFilters && customFilters.length)
                        customFilters.forEach((v) => dataSourceFilters.push(v));
                } else {
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

    ngAfterViewInit(): void {
        if (this.isInstanceAdmin) {
            this.treeList.editing.allowAdding = true;
            this.treeList.editing.allowDeleting = true;
            this.treeList.editing.allowUpdating = true;
            this.treeList.instance.refresh();

            this.headlineConfig.buttons.push({
                enabled: true,
                action: this.showEditDialog.bind(this),
                lable: this.l('+ Add New')
            })
        };

        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
        this.rootComponent.overflowHidden();
        this.filtersService.localizationSourceName
            = AppConsts.localization.defaultLocalizationSourceName;
        this.filtersService.unsubscribe();

        super.ngOnDestroy();
    }
}
