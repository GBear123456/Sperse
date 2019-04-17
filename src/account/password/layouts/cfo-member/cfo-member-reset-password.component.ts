/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './cfo-member-reset-password.component.html',
    styleUrls: [
        './cfo-member-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class CFOMemberResetPasswordComponent extends HostResetPasswordComponent { }
