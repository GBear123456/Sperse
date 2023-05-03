/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    EmailSettingsTestServiceProxy,
    GmailSettingsDto,
    GmailSettingsEditDto,
    SendGmailTestEmailInput,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

declare const google: any;

@Component({
    selector: 'gmail-settings',
    templateUrl: './gmail-settings.component.html',
    styleUrls: ['./gmail-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy]
})
export class GmailSettingsComponent extends SettingsComponentBase {
    gmailSettings: GmailSettingsDto = new GmailSettingsDto();
    client;
    testEmailAddress: string = undefined;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private emailSettingsTestService: EmailSettingsTestServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        if (!google || !google.accounts) {
            jQuery.getScript('https://accounts.google.com/gsi/client', () => {
                this.initClient();
            });
        } else {
            this.initClient();
        }
    }

    initClient() {
        this.testEmailAddress = this.appSession.user.emailAddress;
        this.tenantSettingsService.getGmailSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.gmailSettings = res;

                if (this.gmailSettings.clientId) {
                    this.client = google.accounts.oauth2.initCodeClient({
                        client_id: this.gmailSettings.clientId,
                        scope: 'https://www.googleapis.com/auth/gmail.send',
                        ux_mode: 'popup',

                        callback: (response) => {
                            this.startLoading();
                            this.tenantSettingsService.setupGmail(response.code)
                                .pipe(
                                    finalize(() => this.finishLoading())
                                )
                                .subscribe(() => {
                                    this.gmailSettings.isConfigured = true;
                                    this.changeDetection.detectChanges();
                                });
                        },
                    });
                }

                this.changeDetection.detectChanges();
            });
    }

    getAuthCode() {
        if (this.client)
            this.client.requestCode();
        else
            this.message.error(this.l('MailerSettingsAreNotConfigured', 'GMail'));
    }

    disconnedGmail() {
        this.message.confirm('', this.l('AreYouSure'), (confirm) => {
            if (!confirm)
                return;

            this.startLoading();
            this.tenantSettingsService.disconnectGmail()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(() => {
                    this.gmailSettings.isConfigured = false;
                    this.changeDetection.detectChanges();
                });
        });
    }

    sendTestEmail(): void {
        if (!this.testEmailAddress || !this.gmailSettings.isConfigured)
            return;

        this.startLoading();
        this.emailSettingsTestService
            .sendGmailTestEmail(new SendGmailTestEmailInput({
                email: this.testEmailAddress,
                fromEmailAddress: this.gmailSettings.defaultFromAddress,
                fromDisplayName: this.gmailSettings.defaultFromDisplayName,
                userSettings: false
            }))
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.notify.info(this.l('TestEmailSentSuccessfully'));
            });
    }

    getSaveObs(): Observable<any> {
        let obj = new GmailSettingsEditDto();
        obj.init(this.gmailSettings);
        return this.tenantSettingsService.updateGmailSettings(obj);
    }
}