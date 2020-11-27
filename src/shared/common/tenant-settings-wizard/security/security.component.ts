import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'security',
    templateUrl: 'security.component.html',
    styleUrls: [ 'security.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityComponent implements ITenantSettingsStepComponent {
    constructor() {}

    save(): Observable<any> {
        return of(null);
    }
}