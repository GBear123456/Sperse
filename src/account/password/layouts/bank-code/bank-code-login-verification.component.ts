/**  Core imports */
import {
    Component
} from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginVerificationComponent } from '../host/host-login-verification.component';

@Component({
    selector: 'bank-code-login-verification',
    templateUrl: './bank-code-login-verification.component.html',
    styleUrls: [
        './bank-code-login-verification.component.less',
        '../host/host-login-verification.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeLoginVerificationComponent extends HostLoginVerificationComponent {
}