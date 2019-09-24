import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class HubConfig {
    code = 'HUB';
    name = 'HUB';
    search = false;
    requiredFeature = AppFeatures.HUB;
    requiredPermission = AppPermissions.HUB;
    localizationSource = 'HUB';
    navigation = [
        [ 'Marketplace', AppPermissions.HUB, 'icon-home', '/app/hub/marketplace' ]
    ];
}
