/** Application imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    ViewEncapsulation,
    Inject,
    ElementRef
} from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { first, finalize } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { ModuleType, PackageServiceProxy, RecurringPaymentFrequency, PaymentPeriodType,
    TenantSubscriptionServiceProxy, ProductInfo, ProductServiceProxy } from '@shared/service-proxies/service-proxies';
import { StatusInfo } from './models/status-info';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '../localization/app-localization.service';
import { MessageService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';
import { PaymentsInfoService } from '../payments-info/payments-info.service';
import { PaymentWizardPaymentsInfoService } from './payments-info/payments-info.service';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [PaymentService, PackageServiceProxy, ProductServiceProxy, { provide: PaymentsInfoService, useClass: PaymentWizardPaymentsInfoService } ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentWizardComponent {
    @ViewChild('stepper') stepper: MatStepper;
    @ViewChild('wizard') wizardRef: ElementRef;
    plan$: Observable<PaymentOptions> = this.paymentService.plan$;
    packagesConfig$: Observable<ProductInfo[]> = this.paymentService.packagesConfig$;
    paymentStatus: PaymentStatusEnum;
    paymentStatusData: StatusInfo;
    refreshAfterClose = false;
    subscriptionIsDraft: boolean = this.data.subscription && this.data.subscription.statusId == 'D';
    subscriptionIsFree: boolean = this.appService.checkSubscriptionIsFree();
    subscriptionIsTrialExpired: boolean = this.data.subscription && this.data.subscription.statusId == 'A' &&
        this.data.subscription.isTrial && !this.appService.hasModuleSubscription();
    subscriptionIsActiveExpired: boolean = this.data.subscription && !this.data.subscription.isTrial &&
        this.data.subscription.statusId == 'A' && !this.appService.hasModuleSubscription() &&
        this.data.subscription.paymentPeriodType != PaymentPeriodType.OneTime;
    tenantName = this.appSessionService.tenantName;
    productName = this.data.subscription && this.data.subscription.productName;
    cancellationDayCount = this.data.subscription && this.data.subscription.endDate ? 
        this.appService.getGracePeriodDayCountBySubscription(this.data.subscription) : 0;
    isSubscriptionManagementAllowed = this.permissionChecker.isGranted(AppPermissions.AdministrationTenantSubscriptionManagement);
    isSubscriptionPaymentsAllowed = this.permissionChecker.isGranted(AppPermissions.AdministrationTenantSubscriptionManagementPayments);
    trackingCode: string;
    selectedUpgradeProductId: number;
    productsGroupName: string;

    constructor(
        private appService: AppService,
        private appSessionService: AppSessionService,
        private dialogRef: MatDialogRef<PaymentWizardComponent>,
        private paymentService: PaymentService,
        private tenantSubscriptionService: TenantSubscriptionServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private permissionChecker: PermissionCheckerService,
        private messageService: MessageService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    moveToPaymentOptionsStep() {
        if (this.isSubscriptionManagementAllowed)
            this.stepper.next();
        else
            this.messageService.info(this.ls.l('SubscriptionManagementPermissionRequired'));
    }

    changePlan(e) {
        this.paymentService._plan.next(e);
    }

    changeStatus(statusInfo: StatusInfo) {
        this.dialogRef.disableClose = statusInfo.status == PaymentStatusEnum.BeingConfirmed;
        this.paymentStatusData = statusInfo;
    }

    showWebInvoice() {
        let draftSubscription = this.appService.moduleSubscriptions[0];
        let publicId = draftSubscription.invoicePublicId;
        window.location.href = location.origin + `/invoicing/invoice/0/${publicId}`;
    }

    activateSubscription() {
        this.packagesConfig$.pipe(first()).subscribe((products: ProductInfo[]) => {
            let product = products.find(item => item.id == this.data.subscription.productId),
                pricePerMonth = product ? (this.data.subscription.paymentPeriodType === 'Monthly' ?
                    product.productSubscriptionOptions.find(x => x.frequency == RecurringPaymentFrequency.Monthly).fee :
                    Math.round(product.productSubscriptionOptions.find(x => x.frequency == RecurringPaymentFrequency.Annual).fee / 12)
                ) : 0;

            this.changePlan({
                productId: this.data.subscription.productId,
                productName: this.data.subscription.productName,
                paymentPeriodType: this.data.subscription.paymentPeriodType,
                total: pricePerMonth
            });
            setTimeout(() => this.moveToPaymentOptionsStep());
        });
    }

    showSubscriptionProducts(data) {
        this.selectedUpgradeProductId = data && data.upgrade ? data.productId : null;
        this.productsGroupName = data && data.productsGroupName || AppConsts.PRODUCT_GROUP_MAIN;

        this.data.showSubscriptions = false;
        this.changeDetectorRef.detectChanges();
    }

    setRefreshAfterClose() {
        this.refreshAfterClose = true;
        this.dialogRef.afterClosed().subscribe(() => {
            this.reloadAfterClosed();
        });
    }

    reloadAfterClosed() {
        window.location.href = window.location.origin;
    }

    close() {
        this.refreshAfterClose
            ? this.reloadAfterClosed()
            : this.dialogRef.close();
    }

    showSubscriptions() {
        this.data.showSubscriptions = true;
        this.dialogRef.disableClose = false;
        this.changeDetectorRef.detectChanges();
    }
}