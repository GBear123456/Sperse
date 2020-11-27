import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

export interface TenantSettingsStep {
    name: string;
    text: string;
    component: ITenantSettingsStepComponent;
    saved: boolean;
    visible: boolean;
}