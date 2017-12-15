import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { ClassificationServiceProxy } from '@shared/service-proxies/service-proxies';

import { MdDialog } from '@angular/material';
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
export class RulesComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxTreeListComponent) theeList: DxTreeListComponent;

    private rootComponent: any;
    public ruleTreeList: any = [];
    public headlineConfig = {
        names: [this.l('Manage rules')],
        icon: 'globe',
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
        public dialog: MdDialog,
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
        this._ClassificationService.deleteRule(null, $event.key);
    }

    showEditDialog(data = {}) {
        this.dialog.open(RuleDialogComponent, {
            panelClass: 'slider', data: data
        }).afterClosed().subscribe(result => {});
    }

    ngOnInit(): void {
        this._ClassificationService.getRules(null)
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
    }
}
