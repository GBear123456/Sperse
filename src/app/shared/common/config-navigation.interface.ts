import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { LayoutType } from '@shared/service-proxies/service-proxies';

export interface ConfigNavigation {
    text?: string;
    permission?: AppPermissions | string;
    feature?: AppFeatures;
    layout?: LayoutType;
    icon?: string;
    route?: string;
    alterRoutes?: string[];
    host?: string;
}