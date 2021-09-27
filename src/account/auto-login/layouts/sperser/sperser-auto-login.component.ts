/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';

@Component({
    templateUrl: './sperser-auto-login.component.html',
    styleUrls: [ './sperser-auto-login.component.less' ],
    animations: [accountModuleAnimation()]
})
export class SperserAutoLoginComponent extends HostAutoLoginComponent {}