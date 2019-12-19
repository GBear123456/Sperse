/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostAutoLoginComponent } from '../host/host-auto-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';
import { environment } from 'environments/environment';

@Component({
    templateUrl: './lend-space-auto-login.component.html',
    styleUrls: [
        './lend-space-auto-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LendSpaceAutoLoginComponent extends HostAutoLoginComponent {
    openConditionsDialog(type: ConditionsType) {
        let isTerms = (type == ConditionsType.Terms);
        this.dialog.open(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: {
                title: isTerms ? 'Terms of Use' : 'Privacy Policy',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/' + (isTerms ? 'terms' : 'policy') + '.html',
                downloadDisabled: true
            }
        });
    }
}
