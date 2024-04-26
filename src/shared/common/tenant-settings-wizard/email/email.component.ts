/** Core imports */
import { ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
export class EmailComponent implements ITenantSettingsStepComponent, AfterViewInit {
    @Input() settings: EmailSettingsEditDto;

    supportedProviders = [{name: 'Gmail', host: 'smtp.gmail.com', port: '465', ssl: true, domain: 'gmail.com', imap: {host: 'imap.gmail.com', port: 993, ssl: true}}];
    selectedProvider: any;

    smtpProviderErrorLink: string;
    testEmailAddress: string;
    isSending: boolean = false;

    constructor(
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngAfterViewInit() {
        setTimeout(() => {
            if (this.settings && this.settings.smtpHost) {
                this.selectedProvider = this.supportedProviders.find(item => item.host == this.settings.smtpHost);
                this.changeDetectorRef.detectChanges();
            }
        }, 300);
    }

    sendTestEmail(): void {
        if (this.isSending)
            return;

        this.isSending = true;
        this.smtpProviderErrorLink = undefined;
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.settings);
        this.emailSmtpSettingsService.sendTestEmail(input, () => {
            this.isSending = false;
            this.changeDetectorRef.detectChanges();
        }, () => this.checkHandlerErrorWarning());
    }

    onProviderChanged() {
        if (this.selectedProvider) {
            this.settings.smtpHost = this.selectedProvider.host;
            this.settings.smtpPort = this.selectedProvider.port;
            this.settings.smtpEnableSsl = this.selectedProvider.ssl;
            this.settings.smtpDomain = this.selectedProvider.domain;
            this.settings.imapHost = this.selectedProvider.imap.host;
            this.settings.imapPort = this.selectedProvider.imap.port;
            this.settings.imapUseSsl = this.selectedProvider.imap.ssl;

        } else {
            this.settings.smtpHost = undefined;
            this.settings.smtpPort = undefined;
            this.settings.smtpEnableSsl = false;
            this.settings.smtpDomain = undefined;
            this.settings.imapHost = undefined;
            this.settings.imapPort = undefined;
            this.settings.imapUseSsl = undefined;
        }

        this.changeDetectorRef.detectChanges();
    }

    checkHandlerErrorWarning(forced = false) {
        this.smtpProviderErrorLink = (forced || this.testEmailAddress) &&
            this.emailSmtpSettingsService.getSmtpErrorHelpLink(this.settings.smtpHost);
        if (this.smtpProviderErrorLink)
            this.changeDetectorRef.detectChanges();
    }

    save(): Observable<void> {
        if (!this.settings.isImapEnabled) {
            this.settings.imapHost = undefined;
            this.settings.imapPort = undefined;
            this.settings.imapUseSsl = undefined;
        }

        return this.tenantSettingsServiceProxy.updateEmailSettings(this.settings).pipe(catchError(error => {
            this.checkHandlerErrorWarning(true);
            return throwError(error);
        }));
    }
}