/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { NgxFileDropModule } from 'ngx-file-drop';

/** Application imports */
import { TenantSettingsWizardComponent } from './tenant-settings-wizard.component';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';
import { TimeZoneComboModule } from '@app/shared/common/timing/timezone-combo.module';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';

@NgModule({
    imports: [
        CommonModule,
        DxScrollViewModule,
        MatStepperModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        InlineSVGModule,
        MatInputModule,
        FormsModule,
        TimeZoneComboModule,
        NgxFileDropModule
    ],
    exports: [ TenantSettingsWizardComponent ],
    declarations: [
        TenantSettingsWizardComponent,
        GeneralSettingsComponent,
        UploaderComponent
    ],
    providers: [],
    entryComponents: [ TenantSettingsWizardComponent ]
})
export class TenantSettingsWizardModule {}
