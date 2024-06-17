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
            text: 'Dashboard',
            route: '/app/cfo/:instance/start',
            alterRoutes: ['/app/cfo/:instance/business-entities', '/app/cfo/:instance/chart-of-accounts'],
            icon: 'assets/common/icons/cfo/pie-chart.svg'
        },
        {
            text: 'Accounts',
            route: '/app/cfo/:instance/linkaccounts',
            icon: 'assets/common/icons/cfo/magic-stick.svg'
        },
        {
            text: 'Transactions',
            route: '/app/cfo/:instance/transactions',
            icon: 'assets/common/icons/cfo/credit-card.svg'
        },
        {
            text: 'Cashflow',
            route: '/app/cfo/:instance/cashflow',
            icon: 'assets/common/icons/cfo/chart-icon.svg'
        },
        {
            text: 'Stats',
            route: '/app/cfo/:instance/stats',
            icon: 'assets/common/icons/cfo/pulse-icon.svg'
        },
        {
            text: 'Statements',
            route: '/app/cfo/:instance/statements',
            icon: 'assets/common/icons/cfo/statements.svg'
        },
        {
            text: 'Reports',
            route: '/app/cfo/:instance/reports',
            icon: 'assets/common/icons/cfo/reports.svg'
        }
    ];
}
