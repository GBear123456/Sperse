import { Observable } from 'rxjs';

export interface ITenantSettingsStepComponent {
    save(): Observable<any>;
}