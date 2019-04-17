/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';

@Component({
    templateUrl: './cfo-member-forgot-password.component.html',
    styleUrls: [
        './cfo-member-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class CFOMemberForgotPasswordComponent extends HostForgotPasswordComponent {
}
