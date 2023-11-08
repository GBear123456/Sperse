/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';
@Component({
    templateUrl: './advice-period-auto-login.component.html',
    styleUrls: [
        './advice-period-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class AdvicePeriodAutoLoginComponent extends HostAutoLoginComponent {
}
