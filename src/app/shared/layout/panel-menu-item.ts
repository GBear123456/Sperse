import { AppFeatures } from '@shared/AppFeatures';
import { AppPermissions } from '@shared/AppPermissions';

export class PanelMenuItem {
    text = '';
    permissionName: AppPermissions = null;
    featureName: AppFeatures = null;
    icon = '';
    route = '';
    alterRoutes: string[] = [];
    visible = true;
    disabled = false;
    items: PanelMenuItem[];
    host: string;

    constructor(
        text: string,
        permissionName: AppPermissions,
        icon: string,
        route: string,
        featureName: AppFeatures,
        alterRoutes?: string[],
        items?: PanelMenuItem[],
        host?: string
    ) {
        this.text = text;
        this.permissionName = permissionName;
        this.featureName = featureName;
        this.icon = icon;
        this.route = route;
        this.disabled = !route;
        this.visible = Boolean(text);
        this.host = host;

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
