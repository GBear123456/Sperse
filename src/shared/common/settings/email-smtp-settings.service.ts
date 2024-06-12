/** Core imports */
import { Injectable, Injector  } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { EmailSettingsTestServiceProxy, SendSMTPTestEmailInput, EmailFromSettings, 
    EmailSmtpSettings, EmailSettingsEditDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class EmailSmtpSettingsService {
    private emailSmtpSettingsService: EmailSettingsTestServiceProxy;
    private notify: NotifyService;
    private ls: AppLocalizationService;
    private smptProviderHelpLinks = {
        'gmail': 'https://support.google.com/mail/?p=BadCredentials',
        'office': 'https://aka.ms/smtp_auth_disabled'
    };

    public supportedProviders = [{
        name: 'Gmail', 
        host: 'smtp.gmail.com', 
        port: '465', 
        ssl: true, 
        domain: 'gmail.com', 
        icon: 'gmail.svg',
        imap: {host: 'imap.gmail.com', port: 993, ssl: true}
    }, {
        name: 'HotMail (OutLook)', 
        host: 'outlook.office365.com', 
        port: '587', 
        ssl: true, 
        domain: 'outlook.com', 
        icon: 'outlook.svg',
        imap: {host: 'outlook.office365.com', port: 993, ssl: true}
    }, {
        name: 'Yahoo', 
        host: 'smtp.mail.yahoo.com', 
        port: '465', 
        ssl: true, 
        domain: 'yahoo.com',
        icon: 'yahoo.svg', 
        imap: {host: 'imap.mail.yahoo.com', port: 993, ssl: true}
    }, {
        name: 'Migadu', 
        host: 'smtp.migadu.com', 
        port: '465', 
        ssl: true, 
        domain: 'migadu.com',
        icon: 'migadu.png',
        imap: {host: 'imap.migadu.com', port: 993, ssl: true}
    }, {
        name: 'Mandrill', 
        host: 'smtp.mandrillapp.com', 
        port: '465', 
        ssl: true, 
        domain: 'mandrillapp.com', 
        icon: 'mandrill.svg',
        imap: {host: undefined, port: undefined, ssl: false}
    }, {
        name: 'Mailtrap', 
        host: 'smtp.mailtrap.io', 
        port: '465', 
        ssl: true, 
        domain: 'mailtrap.io', 
        icon: 'mailtrap.png',
        imap: {host: 'imap.mailtrap.io', port: 993, ssl: true}
    }, {
        name: 'AOL', 
        host: 'smtp.aol.com', 
        port: '465', 
        ssl: true, 
        domain: 'aol.com',
        icon: 'aol.svg', 
        imap: {host: 'imap.aol.com', port: 993, ssl: true}
    }, {
        name: 'ProtonMail', 
        host: 'smtp.protonmail.com', 
        port: '465', 
        ssl: true, 
        domain: 'protonmail.com',
        icon: 'proton.png', 
        imap: {host: 'imap.protonmail.com', port: 993, ssl: true}
    }, {
        name: 'Zoho', 
        host: 'smtp.zoho.eu', 
        port: '465', 
        ssl: true, 
        domain: 'zoho.com', 
        icon: 'zoho.png',
        imap: {host: 'imap.zoho.com', port: 993, ssl: true}
    }];

    constructor(injector: Injector) {
        this.emailSmtpSettingsService = injector.get(EmailSettingsTestServiceProxy);
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

    sendTestEmail(input: SendSMTPTestEmailInput, finalizeCallback?: () => void, errorCallback?: () => void): void {
        this.emailSmtpSettingsService.sendSMTPTestEmail(input).pipe(
            finalize(() => finalizeCallback && finalizeCallback())
        ).subscribe((res) => {
            this.notify.info(this.ls.l('TestEmailSentSuccessfully'));
        }, () => {
            errorCallback && errorCallback();
        });
    }

    getSendTestEmailInput(emailAddress: string, emailSettings: EmailSettingsEditDto): SendSMTPTestEmailInput {
        let input = new SendSMTPTestEmailInput();
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