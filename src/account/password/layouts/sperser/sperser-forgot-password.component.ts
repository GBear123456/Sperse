/** Core imports */
import {Component} from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostForgotPasswordComponent } from '../host/host-forgot-password.component';
import { SendAutoLoginLinkInput } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './sperser-forgot-password.component.html',
    styleUrls: [
        '../host/host-forgot-password.component.less', 
        './sperser-password.component.less' 
    ],
    animations: [accountModuleAnimation()]
})
export class SperserForgotPasswordComponent extends HostForgotPasswordComponent {
    model: SendAutoLoginLinkInput = new SendAutoLoginLinkInput();
    isRequestSent = false;

    sendRequest(forced?: boolean): void {
        if (forced || this.form.valid) {
            abp.ui.setBusy();
            this.accountProxy.sendAutoLoginWithReset(this.model).pipe(
                finalize(() => abp.ui.clearBusy())
            ).subscribe(() => this.isRequestSent = true);
        }
    }
}