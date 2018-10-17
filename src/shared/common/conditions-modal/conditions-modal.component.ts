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
            title: this.l('SperseTermsOfService'),
            bodyLink: 'terms.html',
            downloadLink: 'SpersePrivacyPolicy.pdf'
        },
        [ConditionsType.Policies]: {
            title: this.l('SpersePrivacyPolicy'),
            bodyLink: 'privacy.html',
            downloadLink: 'SperseTermsOfService.pdf'
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
        this.data.title = this.conditionsOptions[this.data.type].title;
        this.data.buttons = [
            {
                id: 'download',
                iconName: 'download-icon.svg',
                class: 'icon',
                action: this.download.bind(this)
            },
            {
                id: 'print',
                iconName: 'print-icon.svg',
                class: 'icon',
                action: this.printContent.bind(this)
            }
        ];
        this.conditionBody$ = from($.ajax({
            url: AppConsts.appBaseHref + 'assets/documents/' + this.conditionsOptions[this.data.type].bodyLink,
            method: 'GET'
        })).pipe(
            map(html => this.sanitizer.bypassSecurityTrustHtml(html))
        );
    }

    download() {
        window.open(AppConsts.appBaseHref + 'assets/documents/' + this.conditionsOptions[this.data.type].downloadLink, '_blank');
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
