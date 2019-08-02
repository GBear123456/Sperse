/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxButtonModule } from 'devextreme-angular/ui/button';

/** Application imports */
import { WizardPersonalInfoStepComponent } from './offer-wizard-steps/wizard-personal-info-step/wizard-personal-info-step.component';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { WizardContactInfoStepComponent } from './offer-wizard-steps/wizard-contact-info-step/wizard-contact-info-step.component';
import { WizardHomeInfoStepComponent } from './offer-wizard-steps/wizard-home-info-step/wizard-home-info-step.component';
import { WizardBankInfoStepComponent } from './offer-wizard-steps/wizard-bank-info-step/wizard-bank-info-step.component';
import { WizardEmploymentInfoStepComponent } from './offer-wizard-steps/wizard-employment-info-step/wizard-employment-info-step.component';
import { WizardEmploymentPaymentStepComponent } from './offer-wizard-steps/wizard-employment-payment-step/wizard-employment-payment-step.component';
import { WizardLoanInfoStepComponent } from './offer-wizard-steps/wizard-loan-info-step/wizard-loan-info-step.component';
import { WizardRightSideComponent } from './wizard-right-side/wizard-right-side.component';
import { WizardCenterModalComponent } from './wizard-center-modal/wizard-center-modal.component';
import { CommonModule } from '@shared/common/common.module';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular';
import { MatTabsModule } from '@angular/material';

@NgModule({
    imports: [
        ngCommon.CommonModule,

        MatStepperModule,
        MatDialogModule,

        DxTextBoxModule,
        DxDateBoxModule,
        DxRadioGroupModule,
        DxSelectBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxNumberBoxModule,
        DxButtonModule,
        CommonModule,
        DxScrollViewModule,
        MatTabsModule
    ],
    declarations: [
        WizardPersonalInfoStepComponent,
        WizardContactInfoStepComponent,
        WizardHomeInfoStepComponent,
        WizardBankInfoStepComponent,
        WizardEmploymentInfoStepComponent,
        WizardEmploymentPaymentStepComponent,
        WizardLoanInfoStepComponent,
        WizardRightSideComponent,
        WizardCenterModalComponent
    ],
    exports: [
        WizardCenterModalComponent,
        WizardRightSideComponent
    ],
    entryComponents: [
        WizardCenterModalComponent,
        WizardRightSideComponent
    ],
    providers: [
        OffersWizardService
    ]
})
export class OffersWizardModule {
}
