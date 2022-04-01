/** Core imports */
import { ChangeDetectionStrategy, Component, Input, ChangeDetectorRef } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

/** Third party imports */
import { Observable } from 'rxjs';

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
    smtpProviderErrorLink: string;
    testEmailAddress: string;
    isSending: boolean = false;

    constructor(
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    sendTestEmail(): void {
        if (this.isSending)
            return;

        this.isSending = true;
        this.smtpProviderErrorLink = undefined;
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.settings);
        this.emailSmtpSettingsService.sendTestEmail(input, () => {
            this.isSending = false;
            this.changeDetectorRef.detectChanges();
        }, () => {
            this.smtpProviderErrorLink = this.testEmailAddress &&
                this.emailSmtpSettingsService.getSmtpErrorHelpLink(this.settings.smtpHost);
            if (this.smtpProviderErrorLink)
                this.changeDetectorRef.detectChanges();
        });
    }

    save(): Observable<void> {
        return this.tenantSettingsServiceProxy.updateEmailSettings(this.settings);
    }
}