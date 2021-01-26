/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnInit,
    Output,
    Input
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
import { NotifyService } from '@abp/notify/notify.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';

@Component({
    selector: 'salt-edge',
    templateUrl: 'salt-edge.component.html',
    styleUrls: [ 'salt-edge.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaltEdgeComponent implements OnInit {
    @Input() reconnect = false;
    @Input() accountId: number;
    @Output() onClose: EventEmitter<any> = new EventEmitter<any>();
    @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
    connectUrl: SafeResourceUrl;
    constructor(
        private cfoService: CFOService,
        private syncService: SyncServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private domSanitizer: DomSanitizer,
        private notifyService: NotifyService,
        private syncProgressService: SynchProgressService,
        private syncAccountServiceProxy: SyncAccountServiceProxy
    ) {}

    ngOnInit() {
        this.createHandler();
        window.addEventListener('message', this.providerEventsHandler);
    }

    providerEventsHandler = (event: MessageEvent) => {
        if (event.data) {
            if (event.data === 'cancel') {
                this.onClose.emit();
                return;
            }
            const response = JSON.parse(event.data);
            if (response.data.stage === 'success') {
                this.notifyService.success('Successfully Connected');
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
            }
        }
    }

    private createHandler() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncService.requestConnection(
                this.cfoService.instanceType, this.cfoService.instanceId,
                new RequestConnectionInput({
                    syncTypeId: SyncTypeIds.SaltEdge,
                    mode: this.reconnect ?
                        ConnectionMode.Reconnect :
                        ConnectionMode.Create,
                    syncAccountId: this.accountId
                }))
            )
        ).subscribe((res: RequestConnectionOutput) => {
            this.connectUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(res.connectUrl);
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy() {
        window.removeEventListener('message', this.providerEventsHandler);
    }
}