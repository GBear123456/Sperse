/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import { catchError, finalize,tap } from 'rxjs/operators';

/** Application imports */
import {
    EmailSettingsEditDto,
    GmailSettingsDto,
    GmailSettingsEditDto,
    GoogleServiceProxy,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { GmailSettingsService } from '@root/shared/common/settings/gmail-settings.service';
import { SettingService } from '../../settings/settings.service';
import { GmailAuthType } from './email-settings.enum';
@Component({
    selector: 'email-settings',
    templateUrl: './email-settings.component.html',
    styleUrls: ['./email-settings.component.less', '../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy, GoogleServiceProxy, GmailSettingsService]
})
export class EmailSettingsComponent extends SettingsComponentBase {
    emailSettings: EmailSettingsEditDto;
    testEmailAddress: string = undefined;
    smtpProviderErrorLink: string;
    showCustomSmptSettings = true;
    supportedProviders = this.emailSmtpSettingsService.supportedProviders;
    selectedProvider: any;

    gmailSettings: GmailSettingsDto = new GmailSettingsDto();

    gmailAuthTypes = [{
        type: GmailAuthType.SMTP,
        name: this.l('SMTP')
    }, {
        type: GmailAuthType.OAUTH,
        name: this.l('OAuth')
    }];

    selectedGmailAuthType: GmailAuthType.SMTP | GmailAuthType.OAUTH = GmailAuthType.SMTP;

    constructor(
        _injector: Injector,
        private route: ActivatedRoute,
        private router: Router,
        private tenantSettingsService: TenantSettingsServiceProxy,
        public emailSmtpSettingsService: EmailSmtpSettingsService,
        private gmailSettingsService: GmailSettingsService,
        private googleService: GoogleServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private settingService: SettingService
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
                    this.selectedProvider = this.supportedProviders.find(item => item.hosts.includes(this.emailSettings.smtpHost.toLowerCase())) || null;
                else
                    this.onProviderChanged(this.supportedProviders[0]);

                this.route.params.subscribe(params => {
                    if (params['id'] === 'other') this.onProviderChanged(null)
                    else this.onProviderChanged(this.supportedProviders.find(provider => provider.name.toLowerCase().search(params['id'])> -1));
                })

                this.changeDetection.detectChanges();
            });

        this.gmailSettingsService.initGmail(() => this.initGmailClient());
    }

    onProviderChanged(provider) {
        if (this.selectedProvider === provider)
            return;

        this.selectedProvider = provider;
        this.smtpProviderErrorLink = undefined;
        if (this.selectedProvider) {
            this.showCustomSmptSettings = true;
            this.emailSettings.smtpHost = this.selectedProvider.hosts[0];
            this.emailSettings.smtpPort = this.selectedProvider.port;
            this.emailSettings.smtpEnableSsl = this.selectedProvider.ssl;
            this.emailSettings.smtpDomain = this.selectedProvider.domain;
            this.emailSettings.imapHost = this.selectedProvider.imap.host;
            this.emailSettings.imapPort = this.selectedProvider.imap.port;
            this.emailSettings.imapUseSsl = this.selectedProvider.imap.ssl;
            this.emailSettings.isImapEnabled = false;
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
        if (this.selectedProvider?.domain == 'gmail.com' && this.selectedGmailAuthType == this.gmailAuthTypes[1].type) {
            if (!this.gmailSettings.isConfigured)
                return;
    
            this.gmailSettingsService.sendTestEmail(this.testEmailAddress, this.gmailSettings.defaultFromAddress, this.gmailSettings.defaultFromDisplayName, false);
        } else {
            this.startLoading();
            this.smtpProviderErrorLink = undefined;
            let input = this.emailSmtpSettingsService.getSendTestEmailInput(this.testEmailAddress, this.emailSettings);
            this.emailSmtpSettingsService.sendTestEmail(input, this.finishLoading.bind(this), () => this.checkHandlerErrorWarning());
        }
    }

    checkHandlerErrorWarning(forced = false) {
        this.smtpProviderErrorLink = (forced || this.testEmailAddress) &&
            this.emailSmtpSettingsService.getSmtpErrorHelpLink(this.emailSettings.smtpHost);
        if (this.smtpProviderErrorLink)
            this.changeDetection.detectChanges();
    }

    getSaveObs(): Observable<any> {
        if (this.selectedProvider?.domain == 'gmail.com' && this.selectedGmailAuthType == this.gmailAuthTypes[1].type) {
            let obj = new GmailSettingsEditDto();
                obj.init(this.gmailSettings);
                obj.forUser = false;
                return this.googleService.updateGmailSettings(obj).pipe(tap(() => {
                    sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
                }));
        } else {
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

    toggleGmailAuthType(selected) {
        this.selectedGmailAuthType = selected;
        this.changeDetection.detectChanges();
    }

    initGmailClient() {
        this.testEmailAddress = this.appSession.user.emailAddress;
        this.loadingService.startLoading();
        this.googleService.getGmailSettings(false)
            .pipe(
                finalize(() => this.loadingService.finishLoading())
            )
            .subscribe(res => {
                this.gmailSettings = res;

                this.gmailSettingsService.initGmailClient(this.gmailSettings.clientId, (response) => {
                    this.loadingService.startLoading();
                    this.googleService.setupGmail(false, response.code)
                        .pipe(
                            finalize(() => this.loadingService.finishLoading())
                        )
                        .subscribe(() => {
                            this.initGmailClient();
                        });
                });

                this.changeDetection.detectChanges();
            });
    }

    getAuthCode() {
        this.gmailSettingsService.getAuthCode();
    }

    disconnedGmail() {
        this.gmailSettingsService.disconnedGmail(false, () => {
            this.gmailSettings.isConfigured = false;
            this.gmailSettings.isEnabled = false;
            this.gmailSettings.defaultFromAddress = null;
            this.changeDetection.detectChanges();
        });
    }
}