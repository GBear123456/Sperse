/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    YTelSettingsEditDto, TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@root/shared/AppConsts';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'ytel-settings',
    templateUrl: './ytel-settings.component.html',
    styleUrls: ['./ytel-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class YTelSettingsComponent extends SettingsComponentBase {
    isInboundOutboundSMSEnabled: boolean = abp.features.isEnabled(AppFeatures.InboundOutboundSMS);
    yTelSettings: YTelSettingsEditDto = new YTelSettingsEditDto();

    masks = AppConsts.masks;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        if (this.isInboundOutboundSMSEnabled) {
            this.tenantSettingsService.getYTelSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.yTelSettings = res;
                    this.changeDetection.detectChanges();
                })
        }
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateYTelSettings(this.yTelSettings);
    }

    getYtelInboundSMSUrl(): string {
        let key = this.yTelSettings.inboundSmsKey || '{inbound_sms_key}';
        let tenantParam = this.appSession.tenantId || '';
        return AppConsts.remoteServiceBaseUrl + `/api/YTel/ProcessInboundSms?tenantId=${tenantParam}&key=${key}`;
    }
}