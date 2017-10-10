import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
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
      private _appSessionService: AppSessionService,
      public router: Router
  ) {
    super(injector);

/*
    this.initMenu(
      require('@app/' +
        (sessionStorage.getItem('module') || 'crm') +
        '/module.config.json'
      )
    );
*/
  }

  menu: PanelMenu = new PanelMenu("MainMenu", "MainMenu", [
    new PanelMenuItem("Dashboard", "Pages.Administration.Host.Dashboard", "icon-home", "/app/crm/hostDashboard"),
    new PanelMenuItem("Dashboard", "Pages.Tenant.Dashboard", "icon-home", "/app/main/dashboard"),
    new PanelMenuItem("Cashflow", "Pages.Tenant.Dashboard", "icon-home", "/app/cfo/cashflow"),
    new PanelMenuItem("Customers", "Pages.CRM.Customers", "icon-globe", "/app/crm/clients"),
    new PanelMenuItem("Leads", "Pages.CRM.Leads", "icon-globe", "/app/crm/leads"),
    new PanelMenuItem("Orders", "Pages.CRM.Orders", "icon-globe", "/app/crm/orders"),
    new PanelMenuItem("Tenants", "Pages.Tenants", "icon-globe", "/app/crm/tenants"),
    new PanelMenuItem("Editions", "Pages.Editions", "icon-grid", "/app/crm/editions"),
    new PanelMenuItem("Administration", "", "icon-wrench", "", [
        new PanelMenuItem("OrganizationUnits", "Pages.Administration.OrganizationUnits", "icon-layers", "/app/crm/organization-units"),
        new PanelMenuItem("Roles", "Pages.Administration.Roles", "icon-briefcase", "/app/crm/roles"),
        new PanelMenuItem("Users", "Pages.Administration.Users", "icon-people", "/app/crm/users"),
        new PanelMenuItem("Languages", "Pages.Administration.Languages", "icon-flag", "/app/crm/languages"),
        new PanelMenuItem("AuditLogs", "Pages.Administration.AuditLogs", "icon-lock", "/app/crm/auditLogs"),
        new PanelMenuItem("Maintenance", "Pages.Administration.Host.Maintenance", "icon-wrench", "/app/crm/maintenance"),
        new PanelMenuItem("Subscription", "Pages.Administration.Tenant.SubscriptionManagement", "icon-refresh", "/app/crm/subscription-management"),
        new PanelMenuItem("Settings", "Pages.Administration.Host.Settings", "icon-settings", "/app/crm/hostSettings"),
        new PanelMenuItem("Settings", "Pages.Administration.Tenant.Settings", "icon-settings", "/app/crm/tenantSettings"),
        new PanelMenuItem("System", "Pages.Administration.Tenant.Settings", "icon-settings", "/app/crm/systemSettings")
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


  showMenuItem(item, index): boolean {
    if (item.permissionName === 'Pages.Administration.Tenant.SubscriptionManagement' && this._appSessionService.tenant && !this._appSessionService.tenant.edition) {
        return false;
    }
    return this.checkMenuItemPermission(item);
  }
}
