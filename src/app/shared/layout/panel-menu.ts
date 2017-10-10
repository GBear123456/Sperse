import {PanelMenuItem} from './panel-menu-item';

export class PanelMenu {
    name: string = '';
    text: string = '';
    items: PanelMenuItem[];

    constructor(name: string, text: string, items: PanelMenuItem[]) {
        this.name = name;
        this.text = text;
        this.items = items;
    }
}