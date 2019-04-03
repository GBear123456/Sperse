import { Component, ViewEncapsulation, ElementRef, EventEmitter, Injector, Output, ViewChild, OnInit } from '@angular/core';
import {
    ApplicationLanguageEditDto,
    ComboboxItemDto,
    CreateOrUpdateLanguageInput,
    LanguageServiceProxy
} from '@shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'createOrEditLanguageModal',
    encapsulation: ViewEncapsulation.None,
    styleUrls: [ '../../../shared/metronic/dropdown-menu.less', './create-or-edit-language-modal.component.less' ],
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
    }

    ngOnInit() {
        this._languageService.getLanguageForEdit(this.data.languageId).subscribe(result => {
            this.selectBoxData = result;
            this.language = result.language;
            this.languageNames = result.languageNames;
            this.flags = result.flags;

            if (!this.data.languageId) {
                this.language.isEnabled = true;
            }
        });
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
