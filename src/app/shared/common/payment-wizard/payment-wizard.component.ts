/** Application imports */
import { Component, OnInit, ViewChild, ViewEncapsulation, Injector } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MatStepper } from '@angular/material';
import { Observable } from 'rxjs';
import { concatAll, publishReplay, refCount, map, max } from 'rxjs/operators';

/** Application imports */
import { AppService } from '@app/app.service';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { Module, PackageConfigDto, PackageServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from 'shared/common/app-component-base';
import { StatusInfo } from './models/status-info';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService, PackageServiceProxy ]
})
export class PaymentWizardComponent extends AppComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatStepper;
    plan$: Observable<PackageOptions>;
    packages$: Observable<PackageConfigDto[]>;
    packagesMaxUsersAmount$: Observable<number>;
    paymentStatus: PaymentStatusEnum;
    paymentStatusText: string;
    constructor(private injector: Injector,
                private appService: AppService,
                private dialogRef: MatDialogRef<PaymentWizardComponent>,
                private paymentService: PaymentService,
                private packageServiceProxy: PackageServiceProxy
    ) {
        super(injector);
    }


    ngOnInit() {
        this.plan$ = this.paymentService.plan$;
        /** get packages observable but filter free package */
        this.packages$ = this.packageServiceProxy.getPackagesConfig(Module.CRM).pipe(
            publishReplay(),
            refCount(),
            map(packages => packages.filter(packageConfig => packageConfig.name !== 'Free CRM')),
        );
        this.packagesMaxUsersAmount$ = this.packages$.pipe(
            concatAll(),
            map(packages => packages.editions),
            concatAll(),
            map(editions => +editions.features['CRM.MaxUserCount']),
            max()
        );
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
        this.paymentStatus = statusInfo.status;
        if (statusInfo.statusText)
            this.paymentStatusText = statusInfo.statusText;
    }

    close() {
        this.dialogRef.close();
    }
}
