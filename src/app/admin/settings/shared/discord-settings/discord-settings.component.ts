/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    DiscordExternalLoginProviderSettingsDto, TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'discord-settings',
    templateUrl: './discord-settings.component.html',
    styleUrls: ['./discord-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class DiscordSettingsComponent extends SettingsComponentBase {
    discordSettings: DiscordExternalLoginProviderSettingsDto;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getDiscordSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.discordSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    isValid(): boolean {
        let isAppIdSet = !!this.discordSettings.settings.appId;
        let isAppSecret = !!this.discordSettings.settings.appSecret;

        let isValid = (!isAppIdSet && !isAppSecret) || (isAppIdSet && isAppSecret);

        if (!isValid) {
            let fieldName = isAppIdSet ? 'AppSecret' : 'AppId';
            this.notify.error(this.l('RequiredField', this.l(fieldName)));
        }

        return isValid;
    }

    getOAuthRedirectUrls(): string[] {
        return [
            `${AppConsts.appBaseUrl}/account/login?provider=discord`,
            `${AppConsts.appBaseUrl}/account/signin?provider=discord`,
            `${AppConsts.appBaseUrl}/account/signup?provider=discord`,
            `${AppConsts.appConfigOrigin.remoteServiceBaseUrl}/account/oauth-redirect?provider=discord`
        ];
    }

    getSaveObs(): Observable<any> {
        return this.tenantSettingsService.updateDiscordSettings(this.discordSettings);
    }
}