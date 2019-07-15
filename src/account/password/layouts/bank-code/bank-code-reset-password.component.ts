/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './bank-code-reset-password.component.html',
    styleUrls: [
        './bank-code-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeResetPasswordComponent extends HostResetPasswordComponent { }
