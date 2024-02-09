import { Component, Input } from '@angular/core';
import { PermissionTreeEditModel } from '@app/admin/shared/permission-tree-edit.model';
import DataSource from 'devextreme/data/data_source';
import includes from 'lodash/includes';

@Component({
    selector: 'permission-tree',
    template: `
        <dx-tree-view dataStructure="plain"
           [dataSource]="permissionsDataSource"
           parentIdExpr="parentName"
           keyExpr="name"
           displayExpr="displayName"
           showCheckBoxesMode="normal"
           [selectNodesRecursive]="false"
           [searchEnabled]="searchEnabled">
        </dx-tree-view>`
})
export class PermissionTreeComponent {

    @Input() set editData(val: PermissionTreeEditModel) {
        if (val) {
            this._editData = val;
            this.setPermissionsData();
        }
    }

    public permissionsDataSource: DataSource;
    private _editData: PermissionTreeEditModel;

    constructor() {}

    setPermissionsData() {
        let pagesParentIndex;
        this._editData.permissions.forEach((item, index) => {
            if (!item.parentName) pagesParentIndex = index;
            if (item.parentName == 'Pages') item.parentName = null;

            item['selected'] = includes(this._editData.grantedPermissionNames, item.name);
            item['expanded'] = true;
        });

        this._editData.permissions.splice(pagesParentIndex, 1);

        this.permissionsDataSource = new DataSource(this._editData.permissions);
        this.permissionsDataSource.sort({ selector: 'displayName', desc: false });
    }

    getGrantedPermissionNames(): string[] {
        let permissionNames = ['Pages'];
        this._editData.permissions.forEach(item => {
            if (item['selected'])
                permissionNames.push(item.name);
        });

        return permissionNames;
    }
}
