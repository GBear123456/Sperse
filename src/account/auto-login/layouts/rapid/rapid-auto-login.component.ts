/** Core imports */
import { Component, Injector } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from "../host/host-auto-login.component";

@Component({
    templateUrl: './rapid-auto-login.component.html',
    styleUrls: [
        './rapid-auto-login.component.less',
        '../../../layouts/rapid/rapid-layout.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class RapidAutoLoginComponent extends HostAutoLoginComponent {
}