/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { MessageService, NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    EmailSettingsTestServiceProxy, GoogleServiceProxy, SendGmailTestEmailInput
} from '@shared/service-proxies/service-proxies';
import { LoadingService } from '../loading-service/loading.service';

declare const google: any;

@Injectable()
export class GmailSettingsService {
    client;

    constructor(
        private googleService: GoogleServiceProxy,
        private emailSettingsTestService: EmailSettingsTestServiceProxy,
        private ls: AppLocalizationService,
        private notify: NotifyService,
        private message: MessageService,
        private loadingService: LoadingService
    ) {
    }

    initGmail(callback) {
        this.loadingService.startLoading();
        if (!window['google'] || !window['google']['accounts']) {
            jQuery.getScript('https://accounts.google.com/gsi/client', () => {
                this.loadingService.finishLoading();
                callback();
            });
        } else {
            this.loadingService.finishLoading();
            callback();
        }
    }

    initGmailClient(clientId: string, callback): any {
        if (!clientId)
            return;

        this.client = google.accounts.oauth2.initCodeClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.send',
            ux_mode: 'popup',

            callback: (response) => {
                if (!response.scope || response.scope.indexOf('https://www.googleapis.com/auth/gmail.send') < 0) {
                    this.message.info('Please allow sending emails on your behalf');
                    return;
                }

                callback(response);
            },
        });
    }

    getAuthCode() {
        if (this.client)
            this.client.requestCode();
        else
            this.message.error(this.ls.l('MailerSettingsAreNotConfigured', 'GMail'));
    }

    disconnedGmail(isForUser: boolean, callback) {
        this.message.confirm('', this.ls.l('AreYouSure'), (confirm) => {
            if (!confirm)
                return;

            this.loadingService.startLoading();
            this.googleService.disconnectGmail(isForUser)
                .pipe(
                    finalize(() => this.loadingService.finishLoading())
                )
                .subscribe(() => {
                    callback();
                });
        });
    }

    sendTestEmail(testEmailAddress: string, defaultFromAddress: string, defaultFromDisplayName: string, isForUser: boolean): void {
        if (!testEmailAddress)
            return;

        this.loadingService.startLoading();
        this.emailSettingsTestService
            .sendGmailTestEmail(new SendGmailTestEmailInput({
                email: testEmailAddress,
                fromEmailAddress: defaultFromAddress,
                fromDisplayName: defaultFromDisplayName,
                userSettings: isForUser
            }))
            .pipe(
                finalize(() => this.loadingService.finishLoading())
            )
            .subscribe(() => {
                this.notify.info(this.ls.l('TestEmailSentSuccessfully'));
            });
    }
}