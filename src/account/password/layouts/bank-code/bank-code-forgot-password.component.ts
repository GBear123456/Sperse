/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';

@Component({
    templateUrl: './bank-code-forgot-password.component.html',
    styleUrls: [
        './bank-code-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeForgotPasswordComponent extends HostForgotPasswordComponent {
}
