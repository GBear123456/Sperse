/** Core imports */
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular';

/** Application imports */
import { TypeItem } from '@app/crm/shared/types-dropdown/type-item.interface';
import { EditTypeItemDialogComponent } from '@app/crm/shared/types-dropdown/edit-type-item-dialog/edit-type-item-dialog.component';
import { EditTypeItemDialogData } from '@app/crm/shared/types-dropdown/edit-type-item-dialog/edit-type-item-dialog-data.interface';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@Component({
    selector: 'types-dropdown',
    templateUrl: 'types-dropdown.component.html',
    styleUrls: ['./types-dropdown.component.less']
})
export class TypesDropdownComponent {
    @ViewChild(DxSelectBoxComponent) selectBox: DxSelectBoxComponent;
    @Input() items: TypeItem[];
    @Input() totalCount: number;
    @Input() totalErrorMsg: string = '';
    @Input() showTotalCount: Boolean;
    @Input() showLoading: Boolean;
    @Input() value;
    @Input() allowEdit = false;
    @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() onValueChanged: EventEmitter<any> = new EventEmitter<any>();
    @Output() onEdit: EventEmitter<{ id: number, value: string }> = new EventEmitter();

    constructor(private dialog: MatDialog) {}

    valueChanged(e) {
        this.valueChange.emit(e.value);
        this.onValueChanged.emit(e);
    }

    itemChanged(itemId: number, value: string) {
        this.onEdit.emit({
            id: itemId,
            value: value
        });
    }

    openEditDialog(e: MouseEvent, itemId: number, itemName: string) {
        const dialogData: EditTypeItemDialogData = {
            name: itemName
        };
        this.selectBox.instance['_popup'].option('closeOnOutsideClick', false);
        this.dialog.open(EditTypeItemDialogComponent, {
            data: dialogData,
            position: DialogService.calculateDialogPosition(e, e.target || document.body, -20)
        }).afterClosed().subscribe((newName: string) => {
            this.selectBox.instance['_popup'].option('closeOnOutsideClick', true);
            if (newName) {
                this.itemChanged(itemId, newName);
            }
        });
        e.stopPropagation();
        e.preventDefault();
    }

    onOpened(e) {
        e.component._popup.option('elementAttr', { id: 'types-dropdown' });
        this.updatePopupWidth(e.component._popup);
    }

    onContentReady(e) {
        this.updatePopupWidth(e.component._popup);
    }

    isTotalCountValid() {
        return Number.isInteger(this.totalCount);
    }

    private updatePopupWidth(popup) {
        if (popup) {
            /** Get the widest item and set popup width with its width */
            const longestItemWidth: number = Array.prototype.reduce.call(
                popup.content().querySelectorAll('.dx-scrollview-content .dx-item span'),
                (longestItemWidth: number, currentItem: HTMLElement) => {
                    if (!longestItemWidth || currentItem.offsetWidth > longestItemWidth) {
                        longestItemWidth = currentItem.offsetWidth;
                    }
                    return longestItemWidth;
                }, null
            );
            if (longestItemWidth) {
                popup.option('width', longestItemWidth + 20 + (this.allowEdit ? 25 : 0));
            }
        }
    }
}