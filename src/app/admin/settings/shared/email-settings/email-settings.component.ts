/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

/** Application imports */
import {
    EmailSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';

@Component({
    selector: 'email-settings',
    templateUrl: './email-settings.component.html',
    styleUrls: ['./email-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class EmailSettingsComponent extends SettingsComponentBase {
    emailSettings: EmailSettingsEditDto;

    testEmailAddress: string = undefined;
    smtpProviderErrorLink: string;
    showCustomSmptSettings = true;
    supportedProviders = this.emailSmtpSettingsService.supportedProviders;
    selectedProvider: any;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        public emailSmtpSettingsService: EmailSmtpSettingsService
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.testEmailAddress = this.appSession.user.emailAddress;

        this.startLoading();
        this.tenantSettingsService.getEmailSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.emailSettings = res;
                this.showCustomSmptSettings = this.isHost || !!this.emailSettings.smtpHost;

                if (this.emailSettings.smtpHost)
                    this.selectedProvider = this.supportedProviders.find(item => item.host == this.emailSettings.smtpHost);

                if (!this.selectedProvider)
                    this.onProviderChanged(this.supportedProviders[0]);                

                this.changeDetection.detectChanges();
            });
    }

    onProviderChanged(provider) {
        this.selectedProvider = provider;
        this.smtpProviderErrorLink = undefined;
        if (this.selectedProvider) {
            this.showCustomSmptSettings = true;
            this.emailSettings.smtpHost = this.selectedProvider.host;
            this.emailSettings.smtpPort = this.selectedProvider.port;
            this.emailSettings.smtpEnableSsl = this.selectedProvider.ssl;
            this.emailSettings.smtpDomain = this.selectedProvider.domain;
            this.emailSettings.imapHost = this.selectedProvider.imap.host;
            this.emailSettings.imapPort = this.selectedProvider.imap.port;
            this.emailSettings.imapUseSsl = this.selectedProvider.imap.ssl;
            this.emailSettings.isImapEnabled = !!this.selectedProvider.imap.host;
        } else {
            this.showCustomSmptSettings = this.selectedProvider === null;
            this.emailSettings.smtpHost = undefined;
            this.emailSettings.smtpPort = undefined;
            this.emailSettings.smtpEnableSsl = false;
            this.emailSettings.smtpDomain = undefined;
            this.emailSettings.imapHost = undefined;
            this.emailSettings.imapPort = undefined;
            this.emailSettings.imapUseSsl = undefined;
            this.emailSettings.isImapEnabled = false;
        }

        this.changeDetection.detectChanges();
    }

    sendTestEmail(): void {
        this.startLoading();
        this.smtpProviderErrorLink = undefined;
        let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.emailSettings);
        this.emailSmtpSettingsService.sendTestEmail(input, this.finishLoading.bind(this), () => this.checkHandlerErrorWarning());
    }

    checkHandlerErrorWarning(forced = false) {
        this.smtpProviderErrorLink = (forced || this.testEmailAddress) &&
            this.emailSmtpSettingsService.getSmtpErrorHelpLink(this.emailSettings.smtpHost);
        if (this.smtpProviderErrorLink)
            this.changeDetection.detectChanges();
    }

    getSaveObs(): Observable<any> {
        this.smtpProviderErrorLink = undefined;
        if (!this.emailSettings.isImapEnabled) {
            this.emailSettings.imapHost = undefined;
            this.emailSettings.imapPort = undefined;
            this.emailSettings.imapUseSsl = undefined;
        }

        return this.tenantSettingsService.updateEmailSettings(this.emailSettings).pipe(
            catchError(error => {
                this.checkHandlerErrorWarning(true);
                return throwError(error);
            }),
            tap(() => {
                sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
            })
        );
    }
}