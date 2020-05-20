import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class CfoConfig implements ConfigInterface {
    code = 'CFO';
    name = 'CFO';
    search = false;
    requiredFeature = AppFeatures.CFO;
    requiredPermission = AppPermissions.CFO;
    localizationSource = 'CFO';
    navigation: ConfigNavigation[] = [
        {
            route: '/app/cfo/:instance/start',
            alterRoutes: ['/app/cfo/:instance/business-entities', '/app/cfo/:instance/chart-of-accounts']
        },
        {
            text: 'Accounts',
            route: '/app/cfo/:instance/linkaccounts'
        },
        {
            text: 'Transactions',
            route: '/app/cfo/:instance/transactions'
        },
        {
            text: 'Cashflow',
            route: '/app/cfo/:instance/cashflow'
        },
        {
            text: 'Stats',
            route: '/app/cfo/:instance/stats'
        },
        {
            text: 'Statements',
            route: '/app/cfo/:instance/statements'
        },
        {
            text: 'Reports',
            route: '/app/cfo/:instance/reports'
        }
    ];
}
