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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { ModuleType, PackageServiceProxy, TenantSubscriptionServiceProxy, ProductServiceProxy } from '@shared/service-proxies/service-proxies';
import { StatusInfo } from './models/status-info';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '../localization/app-localization.service';
import { MessageService } from 'abp-ng2-module';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService, PackageServiceProxy, ProductServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentWizardComponent {
    @ViewChild('stepper') stepper: MatStepper;
    @ViewChild('wizard') wizardRef: ElementRef;
    plan$: Observable<PaymentOptions> = this.paymentService.plan$;
    paymentStatus: PaymentStatusEnum;
    paymentStatusData: StatusInfo;
    refreshAfterClose = false;
    module: ModuleType = this.data.module;
    subscriptionIsDraft: boolean = this.appService.moduleSubscriptions.length && 
        this.appService.moduleSubscriptions.every(sub => sub.statusId == 'D');
    subscriptionIsFree: boolean = this.appService.checkSubscriptionIsFree(this.module);
    trackingCode: string;

    constructor(
        private appService: AppService,
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
        if (this.permissionChecker.isGranted(AppPermissions.AdministrationTenantSubscriptionManagement))
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

    processPayment() {
        let draftSubscription = this.appService.moduleSubscriptions[0];
        this.tenantSubscriptionService.requestStripePaymentForInvoice(
            draftSubscription.invoiceId
        ).subscribe((response) => {
            window.location.href = response.paymentLink;
        });
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
}
