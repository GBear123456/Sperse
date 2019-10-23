/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';

/** Application imports */
import {
    InvoiceServiceProxy,
    InvoiceSettings,
} from '@shared/service-proxies/service-proxies';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettings> = new ReplaySubject<any>(1); 
    settings$: Observable<InvoiceSettings> = this.settings.asObservable();

    constructor(
        private invoiceProxy: InvoiceServiceProxy
    ) {
        this.invalidateSettings();
    }

    invalidateSettings(settings?) {
        if (settings)
            this.settings.next(settings);
        else 
            this.invoiceProxy.getSettings().subscribe(res => {
                this.settings.next(res);
            });
    }
}
