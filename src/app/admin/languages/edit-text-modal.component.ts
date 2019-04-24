/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Output,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import find from 'lodash/find';

/** Application imports */
import { LanguageServiceProxy, UpdateLanguageTextInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'editTextModal',
    templateUrl: './edit-text-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTextModalComponent {
    @ViewChild('targetValueInput') targetValueInput: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    model: UpdateLanguageTextInput = new UpdateLanguageTextInput();
    baseText: string;
    baseLanguage: abp.localization.ILanguageInfo;
    targetLanguage: abp.localization.ILanguageInfo;

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
        private _languageService: LanguageServiceProxy,
        private _dialogRef: MatDialogRef<EditTextModalComponent>,
        private _notifyServer: NotifyService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.model.sourceName = this.data.sourceName;
        this.model.key = this.data.key;
        this.model.languageName = this.data.targetLanguageName;
        this.model.value = this.data.targetValue;

        this.baseText = this.data.baseValue;
        this.baseLanguage = find(abp.localization.languages, l => l.name === this.data.baseLanguageName);
        this.targetLanguage = find(abp.localization.languages, l => l.name === this.data.targetLanguageName);
    }

    save(): void {
        this._languageService.updateLanguageText(this.model)
            .subscribe(() => {
                this._notifyServer.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this._dialogRef.close();
    }

    private findLanguage(name: string): abp.localization.ILanguageInfo {
        return find(abp.localization.languages, l => l.name === name);
    }
}
