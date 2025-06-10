/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    OngageSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'ongage-settings',
    templateUrl: './ongage-settings.component.html',
    styleUrls: ['./ongage-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class OngageSettingsComponent extends SettingsComponentBase {
    ongageSettings: OngageSettingsEditDto = new OngageSettingsEditDto();

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getOngageSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.ongageSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateOngageSettings(this.ongageSettings);
    }
}