import { Component, Injector } from '@angular/core';
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './top-bar.component.html',
	styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar'
})
export class TopBarComponent extends AppComponentBase {

    constructor(injector: Injector, public permission: PermissionCheckerService) {
        super(injector);
    }
    
    menu: PanelMenu = new PanelMenu("MainMenu", "MainMenu", [
        new PanelMenuItem("Dashboard", "Pages.Tenant.Dashboard", "icon-home", "/app/main/dashboard"),
        new PanelMenuItem("Tenants", "Pages.Tenants", "icon-globe", "/app/admin/tenants"),
        new PanelMenuItem("Editions", "Pages.Editions", "icon-grid", "/app/admin/editions"),
        new PanelMenuItem("Administration", "", "icon-wrench", "", [
            new PanelMenuItem("OrganizationUnits", "Pages.Administration.OrganizationUnits", "icon-layers", "/app/admin/organization-units"),
            new PanelMenuItem("Roles", "Pages.Administration.Roles", "icon-briefcase", "/app/admin/roles"),
            new PanelMenuItem("Users", "Pages.Administration.Users", "icon-people", "/app/admin/users"),
            new PanelMenuItem("Languages", "Pages.Administration.Languages", "icon-flag", "/app/admin/languages"),
            new PanelMenuItem("AuditLogs", "Pages.Administration.AuditLogs", "icon-lock", "/app/admin/auditLogs"),
            new PanelMenuItem("Maintenance", "Pages.Administration.Host.Maintenance", "icon-wrench", "/app/admin/maintenance"),
            new PanelMenuItem("Settings", "Pages.Administration.Host.Settings", "icon-settings", "/app/admin/hostSettings"),
            new PanelMenuItem("Settings", "Pages.Administration.Tenant.Settings", "icon-settings", "/app/admin/tenantSettings")
        ])
    ]);

	private checkMenuItemPermission(item): boolean {
        return (item.permissionName && this.permission.isGranted(item.permissionName)) ||
			(item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permissionName);
	}

    private checkChildMenuItemPermission(menu): boolean {
		return menu.items.every((item) => {
			return this.checkMenuItemPermission(item);
		});
    }

    showMenuItem(item): boolean {
        return this.checkMenuItemPermission(item);
    }
}