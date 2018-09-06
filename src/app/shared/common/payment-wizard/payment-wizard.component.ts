import { Component, OnInit, ViewChild, ViewEncapsulation, Injector } from '@angular/core';

import { Observable } from 'rxjs';
import { concatAll, map, max } from 'rxjs/operators';

import { MatDialogRef, MatStepper } from '@angular/material';
import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { PaymentStatusEnum } from '@app/shared/common/payment-wizard/models/payment-status.enum';
import { Module, PackageConfigDto, PackageServiceProxy } from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from 'shared/common/app-component-base';

@Component({
    selector: 'payment-wizard',
    templateUrl: './payment-wizard.component.html',
    styleUrls: ['./payment-wizard.component.less'],
    encapsulation: ViewEncapsulation.None,
    providers: [ PaymentService, PackageServiceProxy ]
})
export class PaymentWizardComponent extends AppComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatStepper;
    plan$: Observable<OptionsPaymentPlan>;
    paymentPlans$: Observable<PackageConfigDto[]>;
    paymentPlansMaxUsersAmount$: Observable<number>;
    paymentStatus: PaymentStatusEnum;
    constructor(private injector: Injector,
                private dialogRef: MatDialogRef<PaymentWizardComponent>,
                private paymentService: PaymentService,
                private packageServiceProxy: PackageServiceProxy
    ) {
        super(injector);
    }


    ngOnInit() {
        this.plan$ = this.paymentService.plan$;
        /** get packages observable but filter free package */
        this.paymentPlans$ = this.packageServiceProxy.getPackagesConfig(Module.CRM).pipe(
            map(packages => packages.filter(packageConfig => packageConfig.name !== 'Free CRM'))
        );
        this.paymentPlansMaxUsersAmount$ = this.paymentPlans$.pipe(
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
            this.message.info('SubscriptionManagmentPermissionRequired');
    }

    changePlan(e) {
        this.paymentService._plan.next(e);
    }

    changeStatus(status: PaymentStatusEnum) {
        this.paymentStatus = status;
    }

    close() {
        this.dialogRef.close();
    }
}
