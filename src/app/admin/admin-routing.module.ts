import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { EditionsComponent } from './editions/editions.component';
import { LanguageTextsComponent } from './languages/language-texts/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { RolesComponent } from './roles/roles.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { UsersComponent } from './users/users.component';
import { JobsComponent } from './jobs/jobs.component';
import { AppPermissions } from '@shared/AppPermissions';
import { TenantLandingPagesComponent } from './tenant-landing-pages/tenant-landing-pages.component';

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
                    { 
                        path: 'settings', 
                        loadChildren: () => import('app/admin/settings/settings/settings.module').then(m => m.SettingModule), 
                        data: { permission: AppPermissions.AdministrationTenantSettings + '|' + AppPermissions.AdministrationHostSettings + '|' + AppPermissions.AdministrationTenantHosts } 
                    },
                    { path: 'languages', component: LanguagesComponent, data: { permission: AppPermissions.AdministrationLanguages } },
                    { path: 'languages/:name/texts', component: LanguageTextsComponent, data: { permission: AppPermissions.AdministrationLanguagesChangeTexts } },
                    { 
                        path: 'organization-units',                         
                        loadChildren: () =>
                            import('./organization-units/organization-units.module').then(
                                (m) => m.OrganizationUnitsModule
                            ),
                        data: { permission: AppPermissions.AdministrationOrganizationUnits } 
                    },
                    {
                        path: 'hostDashboard',
                        loadChildren: () =>
                            import('./dashboard/host-dashboard.module').then((m) => m.HostDashboardModule),
                        data: { permission: AppPermissions.AdministrationHostDashboard },
                    },
                    { path: 'ui-customization', component: UiCustomizationComponent },
                    { path: 'products', component: EditionsComponent, data: { permission: AppPermissions.Editions } },
                    { path: 'tenants', component: TenantsComponent, data: { permission: AppPermissions.Tenants } },
                    { path: 'sites', component: TenantLandingPagesComponent, data: { permission: AppPermissions.AdministrationTenantLandingPages } }
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
