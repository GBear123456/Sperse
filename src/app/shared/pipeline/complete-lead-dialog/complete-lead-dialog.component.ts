/** Core imports */
import { Component, Injector } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { first, filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { InvoiceSettings } from '@shared/service-proxies/service-proxies';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    selector: 'complete-lead-dialog',
    templateUrl: 'complete-lead-dialog.component.html',
    styleUrls: ['complete-lead-dialog.component.less']
})
export class LeadCompleteDialogComponent extends ConfirmDialogComponent {
    orderStages: any = [];
    orderStageId: number;
    currency = '$';
    comment: string;
    amount: string;

    constructor(
        injector: Injector,
        private invoicesService: InvoicesService
    ) {
        super(injector);

        this.amount = this.data.entity.Amount;
        this.orderStages = this.data.stages.filter((item) => !item['isFinal']);
        this.dialogRef['_overlayRef'].hostElement.classList.add('lead-complete');
        invoicesService.settings$.pipe(filter(Boolean), first()).subscribe((res: InvoiceSettings) =>
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