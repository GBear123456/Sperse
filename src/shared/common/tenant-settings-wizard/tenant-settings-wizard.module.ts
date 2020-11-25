/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { InlineSVGModule } from 'ng-inline-svg';

/** Application imports */
import { TenantSettingsWizardComponent } from './tenant-settings-wizard.component';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';

@NgModule({
    imports: [
        CommonModule,
        MatStepperModule,
        MatButtonModule,
        MatDialogModule,
        InlineSVGModule
    ],
    exports: [ TenantSettingsWizardComponent ],
    declarations: [
        TenantSettingsWizardComponent,
        GeneralSettingsComponent
    ],
    providers: [],
    entryComponents: [ TenantSettingsWizardComponent ]
})
export class TenantSettingsWizardModule {}
