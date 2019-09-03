import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class PfmConfig {
    code = 'PFM';
    name = 'PFM';
    search = false;
    requiredFeature = AppFeatures.PFM;
    requiredPermission = AppPermissions.PFM;
    localizationSource = 'PFM';
    navigation = [
        [ 'Offers', AppPermissions.PFMApplicationsManageOffers, 'icon-home', '/app/pfm/offers' ],
        [ 'Reports', AppPermissions.PFMApplicationsManageOffers, 'icon-home', '/app/pfm/reports' ],
        [ 'MemberArea', '', 'icon-home', 'personal-finance' ]
    ];
}
