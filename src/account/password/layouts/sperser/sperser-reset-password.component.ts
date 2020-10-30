/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './sperser-reset-password.component.html',
    styleUrls: [ './sperser-password.component.less' ],
    animations: [accountModuleAnimation()]
})
export class SperserResetPasswordComponent extends HostResetPasswordComponent {
    showHidePass(input) {
        let native = input.valueAccessor._elementRef.nativeElement,
            visible = native.type == 'text';
        native.type = visible ? 'password' : 'text';
    }
}
