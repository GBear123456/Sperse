import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ZendeskService {
    private accountUrl: string;

    constructor(private zendeskWidgetService: ngxZendeskWebwidgetService) {
        this.accountUrl = abp.setting.values['Integrations:Zendesk:AccountUrl'];
    }

    private isZendeskWebwidgetSetuped = false;
    private showZendeskWebwidgetTimeout: any;

    private setup() {
        if (!this.accountUrl || this.isZendeskWebwidgetSetuped) {
            return;
        }

        try {
            this.zendeskWidgetService.setSettings(
                {
                    webWidget: {
                        launcher: {
                            label: {
                                '*': abp.localization.localize('QuestionsOrFeedback',
                                    AppConsts.localization.defaultLocalizationSourceName)
                            }
                        }
                    }
                }
            );

            this.isZendeskWebwidgetSetuped = true;
        } catch(e) { 
            this.isZendeskWebwidgetSetuped = false;
        } 
    }

    showWidget() {
        try {
            if (this.accountUrl && environment.zenDeskEnabled) {
                this.setup();
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
        } catch(e) { } 
    }
}