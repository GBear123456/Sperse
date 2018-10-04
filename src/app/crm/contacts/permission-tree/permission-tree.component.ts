/** Core imports */
import { Component, Injector, ViewChild, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import { DxTreeViewComponent } from 'devextreme-angular';
import { includes, flatMap } from 'lodash';

/** Application imports */
import { PermissionTreeEditModel } from '@app/admin/shared/permission-tree-edit.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserServiceProxy, GrantPermissionInput, ProhibitPermissionInput } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'permission-tree',
    templateUrl: './permission-tree.component.html',
    styleUrls: ['./permission-tree.component.less']
})
export class PermissionTreeComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxTreeViewComponent) permissionsTree: DxTreeViewComponent;

    public data: any;
    public permissionsDataSource: DataSource;
    public searchEnabled = false;
    public sortTreeDesc = false;
    private permissionsData: PermissionTreeEditModel;
    isEditAllowed = false;
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

    constructor(injector: Injector,
        private _userService: UserServiceProxy,
        private _contactsService: ContactsService
    ) {
        super(injector);

        _contactsService.userSubscribe((userId) => {
            if (this.data.userId = userId)
                this.loadData();
        }, this.constructor.name);

        this.isEditAllowed = this.isGranted('Pages.Administration.Users.ChangePermissionsAndRoles');
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

    private getRecursiveItems(node, type: 'children' | 'parent') {
        let items = [ node ];
        if (node[type] !== null) {
            items = [
                ...items,
                ...flatMap(Array.isArray(node[type]) ? node[type].map(item => {
                    return flatMap(this.getRecursiveItems(item, type));
                }) : this.getRecursiveItems(node[type], type))
            ];
        }
        return items;
    }

    update(event) {

        /** Check if selection was performed by click of the user or by selectItem/unselectItem methods */
        if (event.event) {
            /** If item has ancestors - select/deselect them too */
            if (event.itemData.parentName) {
                const ancestors = this.getRecursiveItems(event.node, 'parent');
                ancestors.slice(1).forEach(item => {
                    if (item.children.some(child => child.selected)) {
                        event.component.selectItem(item.itemData);
                    }
                });
            }

            /** If item becomes unchecked and has children - uncheck all children */
            if (event.node.children && !event.itemData.selected) {
                const children = this.getRecursiveItems(event.node, 'children');
                children.slice(1).forEach(item => event.component.unselectItem(item.itemData));
            }
        }

        let sub, data = {
            id: this.data.userId,
            permissionName: event.itemData.name
        };
        if (event.itemData.selected)
            sub = this._userService.grantPermission(GrantPermissionInput.fromJS(data));
        else
            sub = this._userService.prohibitPermission(ProhibitPermissionInput.fromJS(data));

        sub.pipe(finalize(() => this.finishLoading(true))).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    setPermissionsData(val: PermissionTreeEditModel) {
        this.permissionsData = val;

        let pagesParentIndex;
        this.permissionsData.permissions.forEach((item, index) => {
            if (!item.parentName) pagesParentIndex = index;
            if (item.parentName == 'Pages') item.parentName = null;

            item['selected'] = includes(this.permissionsData.grantedPermissionNames, item.name);
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

    ngOnDestroy() {
        this._contactsService.unsubscribe(this.constructor.name);
    }
}
