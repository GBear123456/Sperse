import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class CfoPortalConfig {
    code = 'CFOP';
    name = 'CFO Portal';
    requiredFeature = AppFeatures.CFOPartner;
    requiredPermission = AppPermissions.CFOMemberAccess;
    localizationSource = 'CFO';
    navigation = [
        [ 'Dashboard', '', 'icon-home', '/app/cfo-portal/overview' ],
        [ 'Accounts', '', 'icon-home', '/app/cfo-portal/linkaccounts' ],
        [ 'Transactions', '', 'icon-home', '/app/cfo-portal/transactions' ],
        [ 'Cashflow', '', 'icon-home', '/app/cfo-portal/cashflow' ],
        [ 'Stats', '', 'icon-home', '/app/cfo-portal/stats' ],
        [ 'Statements', '', 'icon-home', '/app/cfo-portal/statements' ],
        [ 'Reports', '', 'icon-home', '/app/cfo-portal/reports' ]
    ];
}
