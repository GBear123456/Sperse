import { Component, Injector, Input, Output, ViewChild, AfterViewInit, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { InplaceEditModel } from './inplace-edit.model';

import { DxTextBoxComponent } from 'devextreme-angular';

@Component({
    selector: 'inplace-edit',
    templateUrl: './inplace-edit.component.html',
    styleUrls: ['./inplace-edit.component.less']
})
export class InplaceEditComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild(DxTextBoxComponent) textBox: DxTextBoxComponent;

    @Input()
    data: InplaceEditModel;

    @Output()
    valueChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    itemDeleted: EventEmitter<any> = new EventEmitter();
    @Output()
    openDialog: EventEmitter<any> = new EventEmitter();

    isEditModeEnabled = false;
    valueOriginal: string = '';

    constructor(
        injector: Injector,
        public dialog: MatDialog
    ) {
        super(injector);        
    }

    ngAfterViewInit() {
        this.valueOriginal = this.data.value;
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

    updateItem(event) {
        if(!event.validationGroup || event.validationGroup.validate().isValid) {
            if (this.data.value != this.valueOriginal && this.valueChanged)
                this.valueChanged.emit(this.valueOriginal);
            this.isEditModeEnabled = false;
        }      
    }

    setEditModeEnabled(isEnabled: boolean) {
        if (this.isEditModeEnabled = isEnabled) {
            this.valueOriginal = this.data.value;
            setTimeout(() => this.textBox.instance.focus());
        } else
            this.data.value = this.valueOriginal;
    }

    showDialog(event) {
        if (this.openDialog)
            this.openDialog.emit(event);
    }
}