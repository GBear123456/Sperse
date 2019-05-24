/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';
/** Third party imports */
import find from 'lodash/find';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA } from '@angular/material';
/** Application imports */
import { LanguageServiceProxy, UpdateLanguageTextInput } from '@shared/service-proxies/service-proxies';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'editTextModal',
    templateUrl: './edit-text-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTextModalComponent extends AppModalDialogComponent implements OnInit {
    @ViewChild('targetValueInput') targetValueInput: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    model: UpdateLanguageTextInput = new UpdateLanguageTextInput();

    baseText: string;
    baseLanguage: abp.localization.ILanguageInfo;
    targetLanguage: abp.localization.ILanguageInfo;

    active = false;
    saving = false;

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy
    ) {
        super(injector);
        this.data = injector.get(MAT_DIALOG_DATA);
        if (this.data) {
            this.data.title = this.l('EditText');
            this.model.sourceName = this.data.sourceName;
            this.model.key = this.data.key;
            this.model.languageName = this.data.targetLanguageName;
            this.model.value = this.data.targetValue;

            this.baseText = this.data.baseValue;
            this.baseLanguage = find(abp.localization.languages, l => l.name === this.data.baseLanguageName);
            this.targetLanguage = find(abp.localization.languages, l => l.name === this.data.targetLanguageName);
        }
    }

    ngOnInit() {
        this.data.buttons = [
            {
                title: this.l('Save'),
                class: 'primary',
                action: this.save.bind(this)
            }
        ];
    }

    save(): void {
        this.saving = true;
        this._languageService.updateLanguageText(this.model)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }

    private findLanguage(name: string): abp.localization.ILanguageInfo {
        return find(abp.localization.languages, l => l.name === name);
    }
}
