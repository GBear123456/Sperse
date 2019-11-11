/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';

@Component({
    templateUrl: './advice-period-forgot-password.component.html',
    styleUrls: [
        './advice-period-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class AdvicePeriodForgotPasswordComponent extends HostForgotPasswordComponent {}
