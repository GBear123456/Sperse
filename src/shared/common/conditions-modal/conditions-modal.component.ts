import { Component, ChangeDetectionStrategy, OnInit, Injector, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ConditionsType } from '@shared/AppEnums';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PrinterService } from '@shared/common/printer/printer.service';
import { FileFormat } from '@shared/common/printer/file-format.enum';

@Component({
    selector: 'conditions-modal',
    templateUrl: './conditions-modal.component.html',
    styleUrls: [ './conditions-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ PrinterService ]
})
export class ConditionsModalComponent extends ModalDialogComponent implements OnInit {
    conditionBody$: Observable<SafeHtml>;
    conditionBody: SafeHtml;

    private conditionsOptions = {
        [ConditionsType.Terms]: {
            title: this.l('SperseTermsOfService'),
            bodyLink: '/docs/terms.html',
            downloadLink: '/docs/SpersePrivacyPolicy.pdf'
        },
        [ConditionsType.Policies]: {
            title: this.l('SpersePrivacyPolicy'),
            bodyLink: '/docs/privacy.html',
            downloadLink: '/docs/SperseTermsOfService.pdf'
        }
    };

    constructor(
        injector: Injector,
        private http: HttpClient,
        private element: ElementRef,
        private sanitizer: DomSanitizer,
        private printerService: PrinterService
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
        this.conditionBody$ = this.http.get(
            AppConsts.remoteServiceBaseUrl + this.conditionsOptions[this.data.type].bodyLink,
            { responseType: 'text' }
        ).pipe(
            /** To avoid cutting of style tag from html */
            tap(body => this.conditionBody = body),
            map(html => this.sanitizer.bypassSecurityTrustHtml(html))
        );
    }

    download() {
        window.open(AppConsts.remoteServiceBaseUrl + this.conditionsOptions[this.data.type].downloadLink, '_blank');
    }

    printContent() {
        this.printerService.printDocument(this.conditionBody, FileFormat.Html);
    }
}
