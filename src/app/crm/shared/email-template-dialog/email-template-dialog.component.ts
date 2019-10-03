/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import * as ClassicEditor from 'ckeditor5-build-classic/build/ckeditor';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'email-template-dialog',
    templateUrl: 'email-template-dialog.component.html',
    styleUrls: [ 'email-template-dialog.component.less' ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateDialogComponent {
    Editor = ClassicEditor;

    showCC = false;
    showBSS = false;

    @Output() onSave: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTemplateChange: EventEmitter<any> = new EventEmitter<any>();

    buttons: IDialogButton[] = [
        {
            id: 'cancelTemplateOptions',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.dialogRef.close()
        }, {
            id: 'saveTemplateOptions',
            title: this.data.saveTitle,
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private dialogRef: MatDialogRef<EmailTemplateDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    save() {
        this.onSave.emit(this.data);
    }

    onTemplateChnaged(event) {
        this.onTemplateChange.emit(event);
    }

    emailInputFocusIn(event) {
        event.component.option('opened', false);
    }

    emailInputFocusOut(event) {
        if (!event.component.option('value'))
            this[event.component.option('name')] = false;
    }

    showInputField(element) {
        let component = element.instance;
        this[component.option('name')] = true;
        setTimeout(() => component.focus());
    }

    onCustomItemCreating(event) {
        let isValid = AppConsts.regexPatterns.email.test(event.text);
        event.component.option('isValid', isValid);
        return event.customItem = isValid ? event.text : '';
    }
}