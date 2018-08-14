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
    }

    showWidget() {
        if (environment.zenDeskEnabled) {
            this.setup();
            this.showZendeskWebwidgetTimeout = setTimeout(() => {
                this.zendeskWidgetService.show();
            }, 2000);
        }
    }

    hideWidget() {
        if (environment.zenDeskEnabled) {
            clearTimeout(this.showZendeskWebwidgetTimeout);
            this.zendeskWidgetService.hide();
        }
    }
}
