import {PanelMenuItem} from './panel-menu-item';

export class PanelMenu {
    name: string = '';
    displayName: string = '';
    items: PanelMenuItem[];

    constructor(name: string, displayName: string, items: PanelMenuItem[]) {
        this.name = name;
        this.displayName = displayName;
        this.items = items;
    }
}