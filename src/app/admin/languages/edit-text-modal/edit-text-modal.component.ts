/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Inject,
    Output,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { LanguageServiceProxy, UpdateLanguageTextInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { NotifyService } from 'abp-ng2-module';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'editTextModal',
    templateUrl: './edit-text-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTextModalComponent {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    model: UpdateLanguageTextInput = new UpdateLanguageTextInput(this.data);
    baseText: string = this.data.baseValue;
    baseLanguage: abp.localization.ILanguageInfo = this.findLanguage(this.data.baseLanguageName);
    targetLanguage: abp.localization.ILanguageInfo = this.findLanguage(this.data.languageName);
    active = false;
    title = this.ls.l('EditText');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private languageService: LanguageServiceProxy,
        private dialogRef: MatDialogRef<EditTextModalComponent>,
        private notifyServer: NotifyService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    save(): void {
        this.modalDialog.startLoading();
        this.languageService.updateLanguageText(this.model)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyServer.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }

    private findLanguage(name: string): abp.localization.ILanguageInfo {
        return abp.localization.languages.find((l: abp.localization.ILanguageInfo) => l.name === name);
    }
}
