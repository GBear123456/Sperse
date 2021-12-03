/** Application imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
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
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { ModuleType, PackageServiceProxy, TenantSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { StatusInfo } from './models/status-info';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module/dist/src/auth/permission-checker.service';
import { AppLocalizationService } from '../localization/app-localization.service';
import { MessageService } from 'abp-ng2-module/dist/src/message/message.service';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService, PackageServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentWizardComponent implements OnInit {
    @ViewChild('stepper', { static: false }) stepper: MatStepper;
    @ViewChild('wizard', { static: false }) wizardRef: ElementRef;
    plan$: Observable<PackageOptions> = this.paymentService.plan$;
    paymentStatus: PaymentStatusEnum;
    paymentStatusData: StatusInfo;
    refreshAfterClose = false;
    module: ModuleType = this.data.module;
    subscriptionIsLocked: boolean = this.appService.subscriptionIsLocked(this.module) && 
        this.appService.getModuleSubscription(this.module).statusId != 'C';
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

    ngOnInit() {
        if (this.subscriptionIsLocked) {
            this.trackingCode = this.appService.getSubscriptionTrackingCode(this.module);
        }
    }

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

    rejectPendingPayment() {
        abp.ui.setBusy(this.wizardRef.nativeElement);
        this.tenantSubscriptionService.rejectPendingPayment(<any>this.module)
                                      .pipe(finalize(() => abp.ui.clearBusy(this.wizardRef.nativeElement)))
                                      .subscribe(() => {
                                          this.subscriptionIsLocked = false;
                                          this.appService.loadModuleSubscriptions();
                                          this.changeDetectorRef.detectChanges();
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
