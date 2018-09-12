import { Component, Injector, Input, Output, ViewChild, AfterViewInit, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
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
    @Input()
    mask: string;
    @Input()
    maskInvalidMessage: string;

    @Output()
    valueChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    itemDeleted: EventEmitter<any> = new EventEmitter();
    @Output()
    openDialog: EventEmitter<any> = new EventEmitter();

    isEditModeEnabled = false;
    valueOriginal = '';

    private _clickTimeout;
    private _clickCounter = 0;

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
        if (!event.validationGroup || event.validationGroup.validate().isValid) {
            if (this.data.value != this.valueOriginal && this.valueChanged)
                this.valueChanged.emit(this.valueOriginal);
            this.isEditModeEnabled = false;
        }
    }

    setEditModeEnabled(isEnabled: boolean, event = undefined) {       
        this._clickCounter++;
        clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => {
            if (isEnabled) {                
                if (this._clickCounter > 1) {
                    this.isEditModeEnabled = isEnabled;
                    this.valueOriginal = this.data.value;
                    setTimeout(() => this.textBox.instance.focus());
                } else 
                    this.showDialog(event);
            } else {
                this.isEditModeEnabled = isEnabled;
                this.data.value = this.valueOriginal;
            }
            this._clickCounter = 0;
        }, 250);
    }

    showDialog(event) {
        if (this.openDialog)
            this.openDialog.emit(event);
    }
}
