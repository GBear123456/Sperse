import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { PermissionTreeEditModel } from '@app/admin/shared/permission-tree-edit.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, UpdateUserPermissionsInput } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { finalize } from 'rxjs/operators';

import DataSource from 'devextreme/data/data_source';
import { DxTreeViewComponent } from 'devextreme-angular';
import * as _ from 'lodash';

@Component({
    selector: 'permission-tree',
    templateUrl: './permission-tree.component.html',
    styleUrls: ['./permission-tree.component.less']
})
export class PermissionTreeComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxTreeViewComponent) permissionsTree: DxTreeViewComponent;

    public data: any;
    public permissionsDataSource: DataSource;
    public searchEnabled = false;
    public sortTreeDesc = false;

    private permissionsData: PermissionTreeEditModel;
    
    constructor(injector: Injector,
        private _userService: UserServiceProxy,
        private _contactsService: ContactsService
    ) {
        super(injector);

        _contactsService.userSubscribe((userId) => {            
            if (this.data.userId = userId)
                this.loadData();
        });
    }

    ngOnInit() {        
        if ((this.data = this._userService['data']).userId)
            this.loadData();
    }

    loadData() {
        this.startLoading();
        this._userService.getUserPermissionsForEdit(this.data.userId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe((res) => {
                this.setPermissionsData(res);   
            }
        );
    }

    update() {
        this._userService.updateUserPermissions(UpdateUserPermissionsInput.fromJS({
            id: this.data.userId,
            grantedPermissionNames: this.getGrantedPermissionNames()
        })).pipe(finalize(() => this.finishLoading(true))).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    setPermissionsData(val: PermissionTreeEditModel) {
        this.permissionsData = val;

        let pagesParentIndex;
        this.permissionsData.permissions.forEach((item, index) => {
            if (!item.parentName) pagesParentIndex = index;
            if (item.parentName == 'Pages') item.parentName = null;

            item['selected'] = _.includes(this.permissionsData.grantedPermissionNames, item.name);
            item['expanded'] = true;
        });

        this.permissionsData.permissions.splice(pagesParentIndex, 1);

        this.permissionsDataSource = new DataSource(this.permissionsData.permissions);
        this.permissionsDataSource.sort({ getter: 'displayName', desc: this.sortTreeDesc });
    }

    getGrantedPermissionNames(): string[] {
        let permissionNames = ['Pages'];
        this.permissionsData.permissions.forEach(item => {
            if (item['selected'])
                permissionNames.push(item.name);
        });

        return permissionNames;
    }

    processExpandTree(expandLevel: number) {
        this.foreachNodes(this.permissionsTree.instance.getNodes(), expandLevel);
    }

    private foreachNodes(nodes: any[], expandLevel: number, currentLevel: number = 1) {
        for (let i = 0; i < nodes.length; i++) {
            let item = nodes[i];

            if (expandLevel >= currentLevel)
                this.permissionsTree.instance.expandItem(item.key);
            else
                this.permissionsTree.instance.collapseItem(item.key);
            
            if (item.children && item.children.length) {
                this.foreachNodes(item.children, expandLevel, currentLevel + 1);
            }
        }
    }

    toolbarConfig = [
        {
            location: 'before', items: [
                {
                    name: 'find',
                    action: (event) => {
                        event.event.stopPropagation();
                        event.event.preventDefault();

                        this.searchEnabled = !this.searchEnabled;
                    }
                },
                {
                    name: 'sort',
                    action: (event) => {
                        event.event.stopPropagation();
                        event.event.preventDefault();

                        this.sortTreeDesc = !this.sortTreeDesc;
                        this.permissionsDataSource.sort({ getter: 'displayName', desc: this.sortTreeDesc });
                        this.permissionsDataSource.load();
                    }
                },
                {
                    name: 'expandTree',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: this.l('Expand'),
                        items: [{
                            action: this.processExpandTree.bind(this, 1),
                            text: this.l('Expand 1st level')
                        }, {
                            action: this.processExpandTree.bind(this, 2),
                            text: this.l('Expand 2nd level')
                        }, {
                            action: this.processExpandTree.bind(this, 10),
                            text: this.l('Expand all')
                        }, {
                            type: 'delimiter'
                        }, {
                            action: this.processExpandTree.bind(this, 0),
                            text: this.l('Collapse all'),
                        }]
                    }
                }
            ]
        }
    ];
}