import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class SliceConfig {
    code = 'Slice';
    name = 'Slice';
    search = false;
    requiredFeature = AppFeatures.CRM;
    requiredPermission = AppPermissions.CRM;
    localizationSource = 'Platform';
    navigation = [
        [ 'Dashboard', '', 'icon-home', '/app/crm/dashboard' ],
        [ 'Contacts', AppPermissions.CRMCustomers, 'icon-globe', '/app/slice/leads' ],
        [ 'Clients', AppPermissions.CRMCustomers, 'icon-globe', '/app/slice/clients' ],
        [ 'Partners', AppPermissions.CRMPartners, 'icon-globe', '/app/slice/partners' ],
        [ 'Tasks', AppPermissions.CRMEvents, 'icon-globe', '/app/crm/activity' ],
        [ 'Orders', AppPermissions.CRMOrders, 'icon-globe', '/app/crm/orders' ],
        [ 'Reports', '', '', '' ],
        [ 'Products', '', '', '' ]
    ];
}
