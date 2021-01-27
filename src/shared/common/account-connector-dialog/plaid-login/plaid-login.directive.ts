/** Core imports */
import { Directive, EventEmitter, Inject, Output, Input, Renderer2, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { first, filter, switchMap } from 'rxjs/operators';

/** Application imports */
import { SyncTypeIds } from '@shared/AppEnums';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { RequestConnectionInput, RequestConnectionOutput, SyncServiceProxy, ConnectionMode } from '@shared/service-proxies/service-proxies';
import { SyncAccountServiceProxy, CreateSyncAccountInput } from '@shared/service-proxies/service-proxies';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@Directive({
    selector: 'plaid-login',
    providers: [SyncAccountServiceProxy]
})
export class PlaidLoginDirective  implements OnInit {
    @Input() mode = ConnectionMode.Create;
    @Input() accountId: number;
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    constructor(
        private cfoService: CFOService,
        private syncService: SyncServiceProxy,
        private syncAccount: SyncAccountServiceProxy,
        private syncProgressService: SynchProgressService,
        private leftMenuService: LeftMenuService,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit() {
        if (window['Plaid'])
          this.createPlaidHandler();
        else
          this.loadPlaidScript(() => this.createPlaidHandler());
    }

    private createPlaidHandler() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncService.requestConnection(
                this.cfoService.instanceType,
                this.cfoService.instanceId,
                new RequestConnectionInput({
                    syncTypeId: SyncTypeIds.Plaid,
                    mode: this.mode,
                    syncAccountId: this.accountId
                })
            ))
        ).subscribe((res: RequestConnectionOutput) => {
            let handler = window['Plaid'].create({
                clientName: res.clientName,
                env: res.environment,
                key: res.publicKey,
                product: res.scope,
                webhook: res.webhookUrl,
                linkCustomizationName: 'app',
                onExit: () => {
                    this.onClose.emit();
                    this.renderer.removeChild(document.body, plaidIframe);
                },
                onSuccess: (public_token) => {
                    handler.exit();
                    this.syncAccount.create(this.cfoService.instanceType, this.cfoService.instanceId, new CreateSyncAccountInput({
                        isSyncBankAccountsEnabled: true,
                        typeId: SyncTypeIds.Plaid,
                        publicToken: public_token,
                        syncAccountRef: undefined
                    })).subscribe(() => {
                        this.onComplete.emit();
                        this.syncProgressService.runSynchProgress();
                    });
                }
            }), plaidIframe = this.document.querySelector('[id^="plaid-link-iframe-"]:last-child');
            handler.open();
            this.leftMenuService.collapsed$.pipe(
                first(),
                filter((collapsed: boolean) => !collapsed)
            ).subscribe(() => {
                this.renderer.setStyle(plaidIframe, 'left', '161px');
            });
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
