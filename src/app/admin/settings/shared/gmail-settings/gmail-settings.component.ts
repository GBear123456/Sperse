/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    GmailSettingsDto,
    GmailSettingsEditDto,
    TenantSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

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

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
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
    }

    getSaveObs(): Observable<any> {
        let obj = new GmailSettingsEditDto();
        obj.init(this.gmailSettings);
        return this.tenantSettingsService.updateGmailSettings(obj);
    }
}