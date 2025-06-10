import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export class PfmConfig implements ConfigInterface {
    code = 'PFM';
    name = 'PFM';
    search = false;
    requiredFeature = AppFeatures.PFM;
    requiredPermission = AppPermissions.PFM;
    localizationSource = 'PFM';
    navigation: ConfigNavigation[] = [
        {
            text: 'Offers',
            permission: AppPermissions.PFMApplicationsManageOffers,
            route: '/app/pfm/offers'
        },
        {
            text: 'Reports',
            permission: AppPermissions.PFMApplicationsManageOffers,
            route: '/app/pfm/reports'
        },
        {
            text: 'MemberArea',
            route: '/personal-finance'
        }
    ];
}
