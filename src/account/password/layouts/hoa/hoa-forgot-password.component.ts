/** Core imports */
import {Component} from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';

@Component({
    templateUrl: './hoa-forgot-password.component.html',
    styleUrls: [
        '../host/host-forgot-password.component.less',
        '../../../layouts/hoa/hoa-layout.component.less',
        './hoa-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HoaForgotPasswordComponent extends HostForgotPasswordComponent {
}
