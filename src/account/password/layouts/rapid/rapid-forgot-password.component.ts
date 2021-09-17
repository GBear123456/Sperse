import { Component } from '@angular/core';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from "@root/account/password/layouts/host/host-forgot-password.component";

@Component({
    templateUrl: './rapid-forgot-password.component.html',
    animations: [accountModuleAnimation()],
    styleUrls: [
        'rapid-password.component.less',
        '../host/host-forgot-password.component.less',
        '../../../layouts/rapid/rapid-layout.component.less'
    ]
})

export class RapidForgotPasswordComponent extends HostForgotPasswordComponent {
}
