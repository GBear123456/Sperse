/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { ExternalLoginProvider } from '../../login.service';
import { HostLoginComponent } from '../host/host-login.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    templateUrl: './signin.component.html',
    styleUrls: [
        './signin.component.less',
        '../../../../assets/fonts/sperser-extension.css'
    ],
    animations: [accountModuleAnimation()]
})
export class SigninComponent extends HostLoginComponent implements OnInit {
    get redirectToSignUp() { return true; }

    hostName = AppConsts.defaultTenantName;
    showProviders = false;
    linkedInProvider: ExternalLoginProvider;
    discordProvider: ExternalLoginProvider;

    ngOnInit(): void {
        super.ngOnInit();

        this.loginService.externalLoginProviders$.subscribe(providers => {
            this.linkedInProvider = providers.find(x => x.name == ExternalLoginProvider.LINKEDIN && !!x.clientId);
            this.discordProvider = providers.find(x => x.name == ExternalLoginProvider.DISCORD && !!x.clientId);
            this.showProviders = !!this.linkedInProvider || !!this.discordProvider;
        });
    }

    openConditionsDialog(type: ConditionsType) {
        window.open(this.conditionsModalService.getHtmlUrl(type), '_blank');
    }
}