import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';
import { ContactGroup } from '@shared/AppEnums';

export class CrmConfig implements ConfigInterface {
  code = 'CRM';
  name = 'CRM';
  search = false;
  requiredFeature = AppFeatures.CRM;
  requiredPermission = AppPermissions.CRM;
  localizationSource = 'CRM';
  navigation: ConfigNavigation[] = [
    {
      text: 'Dashboard',
      route: '/app/crm/dashboard',
      icon: 'assets/common/icons/crm/dashboard.svg',
    },
    {
      text: 'Leads',
      permission:
        AppPermissions.CRMCustomers +
        '|' +
        AppPermissions.CRMPartners +
        '|' +
        AppPermissions.CRMEmployees +
        '|' +
        AppPermissions.CRMInvestors +
        '|' +
        AppPermissions.CRMVendors +
        '|' +
        AppPermissions.CRMOthers,
      icon: 'assets/common/icons/crm/leads.svg',
      route: '/app/crm/leads',
      items: [],
    },
    {
      text: 'Clients',
      icon: 'assets/common/icons/crm/customers.svg',
      permission: AppPermissions.CRMCustomers,
      route: '/app/crm/clients',
    },
    {
      text: 'Partners',
      icon: 'assets/common/icons/crm/partners.svg',
      permission: AppPermissions.CRMPartners,
      route: '/app/crm/partners',
    },
    {
      text: 'Orders',
      icon: 'assets/common/icons/crm/orders.svg',
      permission: AppPermissions.CRMOrders,
      alterRoutes: ['/app/crm/invoices'],
      route: '/app/crm/orders',
      items: [
        {
          text: 'Orders',
          permission: AppPermissions.CRMOrders,
          route: '/app/crm/orders',
          params: { orderType: 1 },
        },
        {
          text: 'Subscriptions',
          permission: AppPermissions.CRMOrders,
          route: '/app/crm/orders',
          params: { orderType: 2 },
        },
        {
          text: 'Invoices',
          permission: AppPermissions.CRMOrdersInvoices,
          route: '/app/crm/invoices',
        },
      ],
    },
    {
      text: 'Products',
      icon: 'assets/common/icons/crm/products.svg',
      permission: AppPermissions.CRMProducts,
      alterRoutes: ['/app/crm/coupons'],
      route: '/app/crm/products',
      items: [
        {
          text: 'Products',
          permission: AppPermissions.CRMProducts,
          route: '/app/crm/products',
        },
        {
          text: 'Coupons',
          permission: AppPermissions.CRMProducts,
          route: '/app/crm/coupons',
        },
      ],
    },
    /*
        {
            text: 'Tasks',
            icon: 'assets/common/icons/crm/tasks.png',
            permission: AppPermissions.CRM,
            route: '/app/crm/activity'
        },
*/
    {
      text: 'TenantReports',
      icon: 'assets/common/icons/crm/reports.svg',
      permission: AppPermissions.Tenants,
      route: '/app/crm/tenant-reports',
    },
    {
      text: 'Reports',
      icon: 'assets/common/icons/crm/reports.svg',
      permission: AppPermissions.CRMCustomers + '&' + AppPermissions.CRMOrders,
      layout: LayoutType.BankCode,
      route: '/app/crm/reports',
    },
  ];
}
