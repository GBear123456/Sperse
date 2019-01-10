import { NgModule } from '@angular/core';
import { LendSpaceSignupComponent } from './lend-space-signup.component';
import { LendSpaceSignupWrapperComponent } from './signup-wrapper.component';
import { RouterModule } from '@angular/router';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxCheckBoxModule,
        DxButtonModule,
        RouterModule.forChild([{
            path: '',
            component: LendSpaceSignupWrapperComponent
        }]
    )],
    declarations: [ 
        LendSpaceSignupComponent, 
        LendSpaceSignupWrapperComponent 
    ]
})
export class LendSpaceSignupModule {}