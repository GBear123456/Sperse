/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    EPCVIPMailerSettingsEditDto,
    EPCVIPServer,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'epcvip-email-settings',
    templateUrl: './epcvip-email-settings.component.html',
    styleUrls: ['./epcvip-email-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class EpcvipEmailSettingsComponent extends SettingsComponentBase {
    epcvipEmailSettings: EPCVIPMailerSettingsEditDto = new EPCVIPMailerSettingsEditDto();
    epcvipEmailServers: string[] = Object.keys(EPCVIPServer);

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getEPCVIPMailerSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.epcvipEmailSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateEPCVIPMailerSettings(this.epcvipEmailSettings);
    }
}