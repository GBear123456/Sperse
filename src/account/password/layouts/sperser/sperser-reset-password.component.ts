/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './sperser-reset-password.component.html',
    styleUrls: ['./sperser-password.component.less'],
    animations: [accountModuleAnimation()]
})
export class SperserResetPasswordComponent extends HostResetPasswordComponent {
    public showPasswordComplexity: boolean;

    showHidePass(input) {
        let native = input.valueAccessor._elementRef.nativeElement,
            visible = native.type == 'text';
        native.type = visible ? 'password' : 'text';
    }

    getMinHeight(): number {
        let lines = 1;
        for (const item of Object.keys(this.passwordComplexitySetting)) {
            if (this.passwordComplexitySetting[item]) {
                lines++;
            }
        }

        return lines * 29.2 + 30;
    }

    onFocus(): void {
        this.showPasswordComplexity = true;
    }
}
