import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';

import { ClassificationServiceProxy, InstanceType18, InstanceType23 } from '@shared/service-proxies/service-proxies';

import { MatDialog } from '@angular/material';
import { RuleDialogComponent } from './rule-edit-dialog/rule-edit-dialog.component';

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
    @ViewChild(DxTreeListComponent) theeList: DxTreeListComponent;

    private rootComponent: any;
    public ruleTreeList: any = [];
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
    private toolbarConfig: any = [
        {
            location: 'after', items: [
                { name: 'fullscreen', action: this.fullscreen.bind(this) },
                { name: 'refresh', action: this.refreshList.bind(this) }
            ]
        }
    ];


    constructor(injector: Injector,
        public dialog: MatDialog,
        private _ClassificationService: ClassificationServiceProxy
    ) {
        super(injector);
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
        this._ClassificationService.deleteRule(InstanceType23[this.instanceType], this.instanceId, [], null, $event.key);
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

        this._ClassificationService.getRules(InstanceType18[this.instanceType], this.instanceId, null)
            .subscribe(result => {
                  this.ruleTreeList = _.sortBy(result.map((item) => {
                      item['order'] =
                          this.normalize(Number(item.parentId)) +
                          this.normalize(item.sortOrder) +
                          this.normalize(item.id);
                      return item;
                  }), 'order');
            });

    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();

        super.ngOnDestroy();
    }
}
