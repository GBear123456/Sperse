import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

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
            route: '/app/crm/dashboard'
        },
        {
            text: 'Leads',
            permission: AppPermissions.CRMCustomers + '|' + AppPermissions.CRMPartners + '|' + AppPermissions.CRMEmployees + '|' + AppPermissions.CRMInvestors + '|' + AppPermissions.CRMVendors + '|' + AppPermissions.CRMOthers,
            route: '/app/crm/leads'
        },
        {
            text: 'Clients',
            permission: AppPermissions.CRMCustomers,
            route: '/app/crm/clients'
        },
        {
            text: 'Partners',
            permission: AppPermissions.CRMPartners,
            route: '/app/crm/partners'
        },
        {
            text: 'Orders',
            permission: AppPermissions.CRMOrders,
            route: '/app/crm/orders'
        },
        {
            text: 'Products',
            permission: AppPermissions.CRMProducts,
            route: '/app/crm/products',
            host: 'tenant'
        },
        {
            text: 'Tasks',
            permission: AppPermissions.CRM,
            route: '/app/crm/activity'
        },
        {
            text: 'Reports',
            permission: AppPermissions.CRMCustomers + '&' + AppPermissions.CRMOrders,
            layout: LayoutType.BankCode,
            route: '/app/crm/reports'
        }
    ];
}