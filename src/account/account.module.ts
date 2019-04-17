import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent, AdLayoutHostDirective } from './account.component';
import { ConfirmEmailComponent } from './email-activation/confirm-email.component';
import { EmailActivationComponent } from './email-activation/email-activation.component';
import { LanguageSwitchComponent } from './language-switch.component';
import { LoginComponent, AdLoginHostDirective } from './login/login.component';
import { LoginService } from './login/login.service';
import { SendTwoFactorCodeComponent } from './login/send-two-factor-code.component';
import { ValidateTwoFactorCodeComponent } from './login/validate-two-factor-code.component';
import { ForgotPasswordComponent, AdForgotPasswordHostDirective } from './password/forgot-password.component';
import { ResetPasswordComponent, AdResetPasswordHostDirective } from './password/reset-password.component';
import { TenantChangeModalComponent } from './shared/tenant-change-modal.component';
import { TenantChangeComponent } from './shared/tenant-change.component';
import { SelectTenantComponent } from './login/select-tenant.component';
import { CompleteTenantRegistrationComponent } from './register/complete-tenant-registration.component';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { HostLoginComponent } from './login/layouts/host/host-login.component';
import { LendSpaceLoginComponent } from './login/layouts/lend-space/lend-space-login.component';
import { CFOMemberLoginComponent } from './login/layouts/cfo-member/cfo-member-login.component';
import { HostLayoutComponent } from './layouts/host/host-layout.component';
import { LendSpaceLayoutComponent } from './layouts/lend-space/lend-space-layout.component';
import { CFOMemberLayoutComponent } from './layouts/cfo-member/cfo-member-layout.component';
import { PersonalFinanceLayoutModule } from '@shared/personal-finance-layout/personal-finance-layout.module';
import { HostForgotPasswordComponent } from './password/layouts/host/host-forgot-password.component';
import { LendSpaceForgotPasswordComponent } from './password/layouts/lend-space/lend-space-forgot-password.component';
import { CFOMemberForgotPasswordComponent } from './password/layouts/cfo-member/cfo-member-forgot-password.component';
import { HostResetPasswordComponent } from './password/layouts/host/host-reset-password.component';
import { LendSpaceResetPasswordComponent } from './password/layouts/lend-space/lend-space-reset-password.component';
import { CFOMemberResetPasswordComponent } from './password/layouts/cfo-member/cfo-member-reset-password.component';
import { ApplicationServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        ModalModule.forRoot(),

        UtilsModule,
        PaymentInfoModule,
        AccountRoutingModule,
        PersonalFinanceLayoutModule,
    ],
    declarations: [
        AccountComponent,
        AdLayoutHostDirective,
        HostLayoutComponent,
        LendSpaceLayoutComponent,
        CFOMemberLayoutComponent,
        TenantChangeComponent,
        TenantChangeModalComponent,
        LoginComponent,
        CFOMemberLoginComponent,
        HostLoginComponent,
        LendSpaceLoginComponent,
        AdLoginHostDirective,
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
        LendSpaceForgotPasswordComponent,
        HostResetPasswordComponent,
        LendSpaceResetPasswordComponent,
        CFOMemberResetPasswordComponent,
        CFOMemberForgotPasswordComponent 
    ],
    entryComponents: [
        HostLayoutComponent,
        HostLoginComponent,
        LendSpaceLoginComponent,
        LendSpaceLayoutComponent,
        CFOMemberLoginComponent,
        CFOMemberLayoutComponent,
        HostForgotPasswordComponent,
        LendSpaceForgotPasswordComponent,
        HostResetPasswordComponent,
        LendSpaceResetPasswordComponent,
        CFOMemberResetPasswordComponent,
        CFOMemberForgotPasswordComponent 
    ],
    providers: [
        LoginService,
        ApplicationServiceProxy
    ]
})
export class AccountModule {

}
