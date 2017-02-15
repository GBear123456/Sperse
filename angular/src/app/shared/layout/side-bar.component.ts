import { Component, Injector } from '@angular/core';
import { SideBarMenu } from './side-bar-menu';
import { SideBarMenuItem } from './side-bar-menu-item';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './side-bar.component.html',
    selector: 'side-bar'
})
export class SideBarComponent extends AppComponentBase {

    constructor(injector: Injector, public permission: PermissionCheckerService) {
        super(injector);
    }
    
    menu: SideBarMenu = new SideBarMenu("MainMenu", "MainMenu", [
        new SideBarMenuItem("Dashboard", "Pages.Tenant.Dashboard", "icon-home", "/dashboard"),
        new SideBarMenuItem("Tenants", "Pages.Tenants", "icon-globe", "/admin/tenants"),
        new SideBarMenuItem("Editions", "Pages.Editions", "icon-grid", "/admin/editions"),
        new SideBarMenuItem("Administration", "", "icon-wrench", "", [
            new SideBarMenuItem("OrganizationUnits", "Pages.Administration.OrganizationUnits", "icon-layers", "/admin/organization-units"),
            new SideBarMenuItem("Roles", "Pages.Administration.Roles", "icon-briefcase", "/admin/roles"),
            new SideBarMenuItem("Users", "Pages.Administration.Users", "icon-people", "/admin/users"),
            new SideBarMenuItem("Languages", "Pages.Administration.Languages", "icon-flag", "/admin/languages"),
            new SideBarMenuItem("AuditLogs", "Pages.Administration.AuditLogs", "icon-lock", "/admin/auditLogs"),
            new SideBarMenuItem("Maintenance", "Pages.Administration.Host.Maintenance", "icon-wrench", "/admin/maintenance"),
            new SideBarMenuItem("Settings", "Pages.Administration.Host.Settings", "icon-settings", "/admin/hostSettings"),
            new SideBarMenuItem("Settings", "Pages.Administration.Tenant.Settings", "icon-settings", "/admin/tenantSettings")
        ])
    ]);

    checkChildMenuItemPermission(menuItem): boolean {

        for (var i = 0; i < menuItem.items.length; i++) {
            var subMenuItem = menuItem.items[i];

            if (subMenuItem.permissionName && this.permission.isGranted(subMenuItem.permissionName)) {
                return true;
            }
            
            if (subMenuItem.items && subMenuItem.items.length) {
                return this.checkChildMenuItemPermission(subMenuItem);
            } else if (!subMenuItem.permissionName) {
                return true;
            }
        }

        return false;
    }

    showMenuItem(menuItem): boolean {
        if (menuItem.permissionName) {
            return this.permission.isGranted(menuItem.permissionName);
        }

        if (menuItem.items && menuItem.items.length) {
            return this.checkChildMenuItemPermission(menuItem);
        }

        return true;
    }

}