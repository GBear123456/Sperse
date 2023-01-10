/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    EPCVIPOfferProviderSettings,
    TenantOfferProviderSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'epcvip-link-settings',
    templateUrl: './epcvip-link-settings.component.html',
    styleUrls: ['./epcvip-link-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantOfferProviderSettingsServiceProxy]
})
export class EpcvipLinkSettingsComponent extends SettingsComponentBase {
    epcvipSettings: EPCVIPOfferProviderSettings = new EPCVIPOfferProviderSettings();

    constructor(
        _injector: Injector,
        private tenantOfferProviderSettingsService: TenantOfferProviderSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantOfferProviderSettingsService.getEPCVIPOfferProviderSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.epcvipSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantOfferProviderSettingsService.updateEPCVIPOfferProviderSettings(this.epcvipSettings);
    }
}