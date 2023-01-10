/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Third party imports */
import { Observable, forkJoin } from 'rxjs';

/** Application imports */
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    SecuritySettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { AppService } from '@app/app.service';

@Component({
    selector: 'security',
    templateUrl: 'security.component.html',
    styleUrls: [ '../shared/styles/common.less', 'security.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityComponent implements ITenantSettingsStepComponent {
    @Input() securitySettings: SecuritySettingsEditDto;
    isMultiTenancyEnabled: boolean = this.multiTenancyService.isEnabled;
    isHost: boolean = this.appService.isHostTenant;

    constructor(
        private appService: AppService,
        private multiTenancyService: AbpMultiTenancyService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<void> {
        return this.tenantSettingsServiceProxy.updateSecuritySettings(this.securitySettings);
    }
}