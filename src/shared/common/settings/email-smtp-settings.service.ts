import { Injectable, Injector  } from '@angular/core';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailSmtpSettingsServiceProxy, SendTestEmailInput, EmailFromSettings, EmailSmtpSettings, EmailSettingsEditDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class EmailSmtpSettingsService {
    private emailSmtpSettingsService: EmailSmtpSettingsServiceProxy;
    private notify: NotifyService;
    private ls: AppLocalizationService;

    constructor(injector: Injector) {
        this.emailSmtpSettingsService = injector.get(EmailSmtpSettingsServiceProxy);
        this.notify = injector.get(NotifyService);
        this.ls = injector.get(AppLocalizationService);
    }

    sendTestEmail(input: SendTestEmailInput): void {
        this.emailSmtpSettingsService.sendTestEmail(input).subscribe((isSentSuccessfully) => {
            if (isSentSuccessfully) {
                this.notify.info(this.ls.l('TestEmailSentSuccessfully'));
            } else {
                this.notify.error(this.ls.l('SendingTestEmailFailed'));
            }
        });
    }

    getSendTestEmailInput(emailAddress: string, emailSettings: EmailSettingsEditDto): SendTestEmailInput {
        let input = new SendTestEmailInput();
        input.emailAddress = emailAddress;
        input.from = new EmailFromSettings();
        input.from.address = emailSettings.defaultFromAddress;
        input.from.displayName = emailSettings.defaultFromDisplayName;
        input.smtp = new EmailSmtpSettings();
        input.smtp.host = emailSettings.smtpHost;
        input.smtp.port = emailSettings.smtpPort;
        input.smtp.enableSsl = emailSettings.smtpEnableSsl;
        input.smtp.useDefaultCredentials = emailSettings.smtpUseDefaultCredentials;
        input.smtp.domain = emailSettings.smtpDomain;
        input.smtp.userName = emailSettings.smtpUserName;
        input.smtp.password = emailSettings.smtpPassword;
        return input;
    }
}
