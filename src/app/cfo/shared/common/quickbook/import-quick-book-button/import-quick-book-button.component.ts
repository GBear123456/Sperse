/** Core imports */
import { Component, Output, Input, EventEmitter } from '@angular/core';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { QuickBookServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { QuickBookConnectionLinkResult } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { MessageService } from '@abp/message/message.service';

@Component({
    selector: 'import-quick-book-button',
    templateUrl: './import-quick-book-button.component.html',
    styleUrls: ['./import-quick-book-button.component.less'],
    providers: [ QuickBookServiceProxy ]
})
export class ImportFromQuickBooksButtonComponent {
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    @Input() override: boolean;

    constructor(
        private quickBookService: QuickBookServiceProxy,
        private loadingService: LoadingService,
        private ls: AppLocalizationService,
        private cfoService: CFOService,
        private messageService: MessageService
    ) {}

    private checkConnection(tryNewConnect: boolean) {
        this.loadingService.startLoading();
        this.quickBookService.checkToken(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId)
            .pipe(
                switchMap(result => {
                    if (result) {
                        return this.syncCoA();
                    } else {
                        if (tryNewConnect) {
                            return this.newConnect();
                        } else {
                            this.onDialogClose(null);
                            return of(result);
                        }
                    }
                }),
                finalize(() => this.loadingService.finishLoading())
            ).subscribe();
    }

    private newConnect(): Observable<QuickBookConnectionLinkResult> {
        return this.quickBookService.getQuickBookConnectionLink(
            InstanceType[this.cfoService.instanceType],
            this.cfoService.instanceId
        ).pipe(
            tap((result: QuickBookConnectionLinkResult) => {
                if (result.connectionLink) {
                    let qbWindow = window.open(result.connectionLink, 'Quick Book Connection', 'menubar=0,scrollbars=1,width=780,height=900,top=10');
                    this.checkWindowClose(qbWindow);
                }
            })
        );
    }

    private syncCoA(): Observable<void> {
        return this.quickBookService.syncChartOfAccounts(
            InstanceType[this.cfoService.instanceType],
            this.cfoService.instanceId,
            this.override
        ).pipe(
            tap(() => this.onDialogClose(null))
        );
    }

    private checkWindowClose(qbWindow: Window) {
        if (qbWindow.closed)
            this.checkConnection(false);
        else {
            setTimeout(() => { this.checkWindowClose(qbWindow); }, 100);
        }
    }

    private onDialogClose(e) {
        this.onClose.emit(e);
    }

    buttonClick(): void {
        this.messageService.confirm(this.ls.l('ImportQbCoAConfirmation'), this.ls.l('ImportQbCoAConfirmationTitle'), (result) => {
            if (result) {
                this.checkConnection(true);
            }
        });
    }
}
