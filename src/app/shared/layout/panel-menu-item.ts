export class PanelMenuItem {
    text: string = '';
    permissionName: string = '';
    icon: string = '';
    route: string = '';
    visible: boolean = true;
    items: PanelMenuItem[];

    constructor(text: string, permissionName: string, icon: string, route: string, items?: PanelMenuItem[]) {
        this.text = text;
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