import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class CfoConfig {
    code = 'CFO';
    name = 'CFO';
    search = false;
    requiredFeature = AppFeatures.CFO;
    requiredPermission = AppPermissions.CFO;
    localizationSource = 'CFO';
    navigation = [
        [
            '',
            '',
            'icon-home',
            '/app/cfo/:instance/start',
            '',
            ['/app/cfo/:instance/business-entities', '/app/cfo/:instance/chart-of-accounts']
        ],
        ['Accounts', '', 'icon-home', '/app/cfo/:instance/linkaccounts'],
        ['Transactions', '', 'icon-home', '/app/cfo/:instance/transactions'],
        ['Cashflow', '', 'icon-home', '/app/cfo/:instance/cashflow'],
        ['Stats', '', 'icon-home', '/app/cfo/:instance/stats'],
        ['Statements', '', 'icon-home', '/app/cfo/:instance/statements'],
        ['Reports', '', 'icon-home', '/app/cfo/:instance/reports']
    ];
}
