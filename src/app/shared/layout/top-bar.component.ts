import { Component, Injector } from '@angular/core';
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppComponentBase } from '@shared/common/app-component-base';

import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './top-bar.component.html',
	styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar'
})
export class TopBarComponent extends AppComponentBase {

    constructor(injector: Injector,
        private _appSessionService: AppSessionService) {
        super(injector);
    }
    
    menu: PanelMenu = new PanelMenu("MainMenu", "MainMenu", [
        new PanelMenuItem("Dashboard", "Pages.Administration.Host.Dashboard", "icon-home", "/app/admin/hostDashboard"),
        new PanelMenuItem("Dashboard", "Pages.Tenant.Dashboard", "icon-home", "/app/main/dashboard"),
        new PanelMenuItem("Customers", "Pages.CRM.Customers", "icon-globe", "/app/admin/clients"),
        new PanelMenuItem("Leads", "Pages.CRM.Leads", "icon-globe", "/app/admin/leads"),
        new PanelMenuItem("Tenants", "Pages.Tenants", "icon-globe", "/app/admin/tenants"),
        new PanelMenuItem("Editions", "Pages.Editions", "icon-grid", "/app/admin/editions"),
        new PanelMenuItem("Administration", "", "icon-wrench", "", [
            new PanelMenuItem("OrganizationUnits", "Pages.Administration.OrganizationUnits", "icon-layers", "/app/admin/organization-units"),
            new PanelMenuItem("Roles", "Pages.Administration.Roles", "icon-briefcase", "/app/admin/roles"),
            new PanelMenuItem("Users", "Pages.Administration.Users", "icon-people", "/app/admin/users"),
            new PanelMenuItem("Languages", "Pages.Administration.Languages", "icon-flag", "/app/admin/languages"),
            new PanelMenuItem("AuditLogs", "Pages.Administration.AuditLogs", "icon-lock", "/app/admin/auditLogs"),
            new PanelMenuItem("Maintenance", "Pages.Administration.Host.Maintenance", "icon-wrench", "/app/admin/maintenance"),
            new PanelMenuItem("Subscription", "Pages.Administration.Tenant.SubscriptionManagement", "icon-refresh", "/app/admin/subscription-management"),
            new PanelMenuItem("Settings", "Pages.Administration.Host.Settings", "icon-settings", "/app/admin/hostSettings"),
            new PanelMenuItem("Settings", "Pages.Administration.Tenant.Settings", "icon-settings", "/app/admin/tenantSettings")
        ])
    ]);

	private checkMenuItemPermission(item): boolean {
        return (item.permissionName && this.isGranted(item.permissionName)) ||
			(item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permissionName);
	}

    private checkChildMenuItemPermission(menu): boolean {
		return menu.items.every((item) => {
			return this.checkMenuItemPermission(item);
		});
    }

    showMenuItem(item): boolean {
        if (item.permissionName === 'Pages.Administration.Tenant.SubscriptionManagement' && this._appSessionService.tenant && !this._appSessionService.tenant.edition) {
            return false;
        }
        return this.checkMenuItemPermission(item);
    }
}