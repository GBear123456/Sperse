import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class ApiConfig implements ConfigInterface {
    code = 'API';
    name = 'API';
    search = false;
    requiredFeature = AppFeatures.API;
    requiredPermission = AppPermissions.API;
    localizationSource = 'Platform';
    navigation: ConfigNavigation[] = [
        {
            text: 'Introduction',
            route: '/app/api/introduction'
        },
        {
            text: 'Documentation',
            route: '/app/api/swagger'
        },
        {
            text: 'Downloads'
        },
        {
            text: 'Demos'
        }
    ];
}
