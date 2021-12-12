/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostResetPasswordComponent } from '../host/host-reset-password.component';

@Component({
    templateUrl: './sperser-reset-password.component.html',
    styleUrls: ['./sperser-password.component.less'],
    animations: [accountModuleAnimation()]
})
export class SperserResetPasswordComponent extends HostResetPasswordComponent implements OnInit {
    public showPasswordComplexity: boolean;
    public minHeight: number;

    showHidePass(input) {
        let native = input.valueAccessor._elementRef.nativeElement,
            visible = native.type == 'text';
        native.type = visible ? 'password' : 'text';
    }

    ngOnInit(): void {
        this.minHeight = 0;
        let lines = 1;
        for (const item in this.passwordComplexitySetting) {
            if (item !== 'init' && item !== 'toJSON' && this.passwordComplexitySetting[item]) {
                lines++;
            }
        }
        this.minHeight = lines * 29.2 + 30;
    }

    onFocus(): void {
        this.showPasswordComplexity = true;
    }
}
