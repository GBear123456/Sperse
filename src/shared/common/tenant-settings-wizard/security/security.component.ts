/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Third party imports */
import { Observable, forkJoin } from 'rxjs';

/** Application imports */
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    PasswordComplexitySettingsEditDto,
    TenantSettingsServiceProxy,
    TwoFactorLoginSettingsEditDto,
    UserLockOutSettingsEditDto
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
    @Input() passwordComplexitySettings: PasswordComplexitySettingsEditDto;
    @Input() userLockOutSettings: UserLockOutSettingsEditDto;
    @Input() twoFactorLoginSettings: TwoFactorLoginSettingsEditDto;
    isMultiTenancyEnabled: boolean = this.multiTenancyService.isEnabled;
    isHost: boolean = this.appService.isHostTenant;

    constructor(
        private appService: AppService,
        private multiTenancyService: AbpMultiTenancyService,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public ls: AppLocalizationService
    ) {}

    save(): Observable<[void, void, void]> {
        return forkJoin(
            this.tenantSettingsServiceProxy.updatePasswordComplexitySettings(
                this.passwordComplexitySettings.isDefaultUsed
                ? this.passwordComplexitySettings.default
                : this.passwordComplexitySettings.current
            ),
            this.tenantSettingsServiceProxy.updateUserLockOutSettings(this.userLockOutSettings),
            this.tenantSettingsServiceProxy.updateTwoFactorLoginSettings(this.twoFactorLoginSettings)
        );
    }
}