/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    AIIntegrationSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'ai-integration-settings',
    templateUrl: './ai-integration-settings.component.html',
    styleUrls: ['./ai-integration-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class AIIntegrationSettingsComponent extends SettingsComponentBase {
    aiIntegrationSettings: AIIntegrationSettingsEditDto;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getAIIntegrationSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.aiIntegrationSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateAIIntegrationSettings(this.aiIntegrationSettings);
    }
}