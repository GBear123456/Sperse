/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './hoa-reset-password.component.html',
    styleUrls: [
        '../../../layouts/hoa/hoa-layout.component.less',
        './hoa-password.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class HoaResetPasswordComponent extends HostResetPasswordComponent {
    showHidePass(input) {
        let native = input.valueAccessor._elementRef.nativeElement,
            visible = native.type == 'text';
        native.type = visible ? 'password' : 'text';
    }
}
