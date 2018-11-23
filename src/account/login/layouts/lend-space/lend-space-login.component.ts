/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';

@Component({
    templateUrl: './lend-space-login.component.html',
    styleUrls: [
        './lend-space-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LendSpaceLoginComponent extends HostLoginComponent { }