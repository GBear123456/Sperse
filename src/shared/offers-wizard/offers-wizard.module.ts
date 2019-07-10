/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';

/** Application imports */
import { OffersWizardComponent } from './offers-wizard.component';

@NgModule({
    imports: [
        CommonModule,

        MatStepperModule,
        MatDialogModule,

        DxTextBoxModule,
        DxDateBoxModule,
        DxRadioGroupModule,
        DxSelectBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxNumberBoxModule
    ],
    declarations: [
        OffersWizardComponent
    ],
    exports: [
        OffersWizardComponent
    ],
    entryComponents: [
        OffersWizardComponent
    ]
})
export class OffersWizardModule {
}
