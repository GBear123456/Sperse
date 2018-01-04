import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  templateUrl: 'confirm-dialog.component.html',
  styleUrls: ['confirm-dialog.component.less']
})
export class ConfirmDialogComponent extends AppComponentBase {
    public data: any;
    public dialogRef: MatDialogRef<ConfirmDialogComponent>;

    constructor(
      injector: Injector
    ) { 
      super(injector);

      this.data = injector.get(MAT_DIALOG_DATA);
      this.dialogRef = injector.get(MatDialogRef);

      this.localizationSourceName = this.data.localization;
    }
}