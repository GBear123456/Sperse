/** Core imports */
import {Component} from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostCombinedForgotPasswordComponent } from '../host/host-combined-forgot-password.component';

@Component({
    templateUrl: './sperser-forgot-password.component.html',
    styleUrls: [
        '../host/host-forgot-password.component.less', 
        './sperser-password.component.less' 
    ],
    animations: [accountModuleAnimation()]
})
export class SperserForgotPasswordComponent extends HostCombinedForgotPasswordComponent {
}