/** Core imports */
import { Component, ElementRef, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';
/** Third party imports */
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
/** Application imports */
import {
    ApplicationLanguageEditDto,
    ComboboxItemDto,
    CreateOrUpdateLanguageInput,
    LanguageServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'createOrEditLanguageModal',
    styleUrls: [
        './create-or-edit-language-modal.component.less'
    ],
    templateUrl: './create-or-edit-language-modal.component.html'
})
export class CreateOrEditLanguageModalComponent extends AppModalDialogComponent implements OnInit {
    @ViewChild('languageCombobox') languageCombobox: ElementRef;
    @ViewChild('iconCombobox') iconCombobox: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    selectBoxData: any;
    active = false;
    saving = false;
    data: any;
    language: ApplicationLanguageEditDto = new ApplicationLanguageEditDto();
    languageNames: ComboboxItemDto[] = [];
    flags: ComboboxItemDto[] = [];

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy
    ) {
        super(injector);
        this.data = injector.get(MAT_DIALOG_DATA);
        this._languageService.getLanguageForEdit(this.data.languageId).subscribe(result => {
            this.selectBoxData = result;
            this.languageNames = result.languageNames;
            this.language = result.language;
            this.flags = result.flags;
            this.flags.push(
                new ComboboxItemDto({'value': 'famfamfam-flags england', 'displayText': 'en', 'isSelected': false})
            );
            this.data.title = this.language.name ? this.l('EditLanguage') + ': ' + this.language.name : this.l('CreateNewLanguage');

            if (!this.data.languageId) {
                this.language.isEnabled = true;
            }

            if (this.language && this.language.name) {
                this.language.name = this.language.name.split('-').shift();
            }
        });
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
        this.language && this._languageService.createOrUpdateLanguage(CreateOrUpdateLanguageInput.fromJS({
            language: this.language
        }))
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
}
