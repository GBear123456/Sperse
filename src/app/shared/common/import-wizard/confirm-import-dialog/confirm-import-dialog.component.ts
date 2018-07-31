import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'confirm-import-dialog',
    templateUrl: 'confirm-import-dialog.component.html',
    styleUrls: ['confirm-import-dialog.component.less']
})
export class ConfirmImportDialog extends AppComponentBase {
    public data: any;
    public dialogRef: MatDialogRef<ConfirmImportDialog, any>;

    constructor(
        injector: Injector
    ) {
        super(injector);

        this.data = injector.get(MAT_DIALOG_DATA);
        this.dialogRef = <any>injector.get(MatDialogRef);

        this.localizationSourceName = this.data.localization;
    }
}
