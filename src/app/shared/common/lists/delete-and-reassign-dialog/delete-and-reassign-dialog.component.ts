import { Component, Injector, OnInit } from '@angular/core';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { NotifyService } from 'abp-ng2-module';

@Component({
  selector: 'delete-and-reassign-dialog',
  templateUrl: 'delete-and-reassign-dialog.component.html',
  styleUrls: ['delete-and-reassign-dialog.component.less']
})
export class DeleteAndReassignDialogComponent extends ConfirmDialogComponent implements OnInit {

    constructor(
        injector: Injector,
        private notifyService: NotifyService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.deleteAllReferences = false;
    }

    confirm() {
        if (!this.data.deleteAllReferences && !this.data.reassignToItemId)
            return this.notifyService.error(this.ls.l(this.data.entityPrefix + '_DeleteDialog_ShouldBeSelected'));
        else
            this.dialogRef.close(true);
    }
}
