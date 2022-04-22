import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SperserAutoLoginComponent } from '@root/account/auto-login/layouts/sperser/sperser-auto-login.component';
import { SperserForgotPasswordComponent } from '@root/account/password/layouts/sperser/sperser-forgot-password.component';
import { SperserResetPasswordComponent } from '@root/account/password/layouts/sperser/sperser-reset-password.component';
import { UtilsModule } from '@shared/utils/utils.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CodeInputModule } from 'angular-code-input';
import { SignupModule } from './signup/signup.module';
import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent, AdLayoutHostDirective } from './account.component';
import { ConfirmEmailComponent } from './email-activation/confirm-email.component';
import { EmailActivationComponent } from './email-activation/email-activation.component';
import { LanguageSwitchComponent } from './language-switch.component';
import { LoginComponent, AdLoginHostDirective } from './login/login.component';
import { AutoLoginComponent, AdAutoLoginHostDirective } from './auto-login/auto-login.component';
import { LoginService } from './login/login.service';
import { SendTwoFactorCodeComponent } from './login/send-two-factor-code.component';
import { ValidateTwoFactorCodeComponent } from './login/validate-two-factor-code.component';
import { ForgotPasswordComponent, AdForgotPasswordHostDirective } from './password/forgot-password.component';
import { ResetPasswordComponent, AdResetPasswordHostDirective } from './password/reset-password.component';
import { TenantChangeModalComponent } from './shared/tenant-change-modal.component';
import { TenantChangeComponent } from './shared/tenant-change.component';
import { SelectTenantComponent } from './login/select-tenant.component';
import { CompleteTenantRegistrationComponent } from './register/complete-tenant-registration/complete-tenant-registration.component';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { HostLoginComponent } from './login/layouts/host/host-login.component';
import { LendSpaceLoginComponent } from './login/layouts/lend-space/lend-space-login.component';
import { AdvicePeriodLoginComponent } from './login/layouts/advice-period/advice-period-login.component';
import { BankCodeLoginComponent } from './login/layouts/bank-code/bank-code-login.component';
import { HostAutoLoginComponent } from './auto-login/layouts/host/host-auto-login.component';
import { LendSpaceAutoLoginComponent } from './auto-login/layouts/lend-space/lend-space-auto-login.component';
import { AdvicePeriodAutoLoginComponent } from './auto-login/layouts/advice-period/advice-period-auto-login.component';
import { BankCodeAutoLoginComponent } from './auto-login/layouts/bank-code/bank-code-auto-login.component';
import { HostLayoutComponent } from './layouts/host/host-layout.component';
import { LendSpaceLayoutComponent } from './layouts/lend-space/lend-space-layout.component';
import { AdvicePeriodLayoutComponent } from './layouts/advice-period/advice-period-layout.component';
import { BankCodeLayoutComponent } from './layouts/bank-code/bank-code-layout.component';
import { PersonalFinanceLayoutModule } from '@shared/personal-finance-layout/personal-finance-layout.module';
import { HostForgotPasswordComponent } from './password/layouts/host/host-forgot-password.component';
import { LendSpaceForgotPasswordComponent } from './password/layouts/lend-space/lend-space-forgot-password.component';
import { AdvicePeriodForgotPasswordComponent } from './password/layouts/advice-period/advice-period-forgot-password.component';
import { BankCodeForgotPasswordComponent } from './password/layouts/bank-code/bank-code-forgot-password.component';
import { HostResetPasswordComponent } from './password/layouts/host/host-reset-password.component';
import { LendSpaceResetPasswordComponent } from './password/layouts/lend-space/lend-space-reset-password.component';
import { AdvicePeriodResetPasswordComponent } from './password/layouts/advice-period/advice-period-reset-password.component';
import { BankCodeResetPasswordComponent } from './password/layouts/bank-code/bank-code-reset-password.component';
import { ApplicationServiceProxy } from '@shared/service-proxies/service-proxies';
import { BankCodeLayoutModule } from '@root/bank-code/shared/layout/bank-code-layout.module';
import { RapidLayoutComponent } from "@root/account/layouts/rapid/rapid-layout.component";
import { RapidLoginComponent } from "@root/account/login/layouts/rapid/rapid-login.component";
import { RapidResetPasswordComponent } from "@root/account/password/layouts/rapid/rapid-reset-password.component";
import { RapidForgotPasswordComponent } from "@root/account/password/layouts/rapid/rapid-forgot-password.component";
import { RapidAutoLoginComponent } from "@root/account/auto-login/layouts/rapid/rapid-auto-login.component";
import { HoaLayoutComponent } from '@root/account/layouts/hoa/hoa-layout.component';
import { HoaLoginComponent } from "@root/account/login/layouts/hoa/hoa-login.component";
import { HoaAutoLoginComponent } from "@root/account/auto-login/layouts/hoa/hoa-auto-login.component";
import { HoaResetPasswordComponent } from "@root/account/password/layouts/hoa/hoa-reset-password.component";
import { HoaForgotPasswordComponent } from "@root/account/password/layouts/hoa/hoa-forgot-password.component";
import { SperserLoginVerificationComponent } from '@root/account/password/layouts/sperser/sperser-login-verification.component';
import { SperserLayoutComponent } from '@root/account/layouts/sperser/sperser-layout.component';
import { SperserLoginComponent } from '@root/account/login/layouts/sperser/sperser-login.component';
import { GHostLayoutComponent } from '@root/account/layouts/ghost/ghost-layout.component';
import { GHostLoginComponent } from "@root/account/login/layouts/ghost/ghost-login.component";
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { BankCodeLoginVerificationComponent } from './password/layouts/bank-code/bank-code-login-verification.component';
import { HostLoginVerificationComponent } from './password/layouts/host/host-login-verification.component';
import { HostCombinedForgotPasswordComponent } from './password/layouts/host/host-combined-forgot-password.component';

// import { HoaLoginComponent } from "@root/account/login/layouts/hoa/hoa-login.component";
// import { HoaAutoLoginComponent } from "@root/account/auto-login/layouts/hoa/hoa-auto-login.component";
// import { HoaResetPasswordComponent } from "@root/account/password/layouts/hoa/hoa-reset-password.component";
// import { HoaForgotPasswordComponent } from "@root/account/password/layouts/hoa/hoa-forgot-password.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        ModalModule.forRoot(),

        UtilsModule,
        SignupModule,
        PaymentInfoModule,
        AccountRoutingModule,
        PersonalFinanceLayoutModule,
        BankCodeLayoutModule,
        DxTextBoxModule,
        DxButtonModule,
        CodeInputModule
    ],
    declarations: [
        AccountComponent,
        AdLayoutHostDirective,
        HostLayoutComponent,
        LendSpaceLayoutComponent,
        AdvicePeriodLayoutComponent,
        BankCodeLayoutComponent,
        TenantChangeComponent,
        TenantChangeModalComponent,
        LoginComponent,
        AutoLoginComponent,
        AdvicePeriodLoginComponent,
        BankCodeLoginComponent,
        HostLoginComponent,
        LendSpaceLoginComponent,
        AdvicePeriodAutoLoginComponent,
        BankCodeAutoLoginComponent,
        HostAutoLoginComponent,
        LendSpaceAutoLoginComponent,
        AdLoginHostDirective,
        AdAutoLoginHostDirective,
        AdResetPasswordHostDirective,
        AdForgotPasswordHostDirective,
        ForgotPasswordComponent,
        ResetPasswordComponent,
        EmailActivationComponent,
        ConfirmEmailComponent,
        SendTwoFactorCodeComponent,
        ValidateTwoFactorCodeComponent,
        SelectTenantComponent,
        LanguageSwitchComponent,
        CompleteTenantRegistrationComponent,
        HostForgotPasswordComponent,
        HostCombinedForgotPasswordComponent,
        LendSpaceForgotPasswordComponent,
        HostResetPasswordComponent,
        HostLoginVerificationComponent,
        LendSpaceResetPasswordComponent,
        AdvicePeriodResetPasswordComponent,
        AdvicePeriodForgotPasswordComponent,
        BankCodeResetPasswordComponent,
        BankCodeForgotPasswordComponent,
        BankCodeLoginVerificationComponent,

        RapidLayoutComponent,
        RapidLoginComponent,
        RapidResetPasswordComponent,
        RapidForgotPasswordComponent,
        RapidAutoLoginComponent,

        HoaLayoutComponent,
        HoaLoginComponent,
        HoaAutoLoginComponent,
        HoaResetPasswordComponent,
        HoaForgotPasswordComponent,

        SperserLayoutComponent,
        SperserLoginComponent,
        SperserForgotPasswordComponent,
        SperserResetPasswordComponent,
        SperserAutoLoginComponent,
        SperserLoginVerificationComponent,

        GHostLayoutComponent,
        GHostLoginComponent
    ],
    entryComponents: [
        HostLayoutComponent,
        HostLoginComponent,
        HostAutoLoginComponent,
        LendSpaceLoginComponent,
        LendSpaceAutoLoginComponent,
        LendSpaceLayoutComponent,
        AdvicePeriodLoginComponent,
        AdvicePeriodAutoLoginComponent,
        AdvicePeriodLayoutComponent,
        BankCodeLayoutComponent,
        BankCodeLoginComponent,
        HostCombinedForgotPasswordComponent,
        BankCodeAutoLoginComponent,
        HostForgotPasswordComponent,
        LendSpaceForgotPasswordComponent,
        HostResetPasswordComponent,
        LendSpaceResetPasswordComponent,
        AdvicePeriodResetPasswordComponent,
        AdvicePeriodForgotPasswordComponent,
        BankCodeResetPasswordComponent,
        BankCodeForgotPasswordComponent,

        RapidLayoutComponent,
        RapidLoginComponent,
        RapidResetPasswordComponent,
        RapidForgotPasswordComponent,
        RapidAutoLoginComponent,

        HoaLayoutComponent,
        HoaLoginComponent,
        HoaAutoLoginComponent,
        HoaResetPasswordComponent,
        HoaForgotPasswordComponent,

        SperserLayoutComponent,
        SperserLoginComponent,
        SperserForgotPasswordComponent,
        SperserResetPasswordComponent,
        SperserAutoLoginComponent,

        GHostLayoutComponent,
        GHostLoginComponent
    ],
    providers: [
        LoginService,
        ApplicationServiceProxy
    ]
})
export class AccountModule {}
