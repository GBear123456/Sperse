/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';

@Component({
    templateUrl: './hoa-auto-login.component.html',
    styleUrls: [
        '../../../layouts/hoa/hoa-layout.component.less',
        './hoa-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HoaAutoLoginComponent extends HostAutoLoginComponent {
}
