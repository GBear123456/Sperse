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

import { CommonModule } from '@shared/common/common.module';
import { PaymentInfoComponent } from './payment-info.component';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
        DxButtonModule,
        DxCheckBoxModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxValidationSummaryModule,
        GooglePlaceModule
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
