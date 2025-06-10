import { ConfigInterface } from '@app/shared/common/config.interface';
import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
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
            route: '/app/cfo/:instance/start'
        },
        {
            text: 'Accounts',
            route: '/app/cfo/:instance/linkaccounts'
        }
    ];
}
