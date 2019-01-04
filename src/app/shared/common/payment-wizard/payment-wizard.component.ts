/** Application imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    Injector,
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
import { Module, PackageServiceProxy, TenantSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from 'shared/common/app-component-base';
import { StatusInfo } from './models/status-info';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService, PackageServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentWizardComponent extends AppComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatStepper;
    @ViewChild('wizard') wizardRef: ElementRef;
    plan$: Observable<PackageOptions>;
    paymentStatus: PaymentStatusEnum;
    paymentStatusData: StatusInfo;
    refreshAfterClose = false;
    module: Module;
    subscriptionIsLocked: boolean;
    subscriptionIsFree: boolean;
    trackingCode: string;

    constructor(private injector: Injector,
                private appService: AppService,
                private dialogRef: MatDialogRef<PaymentWizardComponent>,
                private paymentService: PaymentService,
                private tenantSubscriptionService: TenantSubscriptionServiceProxy,
                private changeDetectorRef: ChangeDetectorRef,
                @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
        this.module = data.module;
    }

    ngOnInit() {
        this.plan$ = this.paymentService.plan$;
        this.subscriptionIsLocked = this.appService.subscriptionIsLocked(this.module);
        this.subscriptionIsFree = this.appService.checkSubscriptionIsFree(this.module);
        if (this.subscriptionIsLocked) {
            this.trackingCode = this.appService.getSubscriptionTrackingCode(this.module);
        }
    }

    moveToPaymentOptionsStep() {
        if (this.permission.isGranted('Pages.Administration.Tenant.SubscriptionManagement'))
            this.stepper.next();
        else
            this.message.info(this.l('SubscriptionManagmentPermissionRequired'));
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
                                          this.appService.loadModeuleSubscriptions();
                                          this.changeDetectorRef.detectChanges();
                                      });
    }

    close() {
        this.refreshAfterClose
            ? window.location.reload()
            : this.dialogRef.close();
    }
}
