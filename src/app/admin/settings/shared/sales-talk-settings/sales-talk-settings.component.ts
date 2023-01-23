/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

/** Application imports */
import {
    SalesTalkSettingsInput,
    TenantCRMIntegrationSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'sales-talk-settings',
    templateUrl: './sales-talk-settings.component.html',
    styleUrls: ['./sales-talk-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantCRMIntegrationSettingsServiceProxy]
})
export class SalesTalkSettingsComponent extends SettingsComponentBase {
    urlRegexPattern = AppConsts.regexPatterns.url;

    isEnabled: boolean;
    apiKey: string;
    url: string;

    constructor(
        _injector: Injector,
        private settingsProxy: TenantCRMIntegrationSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.settingsProxy.getSalesTalkSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(data => {
                this.isEnabled = data.isEnabled;
                this.apiKey = data.apiKey;
                this.url = data.url;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.settingsProxy.updateSalesTalkSettings(new SalesTalkSettingsInput({
            isEnabled: this.isEnabled,
            apiKey: this.apiKey,
            url: this.url
        })).pipe(tap(() => {
            sessionStorage.removeItem('salesTalkApiLink' + this.appSession.tenantId);
        }));
    }
}