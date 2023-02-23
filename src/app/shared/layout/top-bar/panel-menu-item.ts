import { Params } from '@angular/router';
import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';
import { LayoutType } from '@shared/service-proxies/service-proxies';

export class PanelMenuItem {
    text = '';
    permission: AppPermissions | string = null;
    feature: AppFeatures | string = null;
    layoutType: LayoutType = null;
    icon = '';
    route = '';
    params: Params;
    alterRoutes: string[] = [];
    visible = true;
    disabled = false;
    items: PanelMenuItem[];
    host: string;
    width: number;

    constructor(
        text: string,
        permission: AppPermissions | string,
        icon: string,
        route: string,
        feature: AppFeatures | string,
        disabled: boolean,
        alterRoutes?: string[],
        host?: string,
        layoutType?: LayoutType,
        items?: PanelMenuItem[],
        params?: Params
    ) {
        this.text = text;
        this.permission = permission;
        this.feature = feature;
        this.icon = icon;
        this.route = route;
        this.disabled = disabled;
        this.visible = Boolean(text);
        this.host = host;
        this.layoutType = layoutType;
        this.params = params;

        if (items === undefined) {
            this.items = [];
        } else {
            this.items = items;
        }

        if (alterRoutes === undefined) {
            this.alterRoutes = [];
        } else {
            this.alterRoutes = alterRoutes;
        }
    }
}
