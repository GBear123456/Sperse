/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

/** Application imports */
import {
    GmailSettingsDto,
    GmailSettingsEditDto,
    GoogleServiceProxy
} from '@shared/service-proxies/service-proxies';
import { GmailSettingsService } from '@shared/common/settings/gmail-settings.service';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'gmail-settings',
    templateUrl: './gmail-settings.component.html',
    styleUrls: ['./gmail-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GoogleServiceProxy, GmailSettingsService]
})
export class GmailSettingsComponent implements ITenantSettingsStepComponent {
    gmailSettings: GmailSettingsDto = new GmailSettingsDto();
    testEmailAddress: string = undefined;

    constructor(
        private googleService: GoogleServiceProxy,
        private gmailSettingsService: GmailSettingsService,
        private appSession: AppSessionService,
        private changeDetection: ChangeDetectorRef,
        private loadingService: LoadingService,
        public ls: AppLocalizationService
    ) {
    }

    ngOnInit(): void {
        this.gmailSettingsService.initGmail(() => this.initClient());
    }

    initClient() {
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

    save(): Observable<any> {
        let obj = new GmailSettingsEditDto();
        obj.init(this.gmailSettings);
        obj.forUser = false;
        return this.googleService.updateGmailSettings(obj).pipe(tap(() => {
            sessionStorage.removeItem('SupportedFrom' + this.appSession.userId);
        }));
    }

    isValid(): boolean {
        return true;
    }
}