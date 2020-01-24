import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class CrmConfig {
    code = 'CRM';
    name = 'CRM';
    search = false;
    requiredFeature = AppFeatures.CRM;
    requiredPermission = AppPermissions.CRM;
    localizationSource = 'CRM';
    navigation = [
        [ 'Dashboard', '', 'icon-home', '/app/crm/dashboard' ],
        [ 'Contacts', AppPermissions.CRMCustomers, 'icon-globe', '/app/crm/leads' ],
        [ 'Clients', AppPermissions.CRMCustomers, 'icon-globe', '/app/crm/clients' ],
        [ 'Partners', AppPermissions.CRMPartners, 'icon-globe', '/app/crm/partners' ],
        [ 'Orders', AppPermissions.CRMOrders, 'icon-globe', '/app/crm/orders' ],
        [ 'Tasks', AppPermissions.CRMEvents, 'icon-globe', '/app/crm/activity' ],
        [ 'Reports', '', '', '' ],
        [ 'Products', '', '', '' ]
    ];
}
