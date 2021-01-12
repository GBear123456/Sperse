/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

/** Third party imports */
import { Observable, of } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    EmailSettingsEditDto,
    HostSettingsServiceProxy,
    SendTestEmailInput, TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppService } from '@app/app.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'email',
    templateUrl: 'email.component.html',
    styleUrls: [ '../shared/styles/common.less', 'email.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailComponent implements ITenantSettingsStepComponent {
    @Input() settings: EmailSettingsEditDto;
    testEmailAddress: string;
    constructor(
        private appService :AppService,
        private hostSettingsServiceProxy: HostSettingsServiceProxy,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private notifyService: NotifyService,
        public ls: AppLocalizationService
    ) {}

    sendTestEmail(): void {
        (this.appService.isHostTenant ? this.hostSettingsServiceProxy : this.tenantSettingsServiceProxy)
            .sendTestEmail(new SendTestEmailInput({
                emailAddress: this.testEmailAddress
            })).subscribe(() => {
                this.notifyService.info(this.ls.l('TestEmailSentSuccessfully'));
            });
    }

    save(): Observable<void> {
        return this.tenantSettingsServiceProxy.updateEmailSettings(this.settings);
    }
}