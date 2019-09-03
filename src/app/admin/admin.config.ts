import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class AdminConfig {
    code =  'Admin';
    name = 'Admin';
    search = false;
    requiredFeature = AppFeatures.Admin;
    requiredPermission = AppPermissions.Administration;
    localizationSource = 'Platform';
    navigation = [
        [ 'Dashboard', AppPermissions.AdministrationHostDashboard, 'icon-home', '/app/admin/hostDashboard' ],
        [ 'Tenants', AppPermissions.Tenants, 'icon-globe', '/app/admin/tenants', 'Admin.Advanced' ],
        [ 'Roles', AppPermissions.AdministrationRoles, 'icon-briefcase', '/app/admin/roles', '' ],
        [ 'Users', AppPermissions.AdministrationUsers, 'icon-people', '/app/admin/users', '' ],
        [ 'Languages', AppPermissions.AdministrationLanguages, 'icon-flag', '/app/admin/languages', 'Admin.Customizations' ],
        [ 'AuditLogs', AppPermissions.AdministrationAuditLogs, 'icon-lock', '/app/admin/auditLogs', 'Admin.Advanced' ],
        [ 'Maintenance', AppPermissions.AdministrationHostMaintenance, 'icon-wrench', '/app/admin/maintenance', 'Admin.Advanced' ],
        [ 'Jobs', AppPermissions.AdministrationHangfireDashboard, 'icon-wrench', '/app/admin/jobs', 'Admin.Advanced' ],
        [ 'Settings', AppPermissions.AdministrationHostSettings + '|' + AppPermissions.AdministrationTenantHosts, 'icon-settings', '/app/admin/hostSettings', 'Admin', '', '', 'host' ],
        [ 'Settings', AppPermissions.AdministrationTenantSettings + '|' + AppPermissions.AdministrationTenantHosts, 'icon-settings', '/app/admin/tenantSettings', 'Admin', '', '', 'tenant' ],
        [ 'Products', AppPermissions.Editions, 'icon-grid', '/app/admin/products' ]
    ];
}
