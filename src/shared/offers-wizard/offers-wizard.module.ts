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
        DxSelectBoxModule
    ],
    declarations: [
        OffersWizardComponent
    ],
    exports: [
        OffersWizardComponent
    ],
    entryComponents: [
        OffersWizardComponent // ??
    ]
})
export class OffersWizardModule {
}
