/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { filter, first } from 'rxjs/operators';

/** Application imports */
import { GetSetupAccountsLinkOutput, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { SyncTypeIds } from '@shared/AppEnums';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';

@Component({
    selector: 'xero-oauth2-login',
    template: ``
})
export class XeroOauth2LoginComponent {
    setupAccountWindow: any;

    constructor(
        private syncServiceProxy: SyncServiceProxy,
        private syncProgressService: SynchProgressService,
        private cfoService: CFOService
    ) {
    }

    getSetupAccountLink() {
        this.syncServiceProxy.getSetupAccountsLink(
            <any>this.cfoService.instanceType,
            this.cfoService.instanceId,
            SyncTypeIds.XeroOAuth2,
            null,
            null
        ).subscribe((result: GetSetupAccountsLinkOutput) => {
            this.setupAccountWindow = window.open(
                result.setupAccountsLink,
                '_blank',
                'location=yes,height=680,width=640,scrollbars=yes,status=yes'
            );

            let interval = setInterval(() => {
                if (this.setupAccountWindow.closed) {
                    clearInterval(interval);
                }
            }, 2000);
        });

        let interval = setInterval(() => {
            this.syncProgressService.runGetStatus();
        }, 5000);

        this.cfoService.initialized$
            .pipe(
                filter(Boolean),
                first()
            )
            .subscribe(() => {
                clearInterval(interval);
                this.syncProgressService.startSynchronization(true, false);
            });
    }
}
