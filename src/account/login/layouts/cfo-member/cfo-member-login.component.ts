/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';
import { environment } from 'environments/environment';

@Component({
    templateUrl: './cfo-member-login.component.html',
    styleUrls: [
        './cfo-member-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class CFOMemberLoginComponent extends HostLoginComponent {
    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: { type: type }
        });
    }
}