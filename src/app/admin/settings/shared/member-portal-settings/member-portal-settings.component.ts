/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AbstractControlDirective } from '@angular/forms';

/** Application imports */
import {
    MemberPortalSettingsDto, TenantLoginInfoDto, TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'member-portal-settings',
    templateUrl: './member-portal-settings.component.html',
    styleUrls: ['./member-portal-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class MemberPortalSettingsComponent extends SettingsComponentBase {
    @ViewChild('memberPortalUrl') memberPortalUrl: AbstractControlDirective;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    memberPortalSettings: MemberPortalSettingsDto = new MemberPortalSettingsDto();

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.tenantSettingsService.getMemberPortalSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe((settings: MemberPortalSettingsDto) => {
                this.memberPortalSettings = settings;
                this.changeDetection.detectChanges();
            }
        );
    }

    isValid() {
        return this.memberPortalUrl.valid || this.memberPortalUrl.pristine;
    }

    getSaveObs(): Observable<any> {
        if (!this.memberPortalSettings.url)
            this.memberPortalSettings.url = undefined;
        return this.tenantSettingsService.updateMemberPortalSettings(this.memberPortalSettings);
    }
}