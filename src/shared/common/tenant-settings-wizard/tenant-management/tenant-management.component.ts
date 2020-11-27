import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SubscribableEditionComboboxItemDto, TenantManagementSettingsEditDto } from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'tenant-management',
    templateUrl: 'tenant-management.component.html',
    styleUrls: [ '../shared/styles/common.less', 'tenant-management.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantManagementComponent implements ITenantSettingsStepComponent {
    @Input() settings: TenantManagementSettingsEditDto;
    @Input() editions: SubscribableEditionComboboxItemDto[];
    constructor(public ls: AppLocalizationService) {}

    save(): Observable<any> {
        return of(null);
    }
}