import { Component, Injector, ViewChild } from '@angular/core';

import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';

import * as _ from 'underscore';

import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';


@Component({
    selector: 'complete-lead-dialog',
    templateUrl: 'complete-lead-dialog.component.html',
    styleUrls: ['complete-lead-dialog.component.less']
})
export class LeadCompleteDialogComponent extends ConfirmDialogComponent {
    @ViewChild(DxSelectBoxComponent) stageComponent: DxSelectBoxComponent;
    @ViewChild(DxTextAreaComponent) textComponent: DxTextAreaComponent;
    orderStages: any = [];
    orderStageId: number;
    comment: string;
    amount: string;

    constructor(
        injector: Injector
    ) {
        super(injector);

        this.orderStages = this.data.stages.filter((item) => !item['isFinal']);
        this.orderStageId = _.findWhere(this.orderStages, {sortOrder: 0}).id;
        this.dialogRef['_overlayRef'].hostElement.classList.add('lead-complete');
    }

    confirm() {
        this.dialogRef.close({
            amount: this.amount,
            comment: this.comment,
            orderStageId: this.orderStageId
        });
    }
}