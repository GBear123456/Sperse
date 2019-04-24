/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Inject,
    OnInit,
    Output,
    ChangeDetectorRef
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

@Component({
    selector: 'createOrEditLanguageModal',
    styleUrls: [
        './create-or-edit-language-modal.component.less'
    ],
    templateUrl: './create-or-edit-language-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditLanguageModalComponent implements OnInit {
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
        this._languageService.getLanguageForEdit(this.data.languageId)
            .pipe(finalize(() => this._changeDetectorRef.detectChanges()))
            .subscribe(result => {
                this.selectBoxData = result;
                this.languageNames = result.languageNames;
                this.language = result.language;
                this.flags = result.flags;
                this.title = this.language.name ? this.ls.l('EditLanguage') + ': ' + this.language.name : this.ls.l('CreateNewLanguage');
                if (!this.data.languageId) {
                    this.language.isEnabled = true;
                }
            });
    }

    save(): void {
        this.language && this._languageService.createOrUpdateLanguage(CreateOrUpdateLanguageInput.fromJS({
            language: this.language
        })).subscribe(() => {
            this._notifyService.info(this.ls.l('SavedSuccessfully'));
            this.close();
            this.modalSave.emit(null);
        });
    }

    close(): void {
        this._dialogRef.close();
    }
}
