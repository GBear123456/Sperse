import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class CfoPortalConfig implements ConfigInterface {
    code = 'CFOP';
    name = 'CFO Portal';
    displayName = 'Portal';
    requiredFeature = AppFeatures.CFOPartner;
    requiredPermission = AppPermissions.CFOMemberAccess;
    localizationSource = 'CFO';
    navigation: ConfigNavigation[] = [
        {
            text: 'Dashboard',
            icon: 'icon-home',
            route: '/app/cfo-portal/overview'
        },
        {
            text: 'Accounts',
            icon: 'icon-home',
            route: '/app/cfo-portal/linkaccounts'
        },
        {
            text: 'Transactions',
            icon: 'icon-home',
            route: '/app/cfo-portal/transactions'
        },
        {
            text: 'Cashflow',
            icon: 'icon-home',
            route: '/app/cfo-portal/cashflow'
        },
        {
            text: 'Stats',
            icon: 'icon-home',
            route: '/app/cfo-portal/stats'
        },
        {
            text: 'Statements',
            icon: 'icon-home',
            route: '/app/cfo-portal/statements'
        },
        {
            text: 'Reports',
            icon: 'icon-home',
            route: '/app/cfo-portal/reports'
        }
    ];
}
