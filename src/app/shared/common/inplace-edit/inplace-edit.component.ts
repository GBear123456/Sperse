import {
    Component,
    Injector,
    Input,
    ElementRef,
    Output,
    ViewChild,
    AfterViewInit,
    EventEmitter,
    ChangeDetectorRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { InplaceEditModel } from './inplace-edit.model';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

@Component({
    selector: 'inplace-edit',
    templateUrl: './inplace-edit.component.html',
    styleUrls: ['./inplace-edit.component.less']
})
export class InplaceEditComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild(DxTextBoxComponent) textBox: DxTextBoxComponent;
    @ViewChild('editText') editTextRef: ElementRef;

    @Input()
    data: InplaceEditModel;
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

    private _clickTimeout;
    private _clickCounter = 0;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private changeDetector: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngAfterViewInit() {
        this.valueOriginal = this.data && this.data.value;
        this.updateWidth();
    }

    updateWidth() {
        this.width = this.editTextRef.nativeElement.offsetWidth + 20;
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
            setTimeout(() => this.updateWidth());
        }
    }

    setEditModeEnabled(isEnabled: boolean, event?: MouseEvent) {
        this._clickCounter++;
        clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => {
            if (isEnabled) {
                if (this._clickCounter > 1) {
                    this.updateWidth();
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
            this.changeDetector.detectChanges();
        }, 250);
    }

    showDialog(event) {
        if (this.openDialog)
            this.openDialog.emit(event);
    }
}
