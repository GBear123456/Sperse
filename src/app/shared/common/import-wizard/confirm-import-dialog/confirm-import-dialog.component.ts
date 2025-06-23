import { Component, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'confirm-import-dialog',
    templateUrl: 'confirm-import-dialog.component.html',
    styleUrls: ['confirm-import-dialog.component.less']
})
export class ConfirmImportDialog {
    public data: any;
    public dialogRef: MatDialogRef<ConfirmImportDialog, any>;

    constructor(
        injector: Injector,
        public ls: AppLocalizationService
    ) {
        this.data = injector.get(MAT_DIALOG_DATA);
        this.dialogRef = <any>injector.get(MatDialogRef);
    }
}
