/** Application imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, ViewEncapsulation, Injector, Inject } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef, MatStepper } from '@angular/material';
import { Observable } from 'rxjs';

/** Application imports */
import { AppService } from '@app/app.service';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { Module, PackageServiceProxy } from '@shared/service-proxies/service-proxies';
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
    plan$: Observable<PackageOptions>;
    paymentStatus: PaymentStatusEnum;
    paymentStatusData: StatusInfo;
    module: Module;
    constructor(private injector: Injector,
                private appService: AppService,
                private dialogRef: MatDialogRef<PaymentWizardComponent>,
                private paymentService: PaymentService,
                @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
        this.module = data.module;
    }

    ngOnInit() {
        this.plan$ = this.paymentService.plan$;
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
        if (statusInfo.status == PaymentStatusEnum.Confirmed)
            this.appService.loadModeuleSubscriptions();

        this.paymentStatusData = statusInfo;
    }

    close() {
        this.dialogRef.close();
    }
}
