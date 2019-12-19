/** Core imports */
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

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { NotifyService } from '@abp/notify/notify.service';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { InplaceEditModel } from './inplace-edit.model';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'inplace-edit',
    templateUrl: './inplace-edit.component.html',
    styleUrls: ['./inplace-edit.component.less'],
    providers: [ ClipboardService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InplaceEditComponent extends AppComponentBase {
    @ViewChild(DxTextBoxComponent) textBox: DxTextBoxComponent;
    @ViewChild(DxTextAreaComponent) textArea: DxTextAreaComponent;
    @ViewChild('editText') editTextRef: ElementRef;

    @Input() set data(model: InplaceEditModel) {
        if (model && (!this._data || this._data.value != model.value)) {
            this._data = model;
            this.value = this.valueOriginal = model.value;
            this.id = model.id;
            this.displayValue = model.displayValue;
            this.value = model.value;
            this.link = model.link;
            this.validationRules = model.validationRules;
            this.isReadOnlyField = model.isReadOnlyField;
            this.isEditDialogEnabled = model.isEditDialogEnabled;
            this.isDeleteEnabled = model.isDeleteEnabled;
            this.lEntityName = model.lEntityName;
            this.editPlaceholder = model.editPlaceholder;
            this.lDeleteConfirmTitle = model.lDeleteConfirmTitle;
            this.lDeleteConfirmMessage = model.lDeleteConfirmMessage;
            this.changeDetector.detectChanges();
        }
    }
    get data(): InplaceEditModel {
        return this._data;
    }

    @Input() id: number;
    @Input() mask: string;
    @Input() multiline = false;
    @Input() maskInvalidMessage: string;
    @Input() maxLength;
    @Input() isOptional;
    @Input() label: string;
    @Input() value: string;
    @Input() displayValue: string;
    @Input() link: string;
    @Input() validationRules: object[];
    @Input() isReadOnlyField = false;
    @Input() isEditDialogEnabled = false;
    @Input() isDeleteEnabled = false;
    @Input() isCopyEnabled = false;
    @Input() lEntityName: string;
    @Input() editPlaceholder: string;
    @Input() lDeleteConfirmTitle: string;
    @Input() lDeleteConfirmMessage: string;
    @Input() allowCopy = false;
    @Input() showUpdateButton = true;
    @Input() showRefreshButton = true;
    @Input() saveOnClose = false;
    @Input() saveOnFocusOut = false;
    @Input() saveOnEnter = false;
    @Input() showEditModeOnEditButtonClick = false;
    @Input() buttonsPosition: 'right' | 'below' = 'right';
    @Output() valueChanged: EventEmitter<any> = new EventEmitter();
    @Output() itemDeleted: EventEmitter<any> = new EventEmitter();
    @Output() openDialog: EventEmitter<any> = new EventEmitter();

    isEditModeEnabled = false;
    valueOriginal = '';
    private _data: InplaceEditModel;
    private _clickTimeout;
    private _clickCounter = 0;

    constructor(
        injector: Injector,
        private changeDetector: ChangeDetectorRef,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        public dialog: MatDialog,
    ) {
        super(injector);
    }

    deleteItem(event) {
        if (!this.isReadOnlyField)
            this.dialog.open(ConfirmDialogComponent, {
                data: {
                  title: this.l(this.lDeleteConfirmTitle, this.l(this.lEntityName)),
                  message: this.l(this.lDeleteConfirmMessage, this.l(this.lEntityName).toLowerCase())
                }
            }).afterClosed().subscribe(result => {
                if (result) {
                    this.dialog.closeAll();
                    if (this.itemDeleted)
                        this.itemDeleted.emit(this.id);
                }
            });
        event.stopPropagation();
    }

    updateItem() {
        if (this.multiline || this.textBox.instance.option('isValid')) {
            if (this.value != this.valueOriginal && this.valueChanged)
                this.valueChanged.emit(this.valueOriginal);
            this.isEditModeEnabled = false;
            this.changeDetector.detectChanges();
        }
    }

    setEditModeEnabled(isEnabled: boolean, event?: MouseEvent) {
        if (this.isReadOnlyField)
            return ;

        if (this.value) {
            this._clickCounter++;
            clearTimeout(this._clickTimeout);
            this._clickTimeout = setTimeout(() => {
                if (isEnabled) {
                    if (this._clickCounter > 1)
                        this.showInput(isEnabled);
                    else if (!this.showEditModeOnEditButtonClick)
                        this.showDialog(event);
                } else
                    this.showInput(isEnabled);
                this._clickCounter = 0;
                this.changeDetector.detectChanges();
            }, 250);
        } else
            this.showInput(isEnabled);
    }

    showInput(enabled) {
        this.isEditModeEnabled = enabled;
        this.valueOriginal = this.value;
        enabled && setTimeout(() => {
            if (this.multiline)
                this.textArea.instance.focus();
            else
                this.textBox.instance.focus();
        });
    }

    copyToClipbord() {
        if (this.value) {
            this.clipboardService.copyFromContent(this.value);
            this.notifyService.info(this.l('Copied'));
        }
    }

    showDialog(event) {
        if (this.showEditModeOnEditButtonClick) {
            this.showInput(true);
        }
        this.openDialog.emit(event);
    }

    onEnterKey() {
        if (this.saveOnEnter) {
            this.updateItem();
        }
    }

    onFocusOut(event) {
        if (this.mask && this.isOptional && !event.component.option('value')) {
            event.component.option('mask', '');
            event.component.option('isValid', true);
        }
        if (this.saveOnFocusOut) {
            this.updateItem();
        }
    }

    onFocusIn(event) {
        if (this.mask) {
            event.component.option('mask', this.mask);
            event.component.option('isValid', true);
        }
    }

    onTextAreaInitialized(event) {
        setTimeout(() => event.component.repaint());
    }

    copyItem(event) {
        this.clipboardService.copyFromContent(this.value);
        this.notifyService.info(this.l('Copied'));
        event.stopPropagation();
    }
}
