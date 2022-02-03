import { Component, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OrganizationTreeComponent } from './organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-unit-members.component';
import { OrganizationUnitRolesComponent } from './organization-unit-roles.component';
import { IBasicOrganizationUnitInfo } from './basic-organization-unit-info';

@Component({
    templateUrl: './organization-units.component.html',
    styleUrls: [
        '../../../../node_modules/primeng/resources/primeng.min.css',
        '../../../../node_modules/primeng/resources/themes/fluent-light/theme.css',
        '../../../assets/primeng/autocomplete/css/primeng.autocomplete.css',
        '../../../assets/primeng/context-menu/css/primeng.context-menu.css',
        '../../../assets/primeng/tree/css/primeng.tree.css'
    ],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class OrganizationUnitsComponent extends AppComponentBase {
    @ViewChild('ouMembers', { static: true }) ouMembers: OrganizationUnitMembersComponent;
    @ViewChild('ouRoles', { static: true }) ouRoles: OrganizationUnitRolesComponent;
    @ViewChild('ouTree', { static: true }) ouTree: OrganizationTreeComponent;
    organizationUnit: IBasicOrganizationUnitInfo = null;

    constructor(injector: Injector) {
        super(injector);
    }

    ouSelected(event: any): void {
        this.organizationUnit = event;
        this.ouMembers.organizationUnit = event;
        this.ouRoles.organizationUnit = event;
    }
}
