/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    TenantSettingsServiceProxy, TrackingToolsSettingsDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'tracking-tools-settings',
    templateUrl: './tracking-tools-settings.component.html',
    styleUrls: ['./tracking-tools-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class TrackingToolsSettingsComponent extends SettingsComponentBase {
    trackingToolsSettings: TrackingToolsSettingsDto = new TrackingToolsSettingsDto();

    scrollableAreaHeight = `calc(100vh - ${this.layoutService.showTopBar ? 260 : 185}px`;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getTrackingToolsSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.trackingToolsSettings = res;
                this.changeDetection.detectChanges();
            })
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateTrackingToolsSettings(this.trackingToolsSettings);
    }
}