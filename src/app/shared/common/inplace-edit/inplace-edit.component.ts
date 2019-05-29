import {
    Component,
    Injector,
    Input,
    ElementRef,
    Output,
    ViewChild,
    EventEmitter,
    ChangeDetectorRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { InplaceEditModel } from './inplace-edit.model';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

@Component({
    selector: 'inplace-edit',
    templateUrl: './inplace-edit.component.html',
    styleUrls: ['./inplace-edit.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InplaceEditComponent extends AppComponentBase {
    @ViewChild(DxTextBoxComponent) textBox: DxTextBoxComponent;
    @ViewChild('editText') editTextRef: ElementRef;

    @Input()
    set data(model: InplaceEditModel) {
        if (model && (!this._data || this._data.value != model.value)) {
            this._data = model;
            this.valueOriginal = model.value;
            this.changeDetector.detectChanges();
            setTimeout(() => this.updateWidth());
        }
    }
    get data(): InplaceEditModel {
        return this._data;
    }
    @Input()
    mask: string;
    @Input()
    maskInvalidMessage: string;
    width = 'auto';

    @Output()
    valueChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    itemDeleted: EventEmitter<any> = new EventEmitter();
    @Output()
    openDialog: EventEmitter<any> = new EventEmitter();

    isEditModeEnabled = false;
    valueOriginal = '';

    private _data: InplaceEditModel;
    private _clickTimeout;
    private _clickCounter = 0;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private changeDetector: ChangeDetectorRef
    ) {
        super(injector);
    }

    updateWidth() {
        this.width = this.editTextRef.nativeElement.offsetWidth + 30;
        this.changeDetector.detectChanges();
    }

    deleteItem(event) {
        if (!this._data.isReadOnlyField)
            this.dialog.open(ConfirmDialogComponent, {
                data: {
                  title: this.l(this._data.lDeleteConfirmTitle, this.l(this._data.lEntityName)),
                  message: this.l(this._data.lDeleteConfirmMessage, this.l(this._data.lEntityName).toLowerCase())
                }
            }).afterClosed().subscribe(result => {
                if (result) {
                    this.dialog.closeAll();
                    if (this.itemDeleted)
                        this.itemDeleted.emit(this._data.id);
                }
            });
        event.stopPropagation();
    }

    updateItem(event) {
        if (!event.validationGroup || event.validationGroup.validate().isValid) {
            if (this._data.value != this.valueOriginal && this.valueChanged)
                this.valueChanged.emit(this.valueOriginal);
            this.isEditModeEnabled = false;
            this.changeDetector.detectChanges();
            setTimeout(() => this.updateWidth());
        }
    }

    setEditModeEnabled(isEnabled: boolean, event?: MouseEvent) {
        if (this._data.isReadOnlyField)
            return ;

        if (this._data.value) {
            this._clickCounter++;
            clearTimeout(this._clickTimeout);
            this._clickTimeout = setTimeout(() => {
                if (isEnabled) {
                    if (this._clickCounter > 1)
                        this.showInput(isEnabled);
                    else
                        this.showDialog(event);
                } else {
                    this.isEditModeEnabled = isEnabled;
                    this._data.value = this.valueOriginal;
                }
                this._clickCounter = 0;
                this.changeDetector.detectChanges();
            }, 250);
        } else 
            this.showInput(isEnabled);
    }

    showInput(enabled) {
        enabled && this.updateWidth();
        this.isEditModeEnabled = enabled;
        this.valueOriginal = this._data.value;
        enabled && setTimeout(() => 
            this.textBox.instance.focus());
    }

    showDialog(event) {
        if (this.openDialog)
            this.openDialog.emit(event);
    }
}