import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { DxTooltipComponent } from '@root/node_modules/devextreme-angular/ui/tooltip';

@Component({
    selector: 'action-menu',
    templateUrl: './action-menu.component.html',
    styleUrls: ['./action-menu.component.less']
})
export class ActionMenuComponent {
    @Input() items: any[];
    @Input() visible = false;
    @Input() width = '200px';
    @Input() target = '.dx-state-hover .dx-link.dx-link-edit';
    @Output() onItemClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onHidden: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;

    show(target: any) {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.show(target);
        }
    }

    hide() {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.hide();
        }
    }
}
