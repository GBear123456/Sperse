/** Core imports */
import { Component, Injector, ViewChild } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';
import { first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

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
    currency: string;
    comment: string;
    amount: string;

    constructor(injector: Injector,
        private invoicesService: InvoicesService
    ) {
        super(injector);

        this.orderStages = this.data.stages.filter((item) => !item['isFinal']);
        this.orderStageId = _.findWhere(this.orderStages, {sortOrder: 0}).id;
        this.dialogRef['_overlayRef'].hostElement.classList.add('lead-complete');
        invoicesService.settings$.pipe(first()).subscribe(res => 
            this.currency = getCurrencySymbol(res.currency, 'wide'));
    }

    confirm() {
        this.dialogRef.close({
            amount: this.amount,
            comment: this.comment,
            orderStageId: this.orderStageId
        });
    }
}