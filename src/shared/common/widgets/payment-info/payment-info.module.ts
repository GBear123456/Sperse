import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';

import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';

import { AngularGooglePlaceModule } from 'angular-google-place';

import { CommonModule } from '@shared/common/common.module';
//import { AppCommonModule } from '@app/shared/common/app-common.module';
import { PaymentInfoComponent } from './payment-info.component';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
//        AppCommonModule,

        AngularGooglePlaceModule,

        DxButtonModule,
        DxCheckBoxModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxValidationSummaryModule
    ],
    declarations: [
        PaymentInfoComponent
    ],
    exports: [
        PaymentInfoComponent
    ]
})
export class PaymentInfoModule {
}
