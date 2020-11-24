import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditTypeItemDialogData } from '@app/crm/shared/types-dropdown/edit-type-item-dialog/edit-type-item-dialog-data.interface';

@Component({
    selector: 'edit-type-item-dialog',
    templateUrl: 'edit-type-item-dialog.component.html',
    styleUrls: [ 'edit-type-item-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTypeItemDialogComponent {
    constructor(
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: EditTypeItemDialogData
    ) {}
}