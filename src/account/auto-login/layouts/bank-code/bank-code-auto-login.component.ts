/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    templateUrl: './bank-code-auto-login.component.html',
    styleUrls: [
        './bank-code-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeAutoLoginComponent extends HostAutoLoginComponent {
    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: { type: type }
        });
    }
}
