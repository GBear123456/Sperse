import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  templateUrl: 'confirm-dialog.component.html',
  styleUrls: ['confirm-dialog.component.less']
})
export class ConfirmDialogComponent extends AppComponentBase {
    public data: any;
    public dialogRef: MatDialogRef<ConfirmDialogComponent, any>;

    constructor(
      injector: Injector
    ) {
      super(injector);

      this.data = injector.get(MAT_DIALOG_DATA);
      this.dialogRef = <any>injector.get(MatDialogRef);

      this.localizationSourceName = this.data.localization;
    }
}
