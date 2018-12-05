/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Injector, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import printJS from 'print-js';
import { from } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    selector: 'conditions-modal',
    templateUrl: './conditions-modal.component.html',
    styleUrls: [ './conditions-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsModalComponent extends ModalDialogComponent implements OnInit {
    conditionBody$: Observable<SafeHtml>;

    private conditionsOptions = {
        [ConditionsType.Terms]: {
            title: this.l('TermsOfService'),
            bodyLink: 'terms.html',
            apiBodyLink: 'GetTermsOfServiceDocument',
            downloadLink: 'DownloadTermsOfServicePdf',
            tenantProperty: 'customToSDocumentId',
            defaultLink: 'SperseTermsOfService.pdf'
        },
        [ConditionsType.Policies]: {
            title: this.l('PrivacyPolicy'),
            bodyLink: 'privacy.html',
            apiBodyLink: 'GetPrivacyPolicyDocument',
            downloadLink: 'DownloadPrivacyPolicyPdf',
            tenantProperty: 'customPrivacyPolicyDocumentId',
            defaultLink: 'SpersePrivacyPolicy.pdf'
        }
    };

    constructor(
        injector: Injector,
        private element: ElementRef,
        private sanitizer: DomSanitizer
    ) {
        super(injector);
    }

    ngOnInit() {
        if (!this.data.title)
            this.data.title = this.conditionsOptions[this.data.type].title;
        this.data.buttons = [
            {
                id: 'print',
                iconName: 'print-icon.svg',
                class: 'icon',
                action: this.printContent.bind(this)
            }
        ];
        if (!this.data.downloadDisabled)
            this.data.buttons.unshift({
                id: 'download',
                iconName: 'download-icon.svg',
                class: 'icon',
                action: this.download.bind(this)
            });
        if (!this.data.bodyUrl)
            this.data.bodyUrl = this.isTenantDocumentAvailable() ?
                this.getApiLink('apiBodyLink') : this.getDefaultLink('bodyLink');

        this.conditionBody$ = from(
            $.ajax({
                url: this.data.bodyUrl,
                method: 'GET'
            })
        ).pipe(
            map(html => this.sanitizer.bypassSecurityTrustHtml(html))
        );
    }

    download() {
        window.open(this.isTenantDocumentAvailable() ? 
            this.getApiLink('downloadLink') :
            this.getDefaultLink('defaultLink'), '_blank');
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
            documentTitle: this.data.title,
            style: '.visible-on-print { visibility: visible; text-align: center; }',
            onLoadingStart: () => {
                /** Height property works incorrectly with the following p if set in styles */
                document.querySelector('.visible-on-print')['style'].height = 'auto';
            },
            onLoadingEnd: () => {
                document.querySelector('.visible-on-print')['style'].height = '0';
            }
        });
    }
}
