/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';

@Component({
    templateUrl: './bank-code-auto-login.component.html',
    styleUrls: [
        './bank-code-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeAutoLoginComponent extends HostAutoLoginComponent {
}
