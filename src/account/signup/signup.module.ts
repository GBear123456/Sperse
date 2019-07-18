import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SignupComponent } from './signup.component';
import { SignupFormComponent } from './signup-form.component';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxCheckBoxModule,
        DxButtonModule
    ],
    declarations: [ 
        SignupFormComponent,
        SignupComponent        
    ],
    exports: [
        SignupComponent
    ]
})
export class SignupModule {}