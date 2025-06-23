/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';

@Component({
    templateUrl: './sperser-login.component.html',
    styleUrls: [ './sperser-login.component.less' ],
    animations: [accountModuleAnimation()]
})
export class SperserLoginComponent extends HostLoginComponent {}
