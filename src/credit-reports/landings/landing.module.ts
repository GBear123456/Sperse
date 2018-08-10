import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { UtilsModule } from '@shared/utils/utils.module';
import { LayoutModule } from '../shared/layout/layout.module';
import { CreditReportsCommonModule } from '../shared/common/credit-reports-common.module';
import { MatSliderModule, MatSidenavModule, MatGridListModule } from '@angular/material';

import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';

import { LandingRoutingModule } from './landing-routing.module';
import { LandingComponent } from './landing.component';
import { ReportWizardModule } from './credit-report/wizard-form/report-wizard.module';
import { LoanComponent } from './loans/loans.component';
import { CreditReportComponent } from './credit-report/credit-report.component';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { CreditWizardPageComponent } from './credit-report/wizard-form/wizard-page/wizard-page.component';

import { CreditReportRegFromComponent } from './credit-report/register-form/register-form.component';
import { CreditCardRegFromComponent } from './credit-cards/register-form/register-form.component';
import { LoansRegFromComponent } from './loans/register-form/register-form.component';

import { TopBarComponent } from './shared/top-bar/top-bar.component';
import { MainNavComponent } from './shared/main-nav/main-nav.component';
import { PartnersComponent } from './shared/partners/partners.component';
import { SubscriptionComponent } from './shared/subscribtion/subscription.component';
import { HowItWorkComponent } from './shared/how-it-work/how-it-work.component';
import {  DxSelectBoxModule,
          DxRadioGroupModule,
          DxValidationGroupModule,
          DxTemplateModule,
          DxCheckBoxModule,
          DxTextBoxModule,
          DxFormModule,
          DxBoxModule,
          DxDateBoxModule,
          DxButtonModule,
          DxValidatorModule,
          DxValidationSummaryModule } from 'devextreme-angular';
import { AngularGooglePlaceModule } from 'angular-google-place';

@NgModule({
    imports: [
        MatSliderModule,
        MatGridListModule,
        MatSidenavModule,
        CommonModule,
        LayoutModule,
        CreditReportsCommonModule,
        FormsModule,
        AngularGooglePlaceModule,
        ReactiveFormsModule,
        LandingRoutingModule,
        DxSelectBoxModule,
        DxRadioGroupModule,
        DxTemplateModule,
        DxCheckBoxModule,
        DxTextBoxModule,
        DxFormModule,
        DxDateBoxModule,
        DxButtonModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxBoxModule,
        DxValidationSummaryModule,
        ReportWizardModule,
        UtilsModule,
        PaymentInfoModule
    ],
    declarations: [
        LandingComponent,

        LoanComponent,
        LoansRegFromComponent,

        CreditCardsComponent,
        CreditCardRegFromComponent,
        CreditWizardPageComponent,

        CreditReportComponent,
        CreditReportRegFromComponent,
        TopBarComponent,
        MainNavComponent,
        PartnersComponent,
        SubscriptionComponent,
        HowItWorkComponent
    ],
    bootstrap: [
        LandingComponent
    ],
    providers: [
    ]
})
export class LandingModule { }
