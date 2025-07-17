/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';
import { AbstractControlDirective } from '@angular/forms';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantLoginInfoDto,
    TenantSettingsServiceProxy,
    MemberPortalSettingsDto
} from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

@Component({
    selector: 'member-portal',
    templateUrl: 'member-portal.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'member-portal.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberPortalComponent implements ITenantSettingsStepComponent {
    @ViewChild('memberPortalUrl') memberPortalUrl: AbstractControlDirective;
    siteUrlRegexPattern = AppConsts.regexPatterns.siteUrl;
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    memberPortalSettings: MemberPortalSettingsDto = new MemberPortalSettingsDto();

    constructor(
        private appSession: AppSessionService,
        private tenantSettingsProxy: TenantSettingsServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantSettingsProxy.getMemberPortalSettings().subscribe(
            (settings: MemberPortalSettingsDto) => {
                this.memberPortalSettings = settings;
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    save(): Observable<any> {
        if (!this.memberPortalSettings.url)
            this.memberPortalSettings.url = undefined;
        return this.tenantSettingsProxy.updateMemberPortalSettings(this.memberPortalSettings);
    }

    isValid(): boolean {
        return true;
    }
}