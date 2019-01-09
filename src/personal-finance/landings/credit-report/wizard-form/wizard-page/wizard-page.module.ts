/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { AngularGooglePlaceModule } from '@node_modules/angular-google-place';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';

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
