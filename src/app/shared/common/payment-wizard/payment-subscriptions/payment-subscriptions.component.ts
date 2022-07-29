/** Core imports */
import { 
    Component,     
    ChangeDetectionStrategy,
    ChangeDetectorRef, 
    Injector
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { 
    CancelOrderSubscriptionInput, 
    OrderSubscriptionServiceProxy 
} from '@shared/service-proxies/service-proxies';
import { CancelSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/cancel-subscription-dialog/cancel-subscription-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'payment-subscriptions',
    templateUrl: './payment-subscriptions.component.html',
    styleUrls: ['./payment-subscriptions.component.less'],
    providers: [OrderSubscriptionServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSubscriptionsComponent extends AppComponentBase {
    formatting = AppConsts.formatting;

    constructor(
        injector: Injector,
        public appService: AppService,
        private dialog: MatDialog,
        private subscriptionProxy: OrderSubscriptionServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    cancelSubscription(data) {
        this.dialog.open(CancelSubscriptionDialogComponent, {
            width: '400px',
            data: {
                title: this.l('CancelBillingConfirm')
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.startLoading();
                this.subscriptionProxy
                    .cancel(new CancelOrderSubscriptionInput({
                        subscriptionId: data.id,
                        cancelationReason: result.cancellationReason
                    })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
                        data.statusId = 'C';
                        abp.notify.success(this.l('Cancelled'));
                        this.changeDetectionRef.detectChanges();
                    });
            }
        });
    }
}