/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppConsts } from '@shared/AppConsts';
import { HostLoginComponent } from '../host/host-login.component';

@Component({
    templateUrl: './bank-code-login.component.html',
    styleUrls: [
        './bank-code-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class BankCodeLoginComponent extends HostLoginComponent {
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
}
