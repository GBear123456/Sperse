/** Core imports */
import { Component, Injector, ElementRef, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import {
    ChangeCreditInput,
    CreditBalanceServiceProxy
} from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'credits-change-dialog',
    templateUrl: 'credits-change-dialog.component.html',
    styleUrls: ['credits-change-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CreditBalanceServiceProxy]
})
export class CreditsChangeDialogComponent extends ConfirmDialogComponent {
    contactId = this.data.contactId;
    isTopUp = this.data.isTopUp;
    amount: number = 1;
    //date: Date = DateHelper.addTimezoneOffset(new Date(), true);
    description: string;

    constructor(
        injector: Injector,
        public elementRef: ElementRef,
        private notify: NotifyService,
        private loadingService: LoadingService,
        private creditBalanceService: CreditBalanceServiceProxy
    ) {
        super(injector);
    }

    confirm() {
        if (!this.amount)
            return;

        this.loadingService.startLoading(this.elementRef.nativeElement);
        let input = new ChangeCreditInput({
            contactId: this.contactId,
            amount: this.amount,
            description: this.description
        });
        let method = this.isTopUp ?
            this.creditBalanceService.topUp(input) :
            this.creditBalanceService.deduct(input);
        method.pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(() => {
            this.notify.success(this.ls.l('AppliedSuccessfully'));
            this.dialogRef.close({
                contactId: this.contactId,
                amount: this.amount
            });
        });
    }
}