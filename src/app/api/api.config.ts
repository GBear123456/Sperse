import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class ApiConfig {
    code = 'API';
    name = 'API';
    search = false;
    requiredFeature = AppFeatures.API;
    requiredPermission = AppPermissions.API;
    localizationSource = 'Platform';
    navigation = [
        [ 'Introduction', '', '', '/app/api/introduction' ],
        [ 'Documentation', '', 'icon-home', '/app/api/swagger' ],
        [ 'Downloads', '', '', '' ],
        [ 'Demos', '', '', '' ]
    ];
}
