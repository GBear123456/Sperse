<<<<<<< HEAD
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    UpdateInvoiceStatusInput,
    InvoiceServiceProxy,
    InvoiceSettingsDto,
    InvoiceStatus,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettingsDto> = new ReplaySubject<any>(1);
    settings$: Observable<InvoiceSettingsDto> = this.settings.asObservable();

    constructor(
        private invoiceProxy: InvoiceServiceProxy,
        private permissionService: AppPermissionService,
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private loadingService: LoadingService,
        private pipelineService: PipelineService
    ) {
        this.invalidateSettings();
    }

    invalidateSettings(settings?) {
        this.settings.next(settings);
        if (!settings && (
            this.permissionService.isGranted(AppPermissions.CRMOrdersInvoices) ||
            this.permissionService.isGranted(AppPermissions.CRMSettingsConfigure)
        ))
            this.tenantPaymentSettingsProxy.getInvoiceSettings(true).subscribe(res => {
                this.settings.next(res);
            });
    }

    updateStatus(invoiceId: number, status: InvoiceStatus, emailId?: number) {
        return this.invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
            id: invoiceId,
            status: InvoiceStatus[status],
            emailId: emailId
        }));
    }

    updateOrderStage(orderId: number, fromStageName: string, toStageName: string): Observable<any> {
        this.loadingService.startLoading();
        return this.pipelineService.updateEntitiesStage(
            AppConsts.PipelinePurposeIds.order,
            [{
                Id: orderId,
                Stage: fromStageName
            }],
            toStageName,
            null
        ).pipe(
            finalize(() => this.loadingService.finishLoading())
        );
    }
=======
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    UpdateInvoiceStatusInput,
    InvoiceServiceProxy,
    InvoiceSettingsDto,
    InvoiceStatus,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettingsDto> = new ReplaySubject<any>(1);
    settings$: Observable<InvoiceSettingsDto> = this.settings.asObservable();

    constructor(
        private invoiceProxy: InvoiceServiceProxy,
        private permissionService: AppPermissionService,
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private loadingService: LoadingService,
        private pipelineService: PipelineService
    ) {
        this.invalidateSettings();
    }

    invalidateSettings(settings?) {
        this.settings.next(settings);
        if (!settings && (
            this.permissionService.isGranted(AppPermissions.CRMOrdersInvoices) ||
            this.permissionService.isGranted(AppPermissions.CRMSettingsConfigure)
        ))
            this.tenantPaymentSettingsProxy.getInvoiceSettings(true).subscribe(res => {
                this.settings.next(res);
            });
    }

    updateStatus(invoiceId: number, status: InvoiceStatus, emailId?: number) {
        return this.invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
            id: invoiceId,
            status: InvoiceStatus[status],
            emailId: emailId
        }));
    }

    updateOrderStage(orderId: number, fromStageName: string, toStageName: string): Observable<any> {
        this.loadingService.startLoading();
        return this.pipelineService.updateEntitiesStage(
            AppConsts.PipelinePurposeIds.order,
            [{
                Id: orderId,
                Stage: fromStageName
            }],
            toStageName,
            null
        ).pipe(
            finalize(() => this.loadingService.finishLoading())
        );
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}