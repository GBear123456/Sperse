import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'email',
    templateUrl: 'email.component.html',
    styleUrls: [ 'email.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailComponent implements ITenantSettingsStepComponent {
    constructor() {}

    save(): Observable<any> {
        return of(null);
    }
}