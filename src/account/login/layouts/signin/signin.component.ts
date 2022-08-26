/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    templateUrl: './signin.component.html',
    styleUrls: [
        './signin.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class SigninComponent extends HostLoginComponent {}