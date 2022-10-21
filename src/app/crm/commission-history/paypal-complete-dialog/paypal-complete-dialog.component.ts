/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from 'abp-ng2-module';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { PaymentSystem, CommissionServiceProxy,
    CompleteWithdrawalInput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'paypal-complete-dialog',
    templateUrl: 'paypal-complete-dialog.component.html',
    styleUrls: ['paypal-complete-dialog.component.less']
})
export class PayPalCompleteDialogComponent extends ConfirmDialogComponent {
    totalAmount = this.data.entities.reduce((acc, entity) => acc + entity.TotalAmount, 0);
    paymentSystem = PaymentSystem.PayPal;
    payDate: Date = DateHelper.addTimezoneOffset(new Date(), true);
    paymentNote: string;

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
        if (this.data.entities.length <= 1 || this.data.bulkUpdateAllowed) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('SelectedItemsAction', this.ls.l('Completed')),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.completeWithdrawals(new CompleteWithdrawalInput({
                            isManualPayment: false,
                            paymentNote: this.paymentNote,
                            withdrawalIds: this.data.entities.map(item => item.Id),
                            paymentSystem: PaymentSystem[this.paymentSystem],
                            payDate: DateHelper.removeTimezoneOffset(this.payDate, true, undefined)
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