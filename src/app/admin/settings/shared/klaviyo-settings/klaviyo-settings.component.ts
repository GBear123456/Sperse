/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Link2, AlertCircle, Check } from 'lucide-angular';

/** Application imports */
import {
    KlaviyoSettingsDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'klaviyo-settings',
    templateUrl: './klaviyo-settings.component.html',
    styleUrls: ['../settings-base.less', './klaviyo-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class KlaviyoSettingsComponent extends SettingsComponentBase {
    readonly AlertIcon = AlertCircle
    readonly LinkIcon = Link2;
    readonly CheckIcon = Check;

    klaviyoSettings: KlaviyoSettingsDto = new KlaviyoSettingsDto();

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getKlaviyoSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.klaviyoSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateKlaviyoSettings(this.klaviyoSettings);
    }
}