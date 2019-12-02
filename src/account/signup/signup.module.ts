/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MaskPipe, NgxMaskModule } from 'ngx-mask';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { SignupComponent } from './signup.component';
import { SignupFormComponent } from './signup-form.component';


@NgModule({
    imports: [
        CommonModule,
        ngCommon.CommonModule,
        RouterModule,
        FormsModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxCheckBoxModule,
        DxButtonModule,
        NgxMaskModule.forRoot(),
    ],
    declarations: [
        SignupFormComponent,
        SignupComponent
    ],
    exports: [
        SignupComponent
    ],
    providers: [
        MaskPipe
    ]
})
export class SignupModule {}
