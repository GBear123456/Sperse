/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';

/** Application imports */
import {
    UpdateInvoiceStatusInput,
    InvoiceServiceProxy,
    InvoiceSettings,
    InvoiceStatus,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettings> = new ReplaySubject<any>(1);
    settings$: Observable<InvoiceSettings> = this.settings.asObservable();

    constructor(
        private invoiceProxy: InvoiceServiceProxy,
        private permissionService: AppPermissionService,
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy
    ) {
        this.invalidateSettings();
    }

    invalidateSettings(settings?) {
        this.settings.next(settings);
        if (!settings && (
            this.permissionService.isGranted(AppPermissions.CRMOrdersInvoices) ||
            this.permissionService.isGranted(AppPermissions.CRMSettingsConfigure)
        ))
            this.tenantPaymentSettingsProxy.getInvoiceSettings().subscribe(res => {
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
}