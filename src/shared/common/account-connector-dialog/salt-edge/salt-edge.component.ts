/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnInit,
    Output
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Third party imports  */
import { filter, first, switchMap } from 'rxjs/operators';

/** Application imports */
import { CFOService } from '@shared/cfo/cfo.service';
import { SyncTypeIds } from '@shared/AppEnums';
import {
    CreateSyncAccountInput,
    GetConnectionInfoOutput,
    SyncAccountServiceProxy,
    SyncServiceProxy
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
            if (response.data.api_stage === 'start') {
                this.syncAccountServiceProxy.create(
                    this.cfoService.instanceType,
                    this.cfoService.instanceId,
                    new CreateSyncAccountInput({
                        isSyncBankAccountsEnabled: true,
                        typeId: SyncTypeIds.SaltEdge,
                        publicToken: undefined,
                        syncAccountRef: response.data.connection_id
                    })
                ).subscribe()
            }
            if (response.data.stage === 'success') {
                this.notifyService.success('Successfully Connected');
                this.onComplete.emit();
                this.syncProgressService.runSynchProgress().subscribe();
            }
        }
    }

    private createHandler() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncService.getConnectionInfo(
                this.cfoService.instanceType, this.cfoService.instanceId, SyncTypeIds.SaltEdge)
            )
        ).subscribe((res: GetConnectionInfoOutput) => {
            this.connectUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(res.connectUrl);
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy() {
        window.removeEventListener('message', this.providerEventsHandler);
    }
}