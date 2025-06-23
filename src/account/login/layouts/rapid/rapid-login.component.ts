/** Core imports */
import { Component, OnInit, ViewChild } from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from "@root/account/login/layouts/host/host-login.component";

@Component({
    templateUrl: './rapid-login.component.html',
    styleUrls: [
        'rapid-login.component.less',
        '../../../layouts/rapid/rapid-layout.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class RapidLoginComponent extends HostLoginComponent {

    showHidePass() {
        this.showPassword = !this.showPassword;
    }
}
