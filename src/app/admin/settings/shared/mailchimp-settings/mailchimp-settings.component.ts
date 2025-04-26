/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import { Link2, AlertCircle, Check } from 'lucide-angular';

/** Application imports */
import {
    MailchimpSettingsDto,
    MailchimpServiceProxy,
    MailchimpSettingsEditDto,
    MailchimpListDto
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'mailchimp-settings',
    templateUrl: './mailchimp-settings.component.html',
    styleUrls: ['../settings-base.less', './mailchimp-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MailchimpServiceProxy]
})
export class MailchimpSettingsComponent extends SettingsComponentBase {
    readonly AlertIcon = AlertCircle
    readonly LinkIcon = Link2;
    readonly CheckIcon = Check;

    mailchimpSettings: MailchimpSettingsDto = new MailchimpSettingsDto();
    listsDataSource: MailchimpListDto[] = [];

    constructor(
        _injector: Injector,
        private mailchimpService: MailchimpServiceProxy,
        private route: ActivatedRoute,
        private router: Router
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.route.queryParams.pipe(
            first()
        ).subscribe(params => {
            if (params['code']) {
                this.mailchimpService.exchangeOAuthCode(params['code'], this.getRedirectUrl())
                    .subscribe(() => {
                        this.getSettings();
                    });
                this.clearCodeParam();
            }
            else {
                this.getSettings();
            }
        });
    }

    getSettings() {
        this.mailchimpService.getSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.mailchimpSettings = res;
                if (res.isConfigured) {
                    this.getListsData();
                }
                this.changeDetection.detectChanges();
            });
    }

    getListsData() {
        this.mailchimpService.getLists()
            .subscribe(res => {
                this.listsDataSource = res;
                this.changeDetection.detectChanges();
            });
    }

    setupOAuth() {
        if (this.mailchimpSettings.isConfigured || !this.mailchimpSettings.clientId)
            return;

        this.startLoading();
        location.href = `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${this.mailchimpSettings.clientId}&redirect_uri=${this.getRedirectUrl()}`;
    }

    clearCodeParam() {
        this.router.navigate([], {
            queryParams: {
                'code': null,
                'error': null,
                'error_description': null
            },
            queryParamsHandling: 'merge'
        });
    }

    getRedirectUrl(): string {
        //Mailchimp do not support localhost for redirect Url. They use 127.0.0.1 instead. To test locally set 'ng serve --host 127.0.0.1' in package.json (+cors on server)
        let baseUrl = AppConsts.appBaseUrl.includes('localhost') ? 'http://127.0.0.1:7200' : AppConsts.appBaseUrl;
        return `${baseUrl}${location.pathname}?tab=Mailchimp`;
    }

    disconnect() {
        if (!this.mailchimpSettings.isConfigured)
            return;

        this.startLoading();
        this.mailchimpService.disconnect()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.mailchimpSettings.isConfigured = false;
                this.mailchimpSettings.isEnabled = false;
                this.mailchimpSettings.listId = null;

                this.listsDataSource = [];
                this.changeDetection.detectChanges();
            });
    }

    isValid(): boolean {
        if (this.mailchimpSettings.isConfigured && !this.mailchimpSettings.listId) {
            this.notify.error(this.l('RequiredField', 'List'));
            return false;
        }

        return super.isValid();
    }

    getSaveObs(): Observable<any> {
        let obj = new MailchimpSettingsEditDto({
            isEnabled: this.mailchimpSettings.isEnabled,
            listId: this.mailchimpSettings.listId
        });
        return this.mailchimpService.updateSettings(obj);
    }
}