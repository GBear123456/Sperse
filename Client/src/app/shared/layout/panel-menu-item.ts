export class PanelMenuItem {
    name: string = '';
    permissionName: string = '';
    icon: string = '';
    route: string = '';
    items: PanelMenuItem[];

    constructor(name: string, permissionName: string, icon: string, route: string, items?: PanelMenuItem[]) {
        this.name = name;
        this.permissionName = permissionName;
        this.icon = icon;
        this.route = route;

        if (items === undefined) {
            this.items = [];    
        } else {
            this.items = items;
        }        
    }
}