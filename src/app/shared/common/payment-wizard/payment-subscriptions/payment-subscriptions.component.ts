/** Core imports */
import { 
    Component,     
    ChangeDetectionStrategy,
    ChangeDetectorRef, 
    EventEmitter,
    Injector,
    Output
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import * as moment from 'moment-timezone';
import { 
    PaymentPeriodType,
    CancelSubscriptionInput, 
    TenantSubscriptionServiceProxy 
} from '@shared/service-proxies/service-proxies';
import { CancelSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/cancel-subscription-dialog/cancel-subscription-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'payment-subscriptions',
    templateUrl: './payment-subscriptions.component.html',
    styleUrls: ['./payment-subscriptions.component.less'],
    providers: [TenantSubscriptionServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSubscriptionsComponent extends AppComponentBase {
    formatting = AppConsts.formatting;
    moduleSubscriptions = this.getDistinctList(this.appService.moduleSubscriptions);
    @Output() onShowProducts: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        public appService: AppService,
        private dialog: MatDialog,
        private subscriptionProxy: TenantSubscriptionServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    getDistinctList(list) {
        let flags = [], output = [];
        for(let i = 0; i < list.length; i++)
            if (!flags[list[i].id]) {
                flags[list[i].id] = true;
                output.push(list[i]);
            }
        return output;
    }

    isExpired(cell) {
        return moment(cell.data.endDate).diff(moment(), 'minutes') <= 0;
    }

    isOneTime(cell) {
        return cell.data.statusId == 'A' && cell.data.paymentPeriodType == PaymentPeriodType.OneTime && !this.isExpired(cell);
    }

    activateSubscription(data) {
        this.onShowProducts.emit();
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
                    .cancelSubscription(new CancelSubscriptionInput({
                        id: data.id,
                        cancellationReason: result.cancellationReason
                    })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
                        data.statusId = 'C';
                        abp.notify.success(this.l('Cancelled'));
                        this.changeDetectionRef.detectChanges();
                    });
            }
        });
    }
}