/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

/** Third party imports */
import { Observable, of } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    EmailSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';

@Component({
    selector: 'email',
    templateUrl: 'email.component.html',
    styleUrls: [ '../shared/styles/common.less', 'email.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ EmailSmtpSettingsService ]
})
export class EmailComponent implements ITenantSettingsStepComponent {
    @Input() settings: EmailSettingsEditDto;
    testEmailAddress: string;
    constructor(
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        public ls: AppLocalizationService
    ) {}

    sendTestEmail(): void {
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.settings);
        this.emailSmtpSettingsService.sendTestEmail(input);
    }

    save(): Observable<void> {
        return this.tenantSettingsServiceProxy.updateEmailSettings(this.settings);
    }
}