/** Core imports */
import { Component, Injector } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { SettingsHelper } from '@shared/common/settings/settings.helper';

@Component({
    selector: 'complete-lead-dialog',
    templateUrl: 'complete-lead-dialog.component.html',
    styleUrls: ['complete-lead-dialog.component.less']
})
export class LeadCompleteDialogComponent extends ConfirmDialogComponent {
    orderStages: any = [];
    orderStageId: number;
    currency = '';
    comment: string;
    amount: string;

    constructor(
        injector: Injector
    ) {
        super(injector);

        this.amount = this.data.entity.Amount;
        this.orderStages = this.data.stages.filter((item) => !item['isFinal']);
        this.dialogRef['_overlayRef'].hostElement.classList.add('lead-complete');
        this.currency = getCurrencySymbol(this.data.entity.CurrencyId || SettingsHelper.getCurrency(), 'narrow');
    }

    confirm() {
        this.dialogRef.close({
            amount: this.amount,
            comment: this.comment,
            orderStageId: this.orderStageId
        });
    }
}