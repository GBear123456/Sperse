/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    templateUrl: './hoa-login.component.html',
    styleUrls: [
        '../../../layouts/hoa/hoa-layout.component.less',
        './hoa-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HoaLoginComponent extends HostLoginComponent {

    showHidePass() {
        this.showPassword = !this.showPassword;
    }
}
