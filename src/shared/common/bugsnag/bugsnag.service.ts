/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import * as BugsnagCore from '@bugsnag/core';
import bugsnag from '@bugsnag/js';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from '@root/environments/environment';
const { version } = require('../../../../package.json');

@Injectable()
export class BugsnagService {
    bugsnagClient: BugsnagCore.Client;
    bugsnagApiKey: string;
    bugsnagConfig = {
        appType: 'WebUI',
        appVersion: version,
        releaseStage: environment.releaseStage
    };

    constructor() {
        const generalInfo = window['generalInfo'];
        if (generalInfo && generalInfo.userConfig && generalInfo.userConfig.setting && generalInfo.userConfig.setting.values) {
            let isEnabled = generalInfo.userConfig.setting.values['Integrations.Bugsnag.IsEnabled'] == 'True';
            this.bugsnagApiKey = isEnabled ? generalInfo.userConfig.setting.values['Integrations.Bugsnag.UIApiKey'] : null;
        } else {
            this.bugsnagApiKey = null;
        }
        if (this.bugsnagApiKey) {
            this.bugsnagClient = bugsnag({
                ...this.bugsnagConfig,
                apiKey: this.bugsnagApiKey
            });
        }
    }

    updateBugsnagWithUserInfo(appSessionService: AppSessionService) {
        if (this.bugsnagApiKey) {
            const user = appSessionService.user;
            const tenantName = appSessionService.tenantName || 'Host';
            const tenant = appSessionService.tenant;
            if (user && user.name) {
                this.bugsnagClient.user = {
                    id: tenant ? tenant.id + ':' + appSessionService.userId : appSessionService.userId,
                    name: `${tenantName}\\${user.name}`,
                    email: user.emailAddress ? user.emailAddress : (user.name.indexOf('@') > -1 ? user.name : '')
                };
            }
            this.bugsnagClient.metaData = {
                tenant: {
                    tenantId: tenant ? tenant.id : '',
                    tenantName: tenantName,
                    tenancyName: appSessionService.tenancyName
                }
            };
        }
    }
}
