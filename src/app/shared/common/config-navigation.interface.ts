import { Params } from '@angular/router';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { LayoutType } from '@shared/service-proxies/service-proxies';

export interface ConfigNavigation {
    text?: string;
    permission?: AppPermissions | string;
    feature?: AppFeatures | string;
    layout?: LayoutType;
    icon?: string;
    route?: string;
    params?: Params;
    alterRoutes?: string[];
    host?: string;
    items?: ConfigNavigation[];
}