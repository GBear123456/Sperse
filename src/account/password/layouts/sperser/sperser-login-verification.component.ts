/**  Core imports */
import {
    Component
} from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginVerificationComponent } from '../host/host-login-verification.component';

@Component({
    selector: 'sperser-login-verification',
    templateUrl: './sperser-login-verification.component.html',
    animations: [accountModuleAnimation()]
})
export class SperserLoginVerificationComponent extends HostLoginVerificationComponent {
}