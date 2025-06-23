/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostCombinedForgotPasswordComponent } from '../host/host-combined-forgot-password.component';

@Component({
    templateUrl: './bank-code-forgot-password.component.html',
    styleUrls: [
        '../host/host-forgot-password.component.less',
        './bank-code-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeForgotPasswordComponent extends HostCombinedForgotPasswordComponent {
}
