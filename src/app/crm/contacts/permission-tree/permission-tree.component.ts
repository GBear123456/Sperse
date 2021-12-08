/** Core imports */
import { Component, ViewChild, OnInit, OnDestroy, ElementRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import includes from 'lodash/includes';
import flatMap from 'lodash/flatMap';

/** Application imports */
import { ContactGroupPermission, ContactGroup } from '@shared/AppEnums';
import { PermissionTreeEditModel } from '@app/admin/shared/permission-tree-edit.model';
import { UserServiceProxy, GrantPermissionInput, ProhibitPermissionInput } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppStoreService } from '@app/store/app-store.service';

@Component({
    selector: 'permission-tree',
    templateUrl: './permission-tree.component.html',
    styleUrls: ['./permission-tree.component.less']
})
export class PermissionTreeComponent implements OnInit, OnDestroy {
    @ViewChild(DxTreeViewComponent) permissionsTree: DxTreeViewComponent;

    public data: any;
    public permissionsDataSource: DataSource;
    public searchEnabled = false;
    public sortTreeDesc = false;
    private permissionsData: PermissionTreeEditModel;
    isEditAllowed = this.permissionService.isGranted(AppPermissions.AdministrationUsersChangePermissionsAndRoles);
    private readonly ident = 'PermissionTree';
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
                        hint: this.ls.l('Expand'),
                        items: [{
                            action: this.processExpandTree.bind(this, 1),
                            text: this.ls.l('Expand 1st level')
                        }, {
                            action: this.processExpandTree.bind(this, 2),
                            text: this.ls.l('Expand 2nd level')
                        }, {
                            action: this.processExpandTree.bind(this, 10),
                            text: this.ls.l('Expand all')
                        }, {
                            type: 'delimiter'
                        }, {
                            action: this.processExpandTree.bind(this, 0),
                            text: this.ls.l('Collapse all'),
                        }]
                    }
                }
            ]
        }
    ];

    constructor(
        private appStoreService: AppStoreService,
        private userService: UserServiceProxy,
        private contactsService: ContactsService,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private permissionService: PermissionCheckerService,
        private notify: NotifyService,
        private ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.contactsService.userSubscribe(
            (userId) => {
                if (!this.data) {
                    this.data = {};
                }
                if (this.data.userId = userId)
                    this.loadData();
            },
            this.ident
        );
        if ((this.data = this.userService['data']).userId)
            this.loadData();
    }

    loadData() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.userService.getUserPermissionsForEdit(this.data.userId)
            .pipe(finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement)))
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
            let itemsThatWereSelected = [], itemsThatWhereDeselected = [];
            /** If item has ancestors - select/deselect them too */
            if (event.itemData.parentName) {
                const ancestors = this.getRecursiveItems(event.node, 'parent');
                ancestors.slice(1).forEach(item => {
                    if (item.children.some(child => child.selected)) {
                        /** If item is not selected - select it */
                        if (!item.itemData.selected) {
                            event.component.selectItem(item.itemData);
                            itemsThatWereSelected.push(item);
                        }
                    }
                });
            }

            /** If item becomes unchecked and has children - uncheck all children */
            if (event.node.children && !event.itemData.selected) {
                const children = this.getRecursiveItems(event.node, 'children');
                children.slice(1).forEach(item => {
                    /** If item is selected - unselect it */
                    if (item.itemData.selected) {
                        event.component.unselectItem(item.itemData);
                        itemsThatWhereDeselected.push(item);
                    }
                });
            }

            let sub, data = {
                id: this.data.userId,
                permissionName: event.itemData.name
            };
            if (event.itemData.selected) {
                sub = this.userService.grantPermission(GrantPermissionInput.fromJS(data));
                itemsThatWereSelected.push(event.node);
            } else {
                sub = this.userService.prohibitPermission(ProhibitPermissionInput.fromJS(data));
                itemsThatWhereDeselected.push(event.node);
            }
            sub.pipe(finalize(() => this.loadingService.finishLoading())).subscribe(
                () => {
                    this.appStoreService.dispatchUserAssignmentsActions(Object.keys(ContactGroup).filter(item => {
                        return event.itemData.name == ContactGroupPermission[item] + '.IsAssignable';
                    }), true);
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                }, () => {
                    /** Revert changes if error happens */
                    itemsThatWereSelected.forEach(item => event.component.unselectItem(item.itemData));
                    itemsThatWhereDeselected.forEach(item => event.component.selectItem(item.itemData));
                }
            );
        }
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
        this.contactsService.unsubscribe(this.ident);
    }
}
