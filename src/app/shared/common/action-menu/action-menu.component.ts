import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';

@Component({
    selector: 'action-menu',
    templateUrl: './action-menu.component.html',
    styleUrls: ['./action-menu.component.less']
})
export class ActionMenuComponent {
    @Input() items: ActionMenuItem[];
    @Input() visible = false;
    @Input() width = '200px';
    @Input() target = '.dx-state-hover .dx-link.dx-link-edit';
    @Output() onItemClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onHidden: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(DxTooltipComponent, { static: false }) actionsTooltip: DxTooltipComponent;

    show(target: any) {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.show(target);
        }
    }

    toggle(target: any = null) {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            setTimeout(() => {
                if (this.actionsTooltip.instance.option('visible')) {
                    this.hide();
                } else {
                    this.show(target);
                }
            });
        }
    }

    hide() {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.hide();
        }
    }
}
