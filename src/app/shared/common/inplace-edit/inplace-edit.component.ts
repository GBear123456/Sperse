import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { InplaceEditModel } from './inplace-edit.model';

@Component({
    selector: 'inplace-edit',
    templateUrl: './inplace-edit.component.html',
    styleUrls: ['./inplace-edit.component.less']
})
export class InplaceEditComponent extends AppComponentBase {
    @Input()
    data: InplaceEditModel;

    @Output()
    valueChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    itemDeleted: EventEmitter<any> = new EventEmitter();
    @Output()
    openDialog: EventEmitter<any> = new EventEmitter();

    private _valueOriginal;
    isEditModeEnabled = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog
    ) {
        super(injector);
    }

    deleteItem(event) {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
              title: this.l(this.data.lDeleteConfirmTitle, this.l(this.data.lEntityName)),
              message: this.l(this.data.lDeleteConfirmMessage, this.l(this.data.lEntityName).toLowerCase())
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.dialog.closeAll();
                if (this.itemDeleted)
                    this.itemDeleted.emit(this.data.id);
            }
        });
        event.stopPropagation();      
    }

    updateItem(event, newValue) {
        if(!event.validationGroup || event.validationGroup.validate().isValid) {
            if (newValue != this._valueOriginal && this.valueChanged)
                this.valueChanged.emit(newValue);
            this.isEditModeEnabled = false;
        }      
    }

    setEditModeEnabled(isEnabled: boolean) {
        this.isEditModeEnabled = isEnabled;
        if (isEnabled)
            this._valueOriginal = this.data.value;
        else
            this.data.value = this._valueOriginal;
    }

    showDialog(event) {
        if (this.openDialog)
            this.openDialog.emit(event);
    }
}