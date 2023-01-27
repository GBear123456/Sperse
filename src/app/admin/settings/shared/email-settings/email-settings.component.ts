/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private emailSmtpSettingsService: EmailSmtpSettingsService
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
                this.changeDetection.detectChanges();
            });
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
        return this.tenantSettingsService.updateEmailSettings(this.emailSettings).pipe(catchError(error => {
            this.checkHandlerErrorWarning(true);
            return throwError(error);
        }));
    }
}