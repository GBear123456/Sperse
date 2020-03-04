import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { LayoutType } from '@shared/service-proxies/service-proxies';

export class SliceConfig implements ConfigInterface {
    code = 'Slice';
    name = 'Slice';
    search = false;
    requiredFeature = AppFeatures.CRM;
    requiredPermission = AppPermissions.CRM;
    localizationSource = 'CRM';
    navigation = [
        {
            text: 'Dashboard',
            icon: 'icon-home',
            route: '/app/crm/dashboard'
        },
        {
            text: 'Contacts',
            permission: AppPermissions.CRMCustomers,
            icon: 'icon-globe',
            route: '/app/crm/leads'
        },
        {
            text: 'Clients',
            permission: AppPermissions.CRMCustomers,
            icon: 'icon-globe',
            route: '/app/crm/clients'
        },
        {
            text: 'Partners',
            permission: AppPermissions.CRMPartners,
            icon: 'icon-home',
            route: '/app/crm/partners'
        },
        {
            text: 'Orders',
            permission: AppPermissions.CRMOrders,
            icon: 'icon-home',
            route: '/app/crm/orders'
        },
        {
            text: 'Tasks',
            permission: AppPermissions.CRM,
            icon: 'icon-home',
            route: '/app/crm/activity'
        },
        {
            text: 'Reports',
            permission: AppPermissions.CRMCustomers,
            layout: LayoutType.BankCode,
            icon: 'icon-home',
            route: '/app/crm/reports'
        },
        {
            text: 'Products',
        }
    ];
}
