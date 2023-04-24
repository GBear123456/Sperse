/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Application imports */
import { LoginComponent } from './login/login.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForgotPasswordComponent } from './password/forgot-password.component';
import { ResetPasswordComponent } from './password/reset-password.component';
import { EmailActivationComponent } from './email-activation/email-activation.component';
import { ConfirmEmailComponent } from './email-activation/confirm-email.component';
import { SendTwoFactorCodeComponent } from './login/send-two-factor-code.component';
import { ValidateTwoFactorCodeComponent } from './login/validate-two-factor-code.component';
import { SelectTenantComponent } from './login/select-tenant.component';
import { AccountComponent } from './account.component';
import { CompleteTenantRegistrationComponent } from './register/complete-tenant-registration/complete-tenant-registration.component';
import { SigninForgotPasswordComponent } from '@root/account/password/layouts/signin/signin-forgot-password.component';
import { SigninComponent } from '@root/account/login/layouts/signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { TenantSideRouteGuard } from '@shared/common/auth/tenat-side-route-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AccountComponent,
                children: [
                    {
                        path: '',
                        redirectTo: 'login',
                        pathMatch: 'full'
                    },
                    { path: 'login', component: LoginComponent },
                    { path: 'auto-login', component: AutoLoginComponent },
                    { path: 'forgot-password', component: ForgotPasswordComponent },
                    { path: 'reset-password', component: ResetPasswordComponent },
                    { path: 'email-activation', component: EmailActivationComponent },
                    { path: 'confirm-email', component: ConfirmEmailComponent },
                    { path: 'send-code', component: SendTwoFactorCodeComponent },
                    { path: 'verify-code', component: ValidateTwoFactorCodeComponent },
                    { path: 'select-tenant', component: SelectTenantComponent },
                    {
                        path: 'signin',
                        component: LoginComponent,
                        data: { wrap: false, layoutComponent: SigninComponent, hostOnly: true, tenantRedirect: 'account/login' },
                        canActivate: [TenantSideRouteGuard]
                    },
                    {
                        path: 'signup',
                        component: SignupComponent,
                        data: { wrap: false, checkEnabledOption: 'App.UserManagement.IsSignUpPageEnabled', tenantRedirect: 'account/login' },
                        canActivate: [TenantSideRouteGuard]
                    },
                    { path: 'signin-forgot-password', component: ForgotPasswordComponent, data: { wrap: false, layoutComponent: SigninForgotPasswordComponent } },
                    { path: 'complete-tenant-registration', component: CompleteTenantRegistrationComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class AccountRoutingModule { }