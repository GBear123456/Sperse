/** Core imports */
import { Directive, EventEmitter, Input, OnInit, Output } from '@angular/core';

/** Third party imports */
import { finalize, filter, first, switchMap } from 'rxjs/operators';

/** Application imports */
import { RequestConnectionInput, RequestConnectionOutput, SyncServiceProxy, ConnectionMode } from '@shared/service-proxies/service-proxies';
import { SyncTypeIds } from '@shared/AppEnums';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Directive({
    selector: 'quick-book-login'
})
export class QuickBookLoginComponent implements OnInit {
    @Input() mode = ConnectionMode.Create;
    @Input() accountId: number;
    @Input() loadingContainerElement: Element;
    @Output() onComplete: EventEmitter<number> = new EventEmitter();

    constructor(
        private syncServiceProxy: SyncServiceProxy,
        private syncProgressService: SynchProgressService,
        private cfoService: CFOService,
        private loadingService: LoadingService
    ) {}

    ngOnInit() {
        this.loadingService.startLoading(this.loadingContainerElement);
        this.getSetupAccountLink();
    }

    getSetupAccountLink() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncServiceProxy.requestConnection(
                this.cfoService.instanceType,
                this.cfoService.instanceId,
                new RequestConnectionInput({
                    syncTypeId: SyncTypeIds.QuickBook,
                    mode: this.mode,
                    syncAccountId: this.accountId
                })
            ).pipe(
                finalize(() => this.loadingService.finishLoading(this.loadingContainerElement))
            ))
        ).subscribe((result: RequestConnectionOutput) => {
            const setupAccountWindow = window.open(
                result.connectUrl,
                '_blank',
                `location=yes,height=680,width=640,scrollbars=yes,status=yes,left=${(window.innerWidth / 2) - 320},top=${(window.innerHeight / 2) - 340}`
            );
            if (setupAccountWindow) {
                let interval = setInterval(() => {
                    if (setupAccountWindow.closed) {
                        if (!this.cfoService.hasTransactions)
                            this.cfoService.instanceChangeProcess(true).subscribe(() => {
                                this.syncProgressService.runSynchProgress().subscribe();
                            });
                        else
                            this.syncProgressService.runSynchProgress().subscribe();

                        clearInterval(interval);
                        this.onComplete.emit();
                    }
                }, 2000);
            }
        });
    }
}
