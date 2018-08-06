import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';

import {
    DxButtonModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxValidationSummaryModule
} from 'devextreme-angular';
import { AngularGooglePlaceModule } from 'angular-google-place';

import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CountryServiceProxy } from '@shared/service-proxies/service-proxies';
import { PaymentInfoComponent } from './payment-info.component'

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
        AppCommonModule,

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
    ],
    providers: [
        CountryServiceProxy
    ]
})
export class PaymentInfoModule {
}
