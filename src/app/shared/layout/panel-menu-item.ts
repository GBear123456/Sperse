export class PanelMenuItem {
    text: string = '';
    permissionName: string = '';
    featureName: string = '';
    icon: string = '';
    route: string = '';
    alterRoutes: string[] = [];
    visible: boolean = true;
    disabled: boolean = false;
    items: PanelMenuItem[];

    constructor(text: string, permissionName: string, icon: string, route: string, featureName: string, alterRoutes?: string[], items?: PanelMenuItem[]) {
        this.text = text;
        this.permissionName = permissionName;
        this.featureName = featureName;
        this.icon = icon;
        this.route = route;
        this.disabled = !route;
        this.visible = Boolean(text);
        
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
