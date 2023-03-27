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
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
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
    moduleSubscriptions = this.getDistinctList(this.appService.moduleSubscriptions).filter(item => item.statusId != 'D');
    @Output() onShowProducts: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        public appService: AppService,
        public paymentService: PaymentService,
        private dialog: MatDialog,
        private subscriptionProxy: TenantSubscriptionServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    getDistinctList(list) {
        let flags = [], output = [];
        for (let i = 0; i < list.length; i++)
            if (!flags[list[i].id]) {
                flags[list[i].id] = true;
                output.push(list[i]);
            }
        return output;
    }

    isExpired(cell) {
        return (cell.data.paymentPeriodType != PaymentPeriodType.LifeTime || cell.data.isTrial == 'true') &&
            cell.data.endDate && moment(cell.data.endDate).diff(moment(), 'minutes') <= 0;
    }

    showOneTimeActivate(data) {
        return data.statusId == 'A' && data.paymentPeriodType == PaymentPeriodType.OneTime &&
            !this.moduleSubscriptions.some(sub => sub.productGroup && sub.productGroup.toLowerCase() == AppConsts.PRODUCT_GROUP_MAIN && sub.statusId == 'A');
    }

    showUpgradeButton(data) {
        return data.statusId == 'A' && data.isUpgradable;
    }

    upgradeSubscription(data) {
        let params;
        if (!this.showOneTimeActivate(data)) {
            params = { upgrade: true, productId: data.productId };
        }

        this.onShowProducts.emit(params);
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
                        setTimeout(() => location.reload(), 1000);
                    });
            }
        });
    }

    showAddOnProducts() {
        this.onShowProducts.emit({ productsGroupName: AppConsts.PRODUCT_GROUP_ADD_ON });
    }
}