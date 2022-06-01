/** Core imports */
import {
    Component,
    Input,
    HostListener,
    OnDestroy
} from '@angular/core';

/** Third party imports */
import { tap } from 'rxjs/operators';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { TenantCRMIntegrationSettingsServiceProxy, SalesTalkSettings, 
    SalesTalkSettingsInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'sales-talk',
    templateUrl: './sales-talk.component.html',
    styleUrls: ['./sales-talk.component.less'],
    providers: [TenantCRMIntegrationSettingsServiceProxy]
})
export class SalesTalkComponent {
    urlRegexPattern = AppConsts.regexPatterns.url;

    isEnabled: boolean;
    apiKey: string;
    url: string;

    constructor(
        private appSession: AppSessionService,
        private settingsProxy: TenantCRMIntegrationSettingsServiceProxy,
        public ls: AppLocalizationService
    ) {
        this.settingsProxy.getSalesTalkSettings().subscribe((data: SalesTalkSettings) => {
            this.isEnabled = data.isEnabled;
            this.apiKey = data.apiKey;
            this.url = data.url;
        });
    }

    save() {
        return this.settingsProxy.updateSalesTalkSettings(new SalesTalkSettingsInput({
            isEnabled: this.isEnabled,
            apiKey: this.apiKey,
            url: this.url
        })).pipe(tap(() => {
            sessionStorage.removeItem('salesTalkApiLink' + this.appSession.tenantId);
        }));
    }
}