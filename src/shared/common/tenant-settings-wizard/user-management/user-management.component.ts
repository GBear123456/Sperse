import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'user-management',
    templateUrl: 'user-management.component.html',
    styleUrls: [ 'user-management.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements ITenantSettingsStepComponent {
    constructor() {}

    save(): Observable<any> {
        return of(null);
    }
}