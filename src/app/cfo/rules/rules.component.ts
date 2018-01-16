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
    public ruleTreeList: any = [];
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
        this.ngOnInit();
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


    onCellClick($event) {
        if ($event.rowType == 'header')
            $event.component.option('filterRow', {visible:
                !$event.component.option('filterRow').visible
            });
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
        }).afterClosed().subscribe(result => {});
    }

    ngOnInit(): void {
        super.ngOnInit();

        this._ClassificationService.getRules(InstanceType[this.instanceType], this.instanceId, null)
            .subscribe(result => {
                  this.ruleTreeList = _.sortBy(result.map((item) => {
                      item['order'] =
                          this.normalize(Number(item.parentId)) +
                          this.normalize(item.sortOrder) +
                          this.normalize(item.id);
                      return item;
                  }), 'order');
            });

        this.filtersService.setup(
            this.filters = [
                new FilterModel({
                    component: FilterInputsComponent,
                    operator: 'contains',
                    caption: 'Name',
                    items: { Name: new FilterItemModel() }
                }),
                new FilterModel({
                    component: FilterCalendarComponent,
                    operator: { from: 'ge', to: 'le' },
                    caption: 'Date',
                    field: 'Date',
                    items: { from: new FilterItemModel(), to: new FilterItemModel() }
                })
            ]
        );

    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
        this.filtersService.localizationSourceName
            = AppConsts.localization.defaultLocalizationSourceName;
        this.filtersService.unsubscribe();

        super.ngOnDestroy();
    }
}
