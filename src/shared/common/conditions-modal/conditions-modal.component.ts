/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material';
import { Observable, from } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import printJS from 'print-js';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'conditions-modal',
    templateUrl: './conditions-modal.component.html',
    styleUrls: [ './conditions-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    conditionBody$: Observable<SafeHtml>;
    private conditionsOptions = {
        [ConditionsType.Terms]: {
            title: this.ls.l('TermsOfService'),
            bodyLink: 'terms.html',
            apiBodyLink: 'GetTermsOfServiceDocument',
            downloadLink: 'DownloadTermsOfServicePdf',
            tenantProperty: 'customToSDocumentId',
            defaultLink: 'SperseTermsOfService.pdf'
        },
        [ConditionsType.Policies]: {
            title: this.ls.l('PrivacyPolicy'),
            bodyLink: 'privacy.html',
            apiBodyLink: 'GetPrivacyPolicyDocument',
            downloadLink: 'DownloadPrivacyPolicyPdf',
            tenantProperty: 'customPrivacyPolicyDocumentId',
            defaultLink: 'SpersePrivacyPolicy.pdf'
        }
    };
    title: string;
    buttons: IDialogButton[] = [
        {
            id: 'print',
            iconName: 'print-icon.svg',
            class: 'icon',
            action: this.printContent.bind(this)
        }
    ];

    constructor(
        private element: ElementRef,
        private sanitizer: DomSanitizer,
        private ls: AppLocalizationService,
        private appSession: AppSessionService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.title = this.data.title || this.conditionsOptions[this.data.type].title;
        if (!this.data.downloadDisabled)
            this.buttons.unshift({
                id: 'download',
                iconName: 'download-icon.svg',
                class: 'icon',
                action: this.download.bind(this)
            });
        const bodyUrl = this.data.bodyUrl || (
                this.isTenantDocumentAvailable()
                    ? this.getApiLink('apiBodyLink')
                    : this.getDefaultLink('bodyLink')
                );

        this.conditionBody$ = from(
            $.ajax({
                url: bodyUrl,
                method: 'GET'
            })
        ).pipe(
            finalize(() => this.modalDialog.finishLoading()),
            map((html) => {
                return this.sanitizer.bypassSecurityTrustHtml(html);
            })
        );
    }

    download() {
        window.open(this.isTenantDocumentAvailable()
            ? this.getApiLink('downloadLink')
            : this.getDefaultLink('defaultLink'), '_blank');
    }

    getApiLink(link) {
        return AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/' + this.conditionsOptions[this.data.type][link] + '?tenantId=' + this.appSession.tenant.id;
    }

    getDefaultLink(link) {
        return AppConsts.appBaseHref + 'assets/documents/' + this.conditionsOptions[this.data.type][link];
    }

    isTenantDocumentAvailable() {
        return this.appSession.tenant && this.appSession.tenant[this.conditionsOptions[this.data.type].tenantProperty];
    }

    printContent() {
        printJS({
            type: 'html',
            printable: 'content',
            documentTitle: this.title,
            style: '.visible-on-print { visibility: visible; text-align: center; }',
            onLoadingStart: () => {
                /** Height property works incorrectly with the following p if set in styles */
                const visibleOnPrint = document.querySelector('.visible-on-print');
                if (visibleOnPrint) {
                    visibleOnPrint['style'].height = 'auto';
                }
            },
            onLoadingEnd: () => {
                const visibleOnPrint = document.querySelector('.visible-on-print');
                if (visibleOnPrint) {
                    visibleOnPrint['style'].height = '0';
                }
            }
        });
    }
}
