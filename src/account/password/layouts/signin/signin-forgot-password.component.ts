/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostCombinedForgotPasswordComponent } from '../host/host-combined-forgot-password.component';

@Component({
    templateUrl: './signin-forgot-password.component.html',
    styleUrls: [
        './signin-forgot-password.component.less',
        '../../../../assets/fonts/fonts-outfit-light.css',
        '../../../../assets/fonts/sperser-extension.css'
    ],
    animations: [accountModuleAnimation()]
})
export class SigninForgotPasswordComponent extends HostCombinedForgotPasswordComponent {}
