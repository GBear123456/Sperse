import { NgModule } from '@angular/core';
import { LendSpaceSignupComponent } from '@root/personal-finance/landings/lend-space-dark/signup/lend-space-signup.component';
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
            component: LendSpaceSignupComponent
        }]
    )],
    declarations: [ LendSpaceSignupComponent ]
})
export class LendSpaceSignupModule {}
