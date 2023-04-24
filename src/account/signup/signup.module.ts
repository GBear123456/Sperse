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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** Application imports */
import { UtilsModule } from '@shared/utils/utils.module';
import { CommonModule } from '@shared/common/common.module';
import { SignupComponent, AdSignupHostDirective } from './signup.component';
import { HostSignupFormComponent } from './layouts/host/host-signup-form.component';
import { BankCodeSignupFormComponent } from './layouts/bank-code/bank-code-signup-form.component';
import { CountryPhoneNumberModule } from '../../shared/common/phone-numbers/country-phone-number.module';
import { MemberSignupFormComponent } from './layouts/member/member-signup-form.component';

@NgModule({
    imports: [
        CommonModule,
        ngCommon.CommonModule,
        RouterModule,
        FormsModule,
        UtilsModule,
        DxTextBoxModule,
        DxValidatorModule,
        MatFormFieldModule,
        MatInputModule,
        DxCheckBoxModule,
        DxButtonModule,
        NgxMaskModule.forRoot(),
        CountryPhoneNumberModule
    ],
    declarations: [
        BankCodeSignupFormComponent,
        HostSignupFormComponent,
        MemberSignupFormComponent,
        AdSignupHostDirective,
        SignupComponent
    ],
    entryComponents: [
        MemberSignupFormComponent,
        BankCodeSignupFormComponent,
        HostSignupFormComponent
    ],
    exports: [
        SignupComponent
    ],
    providers: [
        MaskPipe
    ]
})
export class SignupModule {}
