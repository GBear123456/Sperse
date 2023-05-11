/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

/** Application imports */
import {
    GmailSettingsDto,
    GmailSettingsEditDto,
    GoogleServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { GmailSettingsService } from '@shared/common/settings/gmail-settings.service';

@Component({
    selector: 'gmail-settings',
    templateUrl: './gmail-settings.component.html',
    styleUrls: ['./gmail-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GoogleServiceProxy, GmailSettingsService]
})
export class GmailSettingsComponent extends SettingsComponentBase {
    gmailSettings: GmailSettingsDto = new GmailSettingsDto();
    testEmailAddress: string = undefined;

    constructor(
        _injector: Injector,
        private googleService: GoogleServiceProxy,
        private gmailSettingsService: GmailSettingsService
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.gmailSettingsService.initGmail(() => this.initClient());
    }

    initClient() {
        this.testEmailAddress = this.appSession.user.emailAddress;
        this.startLoading();
        this.googleService.getGmailSettings(false)
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.gmailSettings = res;

                this.gmailSettingsService.initGmailClient(this.gmailSettings.clientId, (response) => {
                    this.startLoading();
                    this.googleService.setupGmail(false, response.code)
                        .pipe(
                            finalize(() => this.finishLoading())
                        )
                        .subscribe(() => {
                            this.initClient();
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

    sendTestEmail(): void {
        if (!this.gmailSettings.isConfigured)
            return;

        this.gmailSettingsService.sendTestEmail(this.testEmailAddress, this.gmailSettings.defaultFromAddress, this.gmailSettings.defaultFromDisplayName, false);
    }

    getSaveObs(): Observable<any> {
        let obj = new GmailSettingsEditDto();
        obj.init(this.gmailSettings);
        obj.forUser = false;
        return this.googleService.updateGmailSettings(obj).pipe(tap(() => {
            sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
        }));
    }
}