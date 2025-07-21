import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class AdminConfig implements ConfigInterface {
  code = 'Admin';
  name = 'Admin';
  search = false;
  requiredFeature = AppFeatures.Admin;
  requiredPermission = AppPermissions.Administration;
  localizationSource = 'Platform';
  navigation: ConfigNavigation[] = [
    {
      text: 'Dashboard',
      permission: AppPermissions.AdministrationHostDashboard,
      route: '/app/admin/hostDashboard',
      icon: 'assets/common/icons/admin/dashboard.svg',
    },
    {
      text: 'Tenants',
      permission: AppPermissions.Tenants,
      feature: AppFeatures.AdminAdvanced,
      route: '/app/admin/tenants',
      icon: 'assets/common/icons/admin/tenants.svg',
    },
    {
      text: 'Sites',
      permission: AppPermissions.AdministrationTenantLandingPages,
      route: '/app/admin/sites',
      icon: 'assets/common/icons/admin/websites.svg',
    },
    {
      text: 'Roles',
      permission: AppPermissions.AdministrationRoles,
      route: '/app/admin/roles',
      icon: 'assets/common/icons/admin/roles.svg',
    },
    {
      text: 'Users',
      permission: AppPermissions.AdministrationUsers,
      route: '/app/admin/users',
      icon: 'assets/common/icons/admin/users.svg',
    },
    {
      text: 'Languages',
      permission: AppPermissions.AdministrationLanguages,
      feature: AppFeatures.AdminCustomizations,
      route: '/app/admin/languages',
      icon: 'assets/common/icons/admin/languages.svg',
    },
    {
      text: 'AuditLogs',
      permission: AppPermissions.AdministrationAuditLogs,
      feature: AppFeatures.AdminAdvanced,
      route: '/app/admin/auditLogs',
      icon: 'assets/common/icons/admin/audit.svg',
    },
    {
      text: 'Maintenance',
      permission: AppPermissions.AdministrationHostMaintenance,
      feature: AppFeatures.AdminAdvanced,
      route: '/app/admin/maintenance',
      icon: 'assets/common/icons/admin/maintenance.svg',
    },
    {
      text: 'Jobs',
      permission: AppPermissions.AdministrationHangfireDashboard,
      feature: AppFeatures.AdminAdvanced,
      route: '/app/admin/jobs',
      icon: 'assets/common/icons/admin/jobs.svg',
    },
    {
      text: 'Settings',
      permission:
        AppPermissions.AdministrationHostSettings +
        '|' +
        AppPermissions.AdministrationTenantSettings +
        '|' +
        AppPermissions.AdministrationTenantHosts,
      feature: AppFeatures.Admin,
      route: '/app/admin/settings',
      icon: 'assets/common/icons/admin/settings.svg',
    },
  ];
}
