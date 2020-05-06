import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import {ConfigNavigation} from '../shared/common/config-navigation.interface';

export class HubConfig {
    code = 'HUB';
    name = 'HUB';
    search = false;
    requiredFeature = AppFeatures.HUB;
    requiredPermission = AppPermissions.HUB;
    localizationSource = 'HUB';
    navigation: ConfigNavigation[] = [
        {
            text: 'Marketplace',
            permission: AppPermissions.HUB,
            icon: 'icon-home',
            route: '/app/hub/marketplace'
        }
    ];
}
