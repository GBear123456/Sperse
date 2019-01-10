import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from './import-users-step/import-users-step.component';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

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
