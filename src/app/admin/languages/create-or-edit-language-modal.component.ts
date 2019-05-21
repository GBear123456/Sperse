/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Inject,
    OnInit,
    Output,
    ChangeDetectorRef,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    ApplicationLanguageEditDto,
    ComboboxItemDto,
    CreateOrUpdateLanguageInput,
    LanguageServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'createOrEditLanguageModal',
    styleUrls: [
        './create-or-edit-language-modal.component.less',
        '../../../shared/metronic/m-checkbox.less'
    ],
    templateUrl: './create-or-edit-language-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditLanguageModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    selectBoxData: any;
    active = false;
    language: ApplicationLanguageEditDto = new ApplicationLanguageEditDto();
    languageNames: ComboboxItemDto[] = [];
    flags: ComboboxItemDto[] = [];
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    title: string;

    constructor(
        private _languageService: LanguageServiceProxy,
        public ls: AppLocalizationService,
        private _dialogRef: MatDialogRef<CreateOrEditLanguageModalComponent>,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this._languageService.getLanguageForEdit(this.data.languageId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.selectBoxData = result;
                this.languageNames = result.languageNames;
                this.language = result.language;
                this.flags = result.flags;
                this.flags.push(
                    new ComboboxItemDto({'value': 'famfamfam-flags england', 'displayText': 'en', 'isSelected': false})
                );
                this.title = this.language.name ? this.ls.l('EditLanguage') + ': ' + this.language.name : this.ls.l('CreateNewLanguage');
                if (!this.data.languageId) {
                    this.language.isEnabled = true;
                }
                if (this.language && this.language.name) {
                    this.language.name = this.language.name.split('-').shift();
                }
                this._changeDetectorRef.detectChanges();
            });
    }

    save(): void {
        this.modalDialog.startLoading();
        this.language && this._languageService.createOrUpdateLanguage(CreateOrUpdateLanguageInput.fromJS({
            language: this.language
        }))
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this._dialogRef.close();
    }
}
