/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './lend-space-reset-password.component.html',
    styleUrls: [
        './lend-space-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LendSpaceResetPasswordComponent extends HostResetPasswordComponent {}
