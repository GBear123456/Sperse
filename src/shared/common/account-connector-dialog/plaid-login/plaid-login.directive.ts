/** Core imports */
import { Directive, EventEmitter, Output } from '@angular/core';

/** Third party imports */
import { first, filter, switchMap } from 'rxjs/operators';

/** Application imports */
import { SyncTypeIds } from '@shared/AppEnums';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { SyncAccountServiceProxy, CreateSyncAccountInput } from '@shared/service-proxies/service-proxies';

@Directive({
    selector: 'plaid-login',
    providers: [SyncAccountServiceProxy]
})
export class PlaidLoginDirective {
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    constructor(
        private cfoService: CFOService,
        private syncAccount: SyncAccountServiceProxy,
        private syncProgressService: SynchProgressService
    ) {
        if (window['Plaid'])
          this.createPlaidHandler();
        else
          this.loadPlaidScript(() => this.createPlaidHandler());
    }

    private createPlaidHandler() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncAccount.getPlaidConfig(this.cfoService.instanceType, this.cfoService.instanceId))
        ).subscribe(res => {
            let handler = window['Plaid'].create({
                clientName: res.clientName,
                env: res.evn,
                key: res.key,
                product: res.product,
                webhook: res.webhook,
                onExit: (err, metadata) => {
                    this.onClose.emit();
                },
                onSuccess: (public_token, metadata) => {
                    handler.exit();
                    this.onComplete.emit();
                    this.syncAccount.create(this.cfoService.instanceType, this.cfoService.instanceId, new CreateSyncAccountInput({
                        isSyncBankAccountsEnabled: true,
                        typeId: SyncTypeIds.Plaid,
                        consumerKey: undefined,
                        consumerSecret: undefined,
                        publicToken: public_token
                    })).subscribe(() => this.syncProgressService.runSynchProgress());
                }
            });
            handler.open();
        });
    }

    private loadPlaidScript(callback: () => void): void {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.addEventListener('load', callback);
        document.head.appendChild(script);
    }
}