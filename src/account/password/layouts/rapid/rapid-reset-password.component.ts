/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from "@root/account/password/layouts/host/host-reset-password.component";

@Component({
    templateUrl: './rapid-reset-password.component.html',
    animations: [ accountModuleAnimation() ],
    styleUrls: [
        'rapid-password.component.less',
        '../../../layouts/rapid/rapid-layout.component.less'
    ]
})
export class RapidResetPasswordComponent extends HostResetPasswordComponent {
    showHidePass(input) {
        let native = input.valueAccessor._elementRef.nativeElement,
            visible = native.type == 'text';
        native.type = visible ? 'password' : 'text';
    }
}