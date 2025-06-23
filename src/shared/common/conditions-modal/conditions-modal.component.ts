/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Inject, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, from } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import printJS from 'print-js';

/** Application imports */
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ContditionsModalData } from './conditions-modal-data'

@Component({
    selector: 'conditions-modal',
    templateUrl: './conditions-modal.component.html',
    styleUrls: [ './conditions-modal.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    conditionBody$: Observable<SafeHtml>;
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
        private sanitizer: DomSanitizer,
        @Inject(MAT_DIALOG_DATA) private data: ContditionsModalData
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.title = this.data.title;
        if (!this.data.downloadDisabled)
            this.buttons.unshift({
                id: 'download',
                iconName: 'download-icon.svg',
                class: 'icon',
                action: this.download.bind(this)
            });

        this.conditionBody$ = from(
            $.ajax({
                url: this.data.bodyUrl,
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
        window.open(this.data.downloadLink, '_blank');
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
