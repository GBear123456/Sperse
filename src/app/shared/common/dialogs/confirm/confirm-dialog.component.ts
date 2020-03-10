import { Component, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppLocalizationService } from '../../localization/app-localization.service';

@Component({
    selector: 'confirm-dialog',
    templateUrl: 'confirm-dialog.component.html',
    styleUrls: ['confirm-dialog.component.less']
})
export class ConfirmDialogComponent {
    public data: any;
    public dialogRef: MatDialogRef<ConfirmDialogComponent, any>;
    public ls: AppLocalizationService;

    constructor(
        injector: Injector
    ) {
        this.data = injector.get(MAT_DIALOG_DATA);
        this.ls = injector.get(AppLocalizationService);
        this.dialogRef = <any>injector.get(MatDialogRef);
    }
}
