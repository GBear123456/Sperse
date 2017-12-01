import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  templateUrl: 'confirm-dialog.component.html',
  styleUrls: ['confirm-dialog.component.less']
})
export class ConfirmDialogComponent extends AppComponentBase {
  constructor(
    injector: Injector,
    @Inject(MD_DIALOG_DATA) public data: any,
    public dialogRef: MdDialogRef<ConfirmDialogComponent>,
  ) { 
    super(injector, data.localization);
  }
}