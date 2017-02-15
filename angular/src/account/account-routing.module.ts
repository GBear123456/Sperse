import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './password/forgot-password.component';
import { ResetPasswordComponent } from './password/reset-password.component';
import { EmailActivationComponent } from './email-activation/email-activation.component';
import { ConfirmEmailComponent } from './email-activation/confirm-email.component';
import { SendTwoFactorCodeComponent } from './login/send-two-factor-code.component';
import { ValidateTwoFactorCodeComponent } from './login/validate-two-factor-code.component';

@NgModule({
  imports: [
    RouterModule.forRoot([
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'email-activation', component: EmailActivationComponent },
      { path: 'confirm-email', component: ConfirmEmailComponent },
      { path: 'send-code', component: SendTwoFactorCodeComponent },
      { path: 'verify-code', component: ValidateTwoFactorCodeComponent },
      { path: '', redirectTo: '/login', pathMatch:'full' },
      { path: '**', redirectTo:'/login', pathMatch:'full' }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class AccountRoutingModule {}