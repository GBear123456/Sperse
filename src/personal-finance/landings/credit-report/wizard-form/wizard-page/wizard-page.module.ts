/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { AngularGooglePlaceModule } from '@node_modules/angular-google-place';
import {
    DxButtonModule,
    DxDateBoxModule,
    DxRadioGroupModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxValidationGroupModule,
    DxValidationSummaryModule,
    DxValidatorModule
} from 'devextreme-angular';

/** Application imports */
import { ReportWizardModule } from '@root/personal-finance/landings/credit-report/wizard-form/report-wizard.module';
import { CreditWizardPageComponent } from '@root/personal-finance/landings/credit-report/wizard-form/wizard-page/wizard-page.component';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { UtilsModule } from '@shared/utils/utils.module';

@NgModule({
    imports: [
        AngularGooglePlaceModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PaymentInfoModule,
        DxButtonModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxRadioGroupModule,
        DxDateBoxModule,
        DxValidationSummaryModule,
        ReportWizardModule,
        RouterModule.forChild([{
            path: '',
            component: CreditWizardPageComponent
        }]),
        UtilsModule
    ],
    declarations: [
        CreditWizardPageComponent
    ]
})
export class WizardPageModule {}
