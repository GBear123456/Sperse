/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ConditionsModalComponent } from './conditions-modal.component';
import { ContditionsModalData } from './conditions-modal-data';

@Injectable()
export class ConditionsModalService {
    private conditionsOptions = {
        [ConditionsType.Terms]: {
            title: this.ls.l('TermsOfService'),
            apiBodyLink: 'GetTermsOfServiceDocument',
            hostBodyLink: 'terms.html',
            downloadLink: 'DownloadTermsOfServicePdf',
            hostDownloadLink: 'SperseTermsOfService.pdf',
            tenantProperty: 'customToSDocumentId'
        },
        [ConditionsType.Policies]: {
            title: this.ls.l('PrivacyPolicy'),
            apiBodyLink: 'GetPrivacyPolicyDocument',
            hostBodyLink: 'privacy.html',
            downloadLink: 'DownloadPrivacyPolicyPdf',
            hostDownloadLink: 'SpersePrivacyPolicy.pdf',
            tenantProperty: 'customPrivacyPolicyDocumentId',
        }
    };
    constructor(
        private appSession: AppSessionService,
        private ls: AppLocalizationService,
        private dialog: MatDialog
    ) { }

    openModal(config: MatDialogConfig<ContditionsModalData>) {
        if (!config.data.bodyUrl && !config.data.hasOwnDocument && !this.isDocumentAvailable(config.data.type))
            return;

        if (!config.data.title)
            config.data.title = this.conditionsOptions[config.data.type].title;

        if (!config.data.bodyUrl)
            config.data.bodyUrl = this.getHtmlUrl(config.data.type, config.data.tenantId);

        if (!config.data.downloadLink)
            config.data.downloadLink = this.getApiLink(config.data.type, 'downloadLink', this.appSession.tenantId);

        this.dialog.open<ConditionsModalComponent, ContditionsModalData>(
            ConditionsModalComponent,
            config
        );
    }

    hasTermsOrPolicy(): boolean {
        return this.isDocumentAvailable(ConditionsType.Terms) ||
            this.isDocumentAvailable(ConditionsType.Policies);
    }

    isDocumentAvailable(type: ConditionsType): boolean {
        return this.getDocumentId(type);
    }

    getHtmlUrl(type: ConditionsType, tenantId: number = undefined): string {
        if (tenantId === undefined)
            tenantId = this.appSession.tenantId;

        return this.getApiLink(type, 'apiBodyLink', tenantId);
    }

    private getDocumentId(type: ConditionsType) {
        return this.appSession.appearanceConfig[this.conditionsOptions[type].tenantProperty];
    }

    private getApiLink(type: ConditionsType, link: string, tenantId: number): string {
        return AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/' + this.conditionsOptions[type][link] + '?tenantId=' + (tenantId || '');
    }

    private getDefaultLink(type: ConditionsType, link: string): string {
        return AppConsts.appBaseHref + 'assets/documents/' + this.conditionsOptions[type][link];
    }
}