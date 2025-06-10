/** Core imports */
import {
    Directive,
    EventEmitter,
    OnInit,
    Output,
    Input
} from '@angular/core';

/** Third party imports  */
import { filter, first, switchMap, finalize } from 'rxjs/operators';

/** Application imports */
import { CFOService } from '@shared/cfo/cfo.service';
import { SyncTypeIds } from '@shared/AppEnums';
import {
    CreateSyncAccountInput,
    RequestConnectionInput,
    RequestConnectionOutput,
    SyncAccountServiceProxy,
    SyncServiceProxy,
    ConnectionMode
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Directive({
    selector: 'salt-edge'
})
export class SaltEdgeComponent implements OnInit {
    @Input() mode = ConnectionMode.Create;
    @Input() accountId: number;
    @Input() loadingContainerElement: Element;
    @Output() onClose: EventEmitter<any> = new EventEmitter<any>();
    @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
    setupAccountWindow: any;

    constructor(
        private cfoService: CFOService,
        private syncService: SyncServiceProxy,
        private notifyService: NotifyService,
        private loadingService: LoadingService,
        private syncProgressService: SynchProgressService,
        private syncAccountServiceProxy: SyncAccountServiceProxy
    ) {}

    ngOnInit() {
        this.createHandler();
    }

    providerEventsHandler = (event: MessageEvent) => {
        if (event.data) {
            if (event.data === 'cancel') {
                if (this.setupAccountWindow)
                    this.setupAccountWindow.close();
                return;
            }
            const response = JSON.parse(event.data);
            if (response.data.stage === 'success') {
                this.notifyService.success('Successfully Connected');
                if (this.setupAccountWindow)
                    this.setupAccountWindow.close();

                if (this.mode == ConnectionMode.Create) {
                    this.syncAccountServiceProxy.create(
                        this.cfoService.instanceType,
                        this.cfoService.instanceId,
                        new CreateSyncAccountInput({
                            isSyncBankAccountsEnabled: true,
                            typeId: SyncTypeIds.SaltEdge,
                            publicToken: undefined,
                            syncAccountRef: response.data.connection_id
                        })
                    ).pipe(finalize(() =>
                        this.syncProgressService.runSynchProgress().subscribe()
                    )).subscribe(() =>
                        this.onComplete.emit()
                    );
                } else {
                    this.syncProgressService.runSynchProgress().subscribe();
                    this.onComplete.emit();
                }
            }
        }
    }

    private createHandler() {
        this.loadingService.startLoading(this.loadingContainerElement);
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncService.requestConnection(
                this.cfoService.instanceType, this.cfoService.instanceId,
                new RequestConnectionInput({
                    syncTypeId: SyncTypeIds.SaltEdge,
                    mode: this.mode,
                    syncAccountId: this.accountId
                })).pipe(
                   finalize(() => this.loadingService.finishLoading(this.loadingContainerElement))
                )
            )
        ).subscribe((res: RequestConnectionOutput) => {
            this.setupAccountWindow = window.open(
                res.connectUrl, '_blank',
                `location=yes,height=680,width=640,scrollbars=yes,status=yes,left=${(window.innerWidth / 2) - 320},top=${(window.innerHeight / 2) - 340}`
            );
            if (this.setupAccountWindow) {
                window.addEventListener('message', this.providerEventsHandler);
                let interval = setInterval(() => {
                    if (this.setupAccountWindow.closed) {
                        clearInterval(interval);
                        this.onClose.emit();
                    }
                }, 2000);
            }
        });
    }

    ngOnDestroy() {
        if (this.setupAccountWindow)
            window.removeEventListener('message', this.providerEventsHandler);
    }
}