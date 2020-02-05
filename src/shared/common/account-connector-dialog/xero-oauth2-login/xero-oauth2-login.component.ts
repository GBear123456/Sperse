/** Core imports */
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

/** Third party imports */
import { finalize, filter, first, switchMap } from 'rxjs/operators';

/** Application imports */
import { GetSetupAccountsLinkOutput, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { SyncTypeIds } from '@shared/AppEnums';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'xero-oauth2-login',
    template: ``
})
export class XeroOauth2LoginComponent implements OnInit {
    @Output() onComplete: EventEmitter<number> = new EventEmitter();

    constructor(
        private syncServiceProxy: SyncServiceProxy,
        private syncProgressService: SynchProgressService,
        private cfoService: CFOService,
        private loadingService: LoadingService
    ) {}

    ngOnInit() {
        this.loadingService.startLoading();
        this.getSetupAccountLink();
    }

    getSetupAccountLink() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncServiceProxy.getSetupAccountsLink(
                <any>this.cfoService.instanceType,
                this.cfoService.instanceId,
                SyncTypeIds.XeroOAuth2,
                null,
                null
            ).pipe(
                finalize(() => this.loadingService.finishLoading())
            ))
        ).subscribe((result: GetSetupAccountsLinkOutput) => {
            const setupAccountWindow = window.open(
                result.setupAccountsLink,
                '_blank',
                `location=yes,height=680,width=640,scrollbars=yes,status=yes,left=${(window.innerWidth / 2) - 320},top=${(window.innerHeight / 2) - 340}`
            );
            if (setupAccountWindow) {
                let interval = setInterval(() => {
                    if (setupAccountWindow.closed) {
                        if (!this.cfoService.hasTransactions) {
                            this.cfoService.instanceChangeProcess(true).subscribe(() => {
                                this.syncProgressService.startSynchronization(true, true);
                            });
                        }
                        clearInterval(interval);
                        this.onComplete.emit();
                    }
                }, 2000);
            }
        });
    }
}
