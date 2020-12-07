/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    templateUrl: './bank-code-login.component.html',
    styleUrls: [
        './bank-code-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeLoginComponent extends HostLoginComponent {
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: { type: type }
        });
    }
}
