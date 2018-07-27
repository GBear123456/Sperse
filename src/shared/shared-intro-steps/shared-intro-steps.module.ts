import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from './import-users-step/import-users-step.component';
import {
    DxValidatorModule,
    DxValidationGroupModule,
    DxTextBoxModule,
    DxTagBoxModule,
    DxScrollViewModule
} from 'devextreme-angular';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxTextBoxModule,
        DxTagBoxModule,
        DxScrollViewModule
    ],
    declarations: [
        QuestionnaireComponent,
        ImportUsersStepComponent
    ],
    exports: [
        QuestionnaireComponent,
        ImportUsersStepComponent
    ]
})
export class SharedIntroStepsModule {
}
