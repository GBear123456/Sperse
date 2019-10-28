/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';
import { RuleDialogComponent } from './rule-edit-dialog/rule-edit-dialog.component';
import { RuleDeleteDialogComponent } from './rule-delete-dialog/rule-delete-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { ClassificationServiceProxy, ApplyToTransactionsOption, InstanceType } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './rules.component.html',
    styleUrls: ['./rules.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ClassificationServiceProxy ]
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
        private appService: AppService,
        private classificationService: ClassificationServiceProxy,
        public dialog: MatDialog,
        public filtersService: FiltersService
    ) {
        super(injector);
        this.initToolbarConfig();
    }

    ngOnInit(): void {
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
                    options: { method: 'getFilterByDate', params: { useUserTimezone: true } }
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
                        let val = pair.pop().value, key = pair.pop();
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
        if (this._cfoService.classifyTransactionsAllowed()) {
            this.treeList.editing.allowAdding = true;
            this.treeList.editing.allowDeleting = true;
            this.treeList.editing.allowUpdating = true;
            this.treeList.instance.refresh();

            this.headlineConfig.buttons.push({
                enabled: true,
                action: this.showEditDialog.bind(this),
                label: this.l('+ Add New')
            });
        }

        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    initToolbarConfig() {
        this.appService.updateToolbar([
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        visible: !this._cfoService.hasStaticInstance,
                        action: () => {
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
                location: 'after', items: [
                    { name: 'refresh', action: this.refreshList.bind(this) },
                    { name: 'fullscreen', action: this.fullscreen.bind(this) }
                ]
            }
        ]);
    }

    refreshList() {
        this.startLoading();
        this.classificationService.getRules(InstanceType[this.instanceType], this.instanceId, null)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe(result => {
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
        this.fullScreenService.toggleFullscreen(document.documentElement);
        setTimeout(() => {
            if (this.treeList && this.treeList.instance)
                this.treeList.instance.repaint();
        }, 100);
    }

    onEditingStart(e) {
        this.showEditDialog(e.data);
        e.cancel = true;
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
                    this.classificationService.deleteRule(
                        InstanceType[this.instanceType],
                        this.instanceId,
                        [],
                        ApplyToTransactionsOption[dialogData.reclassify ? 'MatchedAndUnclassified' : 'None'],
                        itemId
                    ).pipe(
                        finalize(() => this.finishLoading(true))
                    ).subscribe(() => {
                        this.lastRemovedItemID = itemId;
                        $event.component.deleteRow($event.component.getRowIndexByKey(itemId));
                    });
                }
            });
    }

    showEditDialog(data = {}) {
        this.dialog.open(RuleDialogComponent, {
            panelClass: 'slider',
            data: _.extend(data, {
                refreshParent: this.refreshList.bind(this)
            })
        }).afterClosed().subscribe(() => {});
    }

    ngOnDestroy() {
        this.appService.updateToolbar(null);
        this.rootComponent.overflowHidden();
        this.filtersService.unsubscribe();
        super.ngOnDestroy();
    }
}
