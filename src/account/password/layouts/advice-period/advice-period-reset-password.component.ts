/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './advice-period-reset-password.component.html',
    styleUrls: [
        './advice-period-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class AdvicePeriodResetPasswordComponent extends HostResetPasswordComponent { }
