import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class AdminConfig implements ConfigInterface {
    code =  'Admin';
    name = 'Admin';
    search = false;
    requiredFeature = AppFeatures.Admin;
    requiredPermission = AppPermissions.Administration;
    localizationSource = 'Platform';
    navigation: ConfigNavigation[] = [
        {
            text: 'Dashboard',
            permission: AppPermissions.AdministrationHostDashboard,
            route: '/app/admin/hostDashboard'
        },
        {
            text: 'Tenants',
            permission: AppPermissions.Tenants,
            feature: AppFeatures.AdminAdvanced,
            route: '/app/admin/tenants'
        },
        {
            text: 'Roles',
            permission: AppPermissions.AdministrationRoles,
            route: '/app/admin/roles'
        },
        {
            text: 'Users',
            permission: AppPermissions.AdministrationUsers,
            route: '/app/admin/users'
        },
        {
            text: 'Languages',
            permission: AppPermissions.AdministrationLanguages,
            feature: AppFeatures.AdminCustomizations,
            route: '/app/admin/languages'
        },
        {
            text: 'AuditLogs',
            permission: AppPermissions.AdministrationAuditLogs,
            feature: AppFeatures.AdminAdvanced,
            route: '/app/admin/auditLogs'
        },
        {
            text: 'Maintenance',
            permission: AppPermissions.AdministrationHostMaintenance,
            feature: AppFeatures.AdminAdvanced,
            route: '/app/admin/maintenance'
        },
        {
            text: 'Jobs',
            permission: AppPermissions.AdministrationHangfireDashboard,
            feature: AppFeatures.AdminAdvanced,
            route: '/app/admin/jobs'
        },
        {
            text: 'Settings',
            permission: AppPermissions.AdministrationHostSettings + '|' + AppPermissions.AdministrationTenantSettings + '|' + AppPermissions.AdministrationTenantHosts,
            feature: AppFeatures.Admin,
            route: '/app/admin/settings'
        },
        {
            text: 'Products',
            permission: AppPermissions.Editions,
            route: '/app/admin/products'
        }
    ];
}
