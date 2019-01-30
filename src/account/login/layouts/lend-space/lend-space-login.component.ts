/** Core imports */
import { Component } from '@angular/core';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsType } from '@shared/AppEnums';
import { environment } from 'environments/environment';

@Component({
    templateUrl: './lend-space-login.component.html',
    styleUrls: [
        './lend-space-login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LendSpaceLoginComponent extends HostLoginComponent { 
    openConditionsDialog(type: ConditionsType) {
        let isTerms = (type == ConditionsType.Terms);
        this.dialog.open(ConditionsModalComponent, { 
            panelClass: ['slider', 'footer-slider'],
            data: {
                title: isTerms ? 'Terms of Use': 'Privacy Policy',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/' + (isTerms ? 'terms': 'policy') + '.html',
                downloadDisabled: true
            }
        });
    }
}