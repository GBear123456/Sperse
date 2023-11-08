/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';

@Component({
    templateUrl: './advice-period-login.component.html',
    styleUrls: [
        './advice-period-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class AdvicePeriodLoginComponent extends HostLoginComponent {
}
