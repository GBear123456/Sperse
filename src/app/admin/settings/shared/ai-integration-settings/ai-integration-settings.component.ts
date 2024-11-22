/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    AIIntegrationSettingsEditDto,
    AIServiceProxy,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'ai-integration-settings',
    templateUrl: './ai-integration-settings.component.html',
    styleUrls: ['./ai-integration-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy, AIServiceProxy]
})
export class AIIntegrationSettingsComponent extends SettingsComponentBase {
    aiIntegrationSettings: AIIntegrationSettingsEditDto;
    openAIModels: string[] = [];
    showOpenAIModels: boolean = false;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private aiService: AIServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings() {
        this.startLoading();
        this.tenantSettingsService.getAIIntegrationSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.aiIntegrationSettings = res;
                this.checkShowOpenAIModels();
                this.changeDetection.detectChanges();
            });
    }

    checkShowOpenAIModels() {
        this.showOpenAIModels = !!this.aiIntegrationSettings.openAIApiKey;
        if (this.showOpenAIModels && !this.openAIModels.length) {
            if (this.aiIntegrationSettings.openAIModel)
                this.openAIModels = [this.aiIntegrationSettings.openAIModel];
            this.getOpenAIModels();
        }
        this.changeDetection.detectChanges();
    }

    getOpenAIModels() {
        this.aiService.getOpenAIModels()
            .subscribe(res => {
                this.openAIModels = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateAIIntegrationSettings(this.aiIntegrationSettings);
    }

    afterSave() {
        this.checkShowOpenAIModels();
    }
}