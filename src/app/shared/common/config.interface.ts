import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';

export interface ConfigInterface {
    code?: string;
    name: string;
    displayName?: string;
    search?: boolean;
    requiredFeature: AppFeatures;
    requiredPermission: AppPermissions;
    localizationSource: string;
    navigation: ConfigNavigation[];
}