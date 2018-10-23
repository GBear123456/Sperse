import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ZendeskService {

    constructor(private zendeskWidgetService: ngxZendeskWebwidgetService) {}

    private isZendeskWebwidgetSetuped = false;
    private showZendeskWebwidgetTimeout: any;

    private setup() {
        if (this.isZendeskWebwidgetSetuped) {
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
            if (environment.zenDeskEnabled) {
                this.setup();
                this.showZendeskWebwidgetTimeout = setTimeout(() => {
                    this.zendeskWidgetService.show();
                }, 2000);
            }
        } catch(e) { } 
    }

    hideWidget() {
        try {
            if (environment.zenDeskEnabled) {
                clearTimeout(this.showZendeskWebwidgetTimeout);
                this.zendeskWidgetService.hide();
            }
        } catch(e) { } 
    }
}