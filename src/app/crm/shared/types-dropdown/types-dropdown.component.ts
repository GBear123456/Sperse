/** Core imports */
import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

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
    @ViewChild(DxSelectBoxComponent, { static: false }) selectBox: DxSelectBoxComponent;
    @Input() items: TypeItem[];
    @Input() totalCount: number;
    @Input() value;
    @Input() allowEdit = false;
    @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() onValueChanged: EventEmitter<any> = new EventEmitter<any>();
    @Output() onEdit: EventEmitter<{ id: number, value: string }> = new EventEmitter();

    constructor(private dialog: MatDialog) {}

    @HostListener('click', ['$event']) onClick(e) {
        if (e.target.closest('.edit')) {
            e.stopPropagation();
            e.preventDefault();
        }
    }

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
        this.dialog.open(EditTypeItemDialogComponent, {
            data: dialogData,
            position: DialogService.calculateDialogPosition(e, e.target || document.body, -20)
        }).afterClosed().subscribe((newName: string) => {
            if (newName) {
                this.itemChanged(itemId, newName)
            }
        });
        e.stopPropagation();
        e.preventDefault();
    }

    onOpened(e) {
        e.component._popup.option('elementAttr', { id: 'types-dropdown' });
    }

    itemClick(e) {
        if (this.allowEdit && e.event.target.closest('.edit')) {
            //this.selectBox.instance['__ignoreEvent'] = true;
            e.event.preventDefault();
            e.event.stopPropagation();
        }
    }

}