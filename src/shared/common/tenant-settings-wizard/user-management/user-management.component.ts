import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, of } from 'rxjs';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    HostUserManagementSettingsEditDto,
    TenantUserManagementSettingsEditDto
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'user-management',
    templateUrl: 'user-management.component.html',
    styleUrls: [ '../shared/styles/common.less', 'user-management.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements ITenantSettingsStepComponent {
    @Input() tenantSettings: TenantUserManagementSettingsEditDto;
    @Input() hostSettings: HostUserManagementSettingsEditDto;
    constructor(
        public ls: AppLocalizationService
    ) {}

    save(): Observable<any> {
        return of(null);
    }
}