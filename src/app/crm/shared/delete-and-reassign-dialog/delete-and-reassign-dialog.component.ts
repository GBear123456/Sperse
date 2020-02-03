import { Component, Injector, OnInit, ViewChild } from '@angular/core';

import { DxRadioGroupComponent } from 'devextreme-angular/ui/radio-group';

import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { AdAutoLoginHostDirective } from '../../../../account/auto-login/auto-login.component';

@Component({
  selector: 'delete-and-reassign-dialog',
  templateUrl: 'delete-and-reassign-dialog.component.html',
  styleUrls: ['delete-and-reassign-dialog.component.less']
})
export class DeleteAndReassignDialogComponent extends ConfirmDialogComponent implements OnInit {
    @ViewChild(DxRadioGroupComponent, { static: true }) itemsList: DxRadioGroupComponent;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.deleteAllReferences = false;
    }

    confirm() {
        if (!this.data.deleteAllReferences && !this.data.reassignToItemId) {
            return this.notify.error(this.l(this.data.entityPrefix + '_DeleteDialog_ShouldBeSelected'));
        }
        this.dialogRef.close(true);
    }
}
