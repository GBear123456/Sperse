/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';

/** Application imports */
import {
    UpdateInvoiceStatusInput,
    InvoiceServiceProxy,
    InvoiceSettings,
    InvoiceStatus
} from '@shared/service-proxies/service-proxies';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettings> = new ReplaySubject<any>(1);
    settings$: Observable<InvoiceSettings> = this.settings.asObservable();

    constructor(
        private invoiceProxy: InvoiceServiceProxy,
        private permissionService: AppPermissionService
    ) {
        this.invalidateSettings();
    }

    invalidateSettings(settings?) {
        if (settings)
            this.settings.next(settings);
        else if (this.permissionService.isGranted(AppPermissions.CRMOrdersInvoices))
            this.invoiceProxy.getSettings().subscribe(res => {
                this.settings.next(res);
            });
    }

    updateStatus(invoiceId: number, status: InvoiceStatus) {
        return this.invoiceProxy.updateStatus(new UpdateInvoiceStatusInput({
            id: invoiceId,
            status: InvoiceStatus[status]
        }));
    }
}
