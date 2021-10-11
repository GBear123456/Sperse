/** Core imports */
import { Component, EventEmitter, ViewEncapsulation, Output, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';

/** Application imports */
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';

@Component({
    selector: 'action-menu',
    templateUrl: './action-menu.component.html',
    styleUrls: ['./action-menu.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class ActionMenuComponent {
    @Input() items: ActionMenuItem[] | ActionMenuGroup[];
    @Input() visible = false;
    @Input() width = '200px';
    @Input() target = '.dx-state-hover .dx-link.dx-link-edit';
    @Input() grouped = false;
    @Input() class = '';
    @Output() onItemClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onHidden: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(DxTooltipComponent, { static: false }) actionsTooltip: DxTooltipComponent;

    show(target: any) {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.items.forEach(item => {
                if (item.checkVisible)
                    item.visible = item.checkVisible();
            });
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

    onTooltipShowing(e) {
        if (this.class) {
            e.component.$content()[0].classList.add(this.class);
        }
    }

    hide() {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.hide();
        }
    }
}