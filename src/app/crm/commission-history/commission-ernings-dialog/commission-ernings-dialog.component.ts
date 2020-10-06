/** Core imports */
import { Component, Injector } from '@angular/core';

/** Third party imports */
import { first } from 'rxjs/operators';

/** Application imports */
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';

@Component({
    selector: 'commission-ernings-dialog',
    templateUrl: 'commission-ernings-dialog.component.html',
    styleUrls: ['commission-ernings-dialog.component.less']
})
export class CommissionErningsDialogComponent extends ConfirmDialogComponent {
    contacts: any = [];
    contactId: number;

    dateRange = {
        from: Date,
        to: Date
    };

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    confirm() {
    }
}