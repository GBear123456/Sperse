import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { extend } from 'underscore';

@Injectable()
export class ZendeskService {
    private accountUrl: string;

    constructor(
        private zendeskWidgetService: ngxZendeskWebwidgetService,
        private _appSession: AppSessionService
    ) {
        this.accountUrl = abp.setting.values['Integrations:Zendesk:AccountUrl'];
    }

    private isZendeskWebwidgetSetuped = false;
    private showZendeskWebwidgetTimeout: any;

    private setup(settings?) {
        if (!this.accountUrl || this.isZendeskWebwidgetSetuped) {
            return;
        }

        try {
            let tenant = this._appSession.tenant;
            if (tenant && (tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.LendSpace))
                settings = { position: { horizontal: 'left', vertical: 'bottom' } };
            this.zendeskWidgetService.setSettings(
                {
                    webWidget: extend({
                        launcher: {
                            label: {
                                '*': abp.localization.localize('QuestionsOrFeedback',
                                    AppConsts.localization.defaultLocalizationSourceName)
                            }
                        }
                    }, settings)
                }
            );

            this.isZendeskWebwidgetSetuped = true;
        } catch(e) {
            this.isZendeskWebwidgetSetuped = false;
        }
    }

    showWidget(settings?) {
        try {
            if (this.accountUrl && environment.zenDeskEnabled) {
                this.setup(settings);
                clearTimeout(this.showZendeskWebwidgetTimeout);
                this.showZendeskWebwidgetTimeout = setTimeout(() => {
                    this.zendeskWidgetService.show();
                }, 2000);
            }
        } catch(e) { }
    }

    hideWidget() {
        try {
            if (this.accountUrl && environment.zenDeskEnabled) {
                clearTimeout(this.showZendeskWebwidgetTimeout);
                this.zendeskWidgetService.hide();
            }
        } catch (e) { }
    }
}