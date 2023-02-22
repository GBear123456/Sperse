/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AbpMultiTenancyService } from 'abp-ng2-module';

/** Application imports */
import {
    SecuritySettingsEditDto, TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'security-settings',
    templateUrl: './security-settings.component.html',
    styleUrls: ['./security-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class SecuritySettingsComponent extends SettingsComponentBase {
    securitySettings: SecuritySettingsEditDto;
    isMultiTenancyEnabled: boolean = this.multiTenancyService.isEnabled;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private multiTenancyService: AbpMultiTenancyService,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getSecuritySettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.securitySettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {

        return this.tenantSettingsService.updateSecuritySettings(this.securitySettings);
    }
}