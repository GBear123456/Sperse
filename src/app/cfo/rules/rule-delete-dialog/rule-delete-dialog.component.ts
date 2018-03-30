import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ConfirmDialogComponent } from '@shared/common/dialogs/confirm/confirm-dialog.component';
import * as _ from 'underscore';

@Component({
  selector: 'rule-delete-dialog',
  templateUrl: 'rule-delete-dialog.component.html',
  styleUrls: ['rule-delete-dialog.component.less']
})
export class RuleDeleteDialogComponent extends ConfirmDialogComponent implements OnInit {
    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.reclassify = false;
    }

    confirm($event) {
        this.dialogRef.close(true);
    }
}
