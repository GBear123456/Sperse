import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import { DxTreeListComponent, DxRadioGroupComponent } from 'devextreme-angular';

import * as _ from 'underscore';

@Component({
  selector: 'delete-and-reassign-dialog',
  templateUrl: 'delete-and-reassign-dialog.component.html',
  styleUrls: ['delete-and-reassign-dialog.component.less']
})
export class DeleteAndReassignDialogComponent extends ConfirmDialogComponent implements OnInit {
    @ViewChild(DxRadioGroupComponent) itemsList: DxRadioGroupComponent;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.deleteAllReferences = false;
    }
        
    confirm($event) {
        if (!this.data.deleteAllReferences && !this.data.reassignToItemId) {
            return this.notify.error(this.l(this.data.entityPrefix + '_DeleteDialog_ShouldBeSelected'));
        }
        this.dialogRef.close(true);
    }
}