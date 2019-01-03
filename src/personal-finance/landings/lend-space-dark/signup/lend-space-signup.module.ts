import { NgModule } from '@angular/core';
import { LendSpaceSignupComponent } from '@root/personal-finance/landings/lend-space-dark/signup/lend-space-signup.component';
import { RouterModule } from '@angular/router';
import { DxButtonModule, DxCheckBoxModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        CommonModule,
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
