/**  Core imports */
import {
    Component
} from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginVerificationComponent } from '../host/host-login-verification.component';

@Component({
    selector: 'signin-login-verification',
    templateUrl: './signin-login-verification.component.html',
    styleUrls: [
        './signin-login-verification.component.less',
        '../host/host-login-verification.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class SigninLoginVerificationComponent extends HostLoginVerificationComponent {}