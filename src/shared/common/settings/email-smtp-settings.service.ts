/** Core imports */
import { Injectable, Injector  } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailSmtpSettingsServiceProxy, SendTestEmailInput, EmailFromSettings, 
    EmailSmtpSettings, EmailSettingsEditDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class EmailSmtpSettingsService {
    private emailSmtpSettingsService: EmailSmtpSettingsServiceProxy;
    private notify: NotifyService;
    private ls: AppLocalizationService;
    private smptProviderHelpLinks = {
        'gmail': 'https://support.google.com/mail/?p=BadCredentials',
        'office': 'https://aka.ms/smtp_auth_disabled'
    };

    constructor(injector: Injector) {
        this.emailSmtpSettingsService = injector.get(EmailSmtpSettingsServiceProxy);
        this.notify = injector.get(NotifyService);
        this.ls = injector.get(AppLocalizationService);
    }

    getSmtpErrorHelpLink(host: string): string {
        let isGmail = host && host.includes('gmail.com'),
            isOffice = host && host.includes('office365.com');
        if (isGmail || isOffice)
            return this.smptProviderHelpLinks[isGmail ? 'gmail' : 'office'];
        return '';
    }

    sendTestEmail(input: SendTestEmailInput, finalizeCallback?: () => void, errorCallback?: () => void): void {
        this.emailSmtpSettingsService.sendTestEmail(input).pipe(
            finalize(() => finalizeCallback && finalizeCallback())
        ).subscribe((res) => {
            this.notify.info(this.ls.l('TestEmailSentSuccessfully'));
        }, () => {
            errorCallback && errorCallback();
        });
    }

    getSendTestEmailInput(emailAddress: string, emailSettings: EmailSettingsEditDto): SendTestEmailInput {
        let input = new SendTestEmailInput();
        input.emailAddress = emailAddress;
        input.from = new EmailFromSettings();
        input.from.emailAddress = emailSettings.defaultFromAddress;
        input.from.displayName = emailSettings.defaultFromDisplayName;
        input.smtp = new EmailSmtpSettings();
        input.smtp.host = emailSettings.smtpHost;
        input.smtp.port = emailSettings.smtpPort;
        input.smtp.enableSsl = emailSettings.smtpEnableSsl;
        input.smtp.domain = emailSettings.smtpDomain;
        input.smtp.userName = emailSettings.smtpUserName;
        input.smtp.password = emailSettings.smtpPassword;
        return input;
    }
}