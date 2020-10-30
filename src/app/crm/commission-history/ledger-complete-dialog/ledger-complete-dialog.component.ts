/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { PaymentSystem, RecordEarningsInput, CommissionServiceProxy, CompleteWithdrawalInput,
    PendingCommissionContactInfo } from '@shared/service-proxies/service-proxies';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'ledger-complete-dialog',
    templateUrl: 'ledger-complete-dialog.component.html',
    styleUrls: ['ledger-complete-dialog.component.less']
})
export class LedgerCompleteDialogComponent extends ConfirmDialogComponent {
    paymentSystems = Object.keys(PaymentSystem).map(key => {
        return {
            id: key,
            text: this.ls.l(key)
        };
    });
    paymentSystem = PaymentSystem.PayQuicker;

    constructor(
        injector: Injector,
        public elementRef: ElementRef,
        private notify: NotifyService,
        private loadingService: LoadingService,
        private commissionProxy: CommissionServiceProxy
    ) {
        super(injector);
    }

    confirm() {
        if (this.data.entityIds.length <= 1 || this.data.bulkUpdateAllowed) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('SelectedItemsAction', this.ls.l('Completed')),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.completeWithdrawals(new CompleteWithdrawalInput({
                            withdrawalIds: this.data.entityIds,
                            paymentSystem: PaymentSystem[this.paymentSystem]
                        })).pipe(
                            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
                        ).subscribe(() => {
                            this.notify.success(this.ls.l('AppliedSuccessfully'));
                            this.dialogRef.close();
                        });
                    }
                }, [ ]
            );
        } else
            this.notify.error(this.ls.l('AtLeastOneOfThesePermissionsMustBeGranted', AppPermissions.CRMBulkUpdates));
    }
}