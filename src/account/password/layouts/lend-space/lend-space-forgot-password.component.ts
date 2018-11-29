/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';

@Component({
    templateUrl: './lend-space-forgot-password.component.html',
    styleUrls: [
        './lend-space-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LendSpaceForgotPasswordComponent extends HostForgotPasswordComponent {
}
