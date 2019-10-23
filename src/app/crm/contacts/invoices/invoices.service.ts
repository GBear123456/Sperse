/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceServiceProxy,
    InvoiceSettingsInfoDto,
} from '@shared/service-proxies/service-proxies';

@Injectable()
export class InvoicesService {
    private settings: ReplaySubject<InvoiceSettingsInfoDto> = new ReplaySubject<any>(1); 
    settings$: Observable<InvoiceSettingsInfoDto> = this.settings.asObservable();

    constructor(injector: Injector,
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