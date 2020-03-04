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
            icon: 'icon-home',
            route: '/app/cfo/:instance/start',
            alterRoutes: ['/app/cfo/:instance/business-entities', '/app/cfo/:instance/chart-of-accounts']
        },
        {
            text: 'Accounts',
            icon: 'icon-home',
            route: '/app/cfo/:instance/linkaccounts'
        },
        {
            text: 'Transactions',
            icon: 'icon-home',
            route: '/app/cfo/:instance/transactions'
        },
        {
            text: 'Cashflow',
            icon: 'icon-home',
            route: '/app/cfo/:instance/cashflow'
        },
        {
            text: 'Stats',
            icon: 'icon-home',
            route: '/app/cfo/:instance/stats'
        },
        {
            text: 'Statements',
            icon: 'icon-home',
            route: '/app/cfo/:instance/statements'
        },
        {
            text: 'Reports',
            icon: 'icon-home',
            route: '/app/cfo/:instance/reports'
        }
    ];
}
