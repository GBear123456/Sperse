import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { HostDashboardComponent } from './dashboard/host-dashboard.component';
import { EditionsComponent } from './editions/editions.component';
import { LanguageTextsComponent } from './languages/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { OrganizationUnitsComponent } from './organization-units/organization-units.component';
import { RolesComponent } from './roles/roles.component';
import { HostSettingsComponent } from './settings/host-settings.component';
import { TenantSettingsComponent } from './settings/tenant-settings.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { UsersComponent } from './users/users.component';
import { JobsComponent } from './jobs/jobs.component';
import { AppPermissions } from '@shared/AppPermissions';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/admin/users', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'users', component: UsersComponent, data: { permission: AppPermissions.AdministrationUsers, reuse: true } },
                    { path: 'roles', component: RolesComponent, data: { permission: AppPermissions.AdministrationRoles } },
                    { path: 'auditLogs', component: AuditLogsComponent, data: { permission: AppPermissions.AdministrationAuditLogs } },
                    { path: 'maintenance', component: MaintenanceComponent, data: { permission: AppPermissions.AdministrationHostMaintenance } },
                    { path: 'jobs', component: JobsComponent, data: { permission: AppPermissions.AdministrationHangfireDashboard } },
                    { path: 'hostSettings', component: HostSettingsComponent, data: { permission: AppPermissions.AdministrationHostSettings + '|' + AppPermissions.AdministrationTenantHosts } },
                    { path: 'languages', component: LanguagesComponent, data: { permission: AppPermissions.AdministrationLanguages } },
                    { path: 'languages/:name/texts', component: LanguageTextsComponent, data: { permission: AppPermissions.AdministrationLanguagesChangeTexts } },
                    { path: 'organization-units', component: OrganizationUnitsComponent, data: { permission: AppPermissions.AdministrationOrganizationUnits } },
                    { path: 'tenantSettings', component: TenantSettingsComponent, data: { permission: AppPermissions.AdministrationTenantSettings + '|' + AppPermissions.AdministrationTenantHosts } },
                    { path: 'hostDashboard', component: HostDashboardComponent, data: { permission: AppPermissions.AdministrationHostDashboard } },
                    { path: 'ui-customization', component: UiCustomizationComponent },
                    { path: 'products', component: EditionsComponent, data: { permission: AppPermissions.Editions } },
                    { path: 'tenants', component: TenantsComponent, data: { permission: AppPermissions.Tenants } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})

export class AdminRoutingModule {

    constructor(
        private router: Router
    ) {
        router.events.subscribe((event) => {
            this.hideOpenDataTableDropdownMenus();

            if (event instanceof NavigationEnd) {
                window.scroll(0, 0);
            }
        });
    }

    hideOpenDataTableDropdownMenus(): void {
        let $dropdownMenus = $('.dropdown-menu.tether-element');
        $dropdownMenus.css({
            'display': 'none'
        });
    }

}
