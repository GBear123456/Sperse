import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule, TooltipModule } from 'ngx-bootstrap';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { PersonalFinanceCommonModule } from './shared/common/personal-finance-common.module';
import { PersonalFinanceRoutingModule } from './personal-finance-routing.module';
import { PersonalFinanceComponent } from './personal-finance.component';
import { LayoutModule } from './shared/layout/layout.module';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { PackageIdService } from './shared/common/packages/package-id.service';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { CreditReportServiceProxy } from '@shared/service-proxies/service-proxies';
import { KbaResultModule } from './member-area/kba-result/kba-result.module';
import { CreditWizardPageComponent } from './landings/credit-report/wizard-form/wizard-page/wizard-page.component';
import { CreditReportComponent } from '@root/personal-finance/landings/credit-report/credit-report.component';
import { CreditReportRegFromComponent } from '@root/personal-finance/landings/credit-report/register-form/register-form.component';
import { LendSpaceDarkComponent } from '@root/personal-finance/landings/lend-space-dark/lend-space-dark.component';
import { LendSpaceComponent } from '@root/personal-finance/landings/lend-space/lend-space.component';
import { LendSpaceSignupComponent } from '@root/personal-finance/landings/lend-space-dark/signup/lend-space-signup.component';
import {
    DxBoxModule, DxButtonModule,
    DxCheckBoxModule, DxDateBoxModule,
    DxFormModule, DxRadioGroupModule,
    DxSelectBoxModule, DxSwitchModule, DxNumberBoxModule,
    DxTemplateModule, DxTextBoxModule, DxValidationGroupModule, DxValidationSummaryModule, DxValidatorModule
} from '@root/node_modules/devextreme-angular';
import { MatGridListModule, MatSidenavModule, MatSliderModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportWizardModule } from '@root/personal-finance/landings/credit-report/wizard-form/report-wizard.module';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { AngularGooglePlaceModule } from '@node_modules/angular-google-place';
import { UtilsModule } from '@shared/utils/utils.module';

@NgModule({
    declarations: [
        PersonalFinanceComponent,
        TermsOfServiceComponent,
        PrivacyPolicyComponent,
        ContactUsComponent,
        AboutUsComponent,
        CreditReportComponent,
        CreditReportRegFromComponent,
        LendSpaceComponent,
        LendSpaceDarkComponent,
        LendSpaceSignupComponent,
        CreditWizardPageComponent
    ],
    imports: [
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        FileUploadModule,
        LayoutModule,
        CommonModule,
        KbaResultModule,

        PersonalFinanceRoutingModule,
        PersonalFinanceCommonModule.forRoot(),

        MatSliderModule,
        MatGridListModule,
        MatSidenavModule,
        PersonalFinanceCommonModule,
        FormsModule,
        AngularGooglePlaceModule,
        ReactiveFormsModule,
        DxSelectBoxModule,
        DxRadioGroupModule,
        DxSwitchModule,
        DxNumberBoxModule,
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
    providers: [
        PackageIdService,
        CreditReportServiceProxy
    ]
})
export class PersonalFinanceModule { }
