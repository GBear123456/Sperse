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
            route: '/app/crm/dashboard'
        },
        {
            text: 'Leads',
            permission: AppPermissions.CRMCustomers + '|' + AppPermissions.CRMPartners + '|' + AppPermissions.CRMEmployees + '|' + AppPermissions.CRMInvestors + '|' + AppPermissions.CRMVendors + '|' + AppPermissions.CRMOthers,
            route: '/app/crm/leads',
            items: []
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
            route: '/app/crm/orders',
            items: [{
                text: 'Orders',
                permission: AppPermissions.CRMOrders,
                route: '/app/crm/orders',
                params: {contactGroup: ContactGroup.Client, orderType: 1},
                items: Object.keys(ContactGroup).concat(['All']).map(contactGroup => ({
                    text: contactGroup,
                    localization: 'ContactGroup_',
                    route: '/app/crm/orders',
                    permission: AppPermissions['CRM' + contactGroup + 's'],
                    params: {contactGroup: ContactGroup[contactGroup] || '', orderType: 1}
                }))
            }, {
                text: 'Subscriptions',
                permission: AppPermissions.CRMOrders,
                route: '/app/crm/orders',
                params: {contactGroup: ContactGroup.Client, orderType: 2},
                items: Object.keys(ContactGroup).concat(['All']).map(contactGroup => ({
                    text: contactGroup,
                    localization: 'ContactGroup_',
                    route: '/app/crm/orders',
                    permission: AppPermissions['CRM' + contactGroup + 's'],
                    params: {contactGroup: ContactGroup[contactGroup] || '', orderType: 2}
                }))
            }]
        },
        {
            text: 'Invoices',
            permission: AppPermissions.CRMOrdersInvoices,
            route: '/app/crm/invoices'
        },
        {
            text: 'Products',
            permission: AppPermissions.CRMProducts,
            route: '/app/crm/products',
            items: [{
                text: 'Coupons',
                route: '/app/crm/coupons'
            }]
        },
/*
        {
            text: 'Tasks',
            permission: AppPermissions.CRM,
            route: '/app/crm/activity'
        },
*/
        {
            text: 'Reports',
            permission: AppPermissions.CRMCustomers + '&' + AppPermissions.CRMOrders,
            layout: LayoutType.BankCode,
            route: '/app/crm/reports'
        }
    ];
}