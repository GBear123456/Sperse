/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { finalize, map, distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import {
    InstanceType,
    SyncProgressDtoSyncStatus,
    SyncProgressOutput,
    SyncServiceProxy,
    MyFinancesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Injectable()
export class SynchProgressService {
    getSyncProgressSubscription: Subscription;
    hasFailedAccounts = false;
    tryCount = 0;
    timeoutsIds: any[] = [];
    private syncFailed: Subject<null> = new Subject<null>();
    syncFailed$ = this.syncFailed.asObservable();

    private syncCompleted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    syncCompleted$ = this.syncCompleted.asObservable();

    private needRefreshSync = new Subject<string>();
    needRefreshSync$ = this.needRefreshSync.asObservable();

    readonly maxTryCount = 3;
    readonly initialSynchProgressDelay = 5 * 1000;

    private lastSyncDate;

    private synchProgressDelay = this.initialSynchProgressDelay;
    private synchProgressDelayMultiplier = 1.1;
    private maxSynchProgressDelay = 10 * 60 * 1000;

    public currentProgress$: Observable<number>;
    public syncData$: Subject<SyncProgressOutput> = new Subject();
    public hasFailedAccounts$: Observable<boolean>;
    private statusCheckCompleted: boolean;

    constructor(
        private cfoService: CFOService,
        private http: HttpClient,
        private syncServiceProxy: SyncServiceProxy,
        private myFinanceService: MyFinancesServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration
    ) {
        this.subscribeToProgress();
    }

    refreshSyncComponent() {
        this.needRefreshSync.next();
    }

    public startSynchronization(forcedSync: boolean = false, newOnly: boolean = false, syncType = 'Q', syncAccountIds = []) {
        this.appHttpConfiguration.avoidErrorHandling = true;
        this.runSync(forcedSync, newOnly, syncType, syncAccountIds)
            .subscribe(() => {
                this.tryCount = 0;
                this.hasFailedAccounts = false;
                if (forcedSync || (!this.getSyncProgressSubscription && (!this.timeoutsIds || !this.timeoutsIds.length))) {
                    this.runSynchProgress();
                }
            },
            this.syncAllFailed.bind(this)
        );
        this.runSynchProgress();
    }

    private syncAllFailed() {
        this.syncFailed.next();
        this.cancelRequests();
    }

    private runSync(forcedSync: boolean = false, newOnly: boolean = false, syncType = 'Q', syncAccountIds = []) {
        const method = this.cfoService.isForUser && syncType == 'Q'
            ? this.myFinanceService.syncAllQuovoAccounts(forcedSync, newOnly)
            : (
                syncAccountIds && syncAccountIds.length
                ? this.syncServiceProxy.requestSyncForAccounts(
                    InstanceType[this.cfoService.instanceType],
                    this.cfoService.instanceId,
                    syncAccountIds
                )
                : this.syncServiceProxy.syncAllAccounts(
                    InstanceType[this.cfoService.instanceType],
                    this.cfoService.instanceId,
                    forcedSync,
                    newOnly,
                    syncType === 'all' ? undefined : syncType
                )
            );

        return method.pipe(finalize(() => {
            this.appHttpConfiguration.avoidErrorHandling = false;
            this.runGetStatus();
        }));
    }

    private runGetStatus() {
        if (!this.cfoService.hasTransactions) {
            this.cfoService.instanceChangeProcess(true).subscribe();
        }
    }

    private runSynchProgress() {
        if (this.cfoService.isForUser)
            return;

        this.appHttpConfiguration.avoidErrorHandling = true;
        this.getSyncProgressSubscription = this.syncServiceProxy.getSyncProgress(
            InstanceType[this.cfoService.instanceType],
            this.cfoService.instanceId
        ).pipe(finalize(() => {
            this.appHttpConfiguration.avoidErrorHandling = false;
            this.runGetStatus();
        })
        ).subscribe(syncData => this.syncData$.next(syncData));
    }

    private subscribeToProgress() {
        this.currentProgress$ = this.syncData$.pipe(
            map((res: SyncProgressOutput) => res.totalProgress.progressPercent),
            distinctUntilChanged()
        );
        this.hasFailedAccounts$ = this.syncData$.pipe(
            map(syncData => this.syncHasFailedAccounts(syncData)),
            distinctUntilChanged()
        );
        this.syncData$
            .subscribe(
                (result: SyncProgressOutput) => {
                    if (result.totalProgress.progressPercent != 100) {
                        this.syncCompleted.next(false);
                        this.timeoutsIds.push(setTimeout(
                            () => this.runSynchProgress(), this.calcAndRunSynchProgressDelay()
                        ));
                    } else {
                        /** Replace with initial delay */
                        this.synchProgressDelay = this.initialSynchProgressDelay;
                        if (!this.syncCompleted.value) {
                            /** @todo check completed prop */
                            //setTimeout(() => { this.completed = true; });
                            this.syncCompleted.next(true);
                        } else if (this.lastSyncDate && this.lastSyncDate < result.totalProgress.lastSyncDate) {
                            this.syncCompleted.next(true);
                        } else if (this.tryCount < this.maxTryCount) {
                            this.tryCount++;
                            /** Run sync All after 10 sec and then syncProgress 3 times*/
                            this.timeoutsIds.push(setTimeout(
                                () => {
                                    this.runSync(true).subscribe(
                                        () => this.runSynchProgress(),
                                        this.syncAllFailed.bind(this)
                                    );
                                }, 10 * 1000
                            ));
                        }
                    }
                    this.lastSyncDate = result.totalProgress.lastSyncDate;
                    // this.cfoService.instanceType = this.instanceType;
                    this.instanceChangeProcess(result.accountProgresses);
                },
                () => {
                    this.syncFailed.next();
                }
            );
    }

    private instanceChangeProcess(accountProgresses) {
        if (!this.statusCheckCompleted && accountProgresses &&
            !accountProgresses.every(account => {
                return account.progressPercent < 100;
            })
        ) this.cfoService.instanceChangeProcess().subscribe(hasTransactions => {
            this.statusCheckCompleted = hasTransactions;
        });
    }

    private syncHasFailedAccounts(syncData: SyncProgressOutput): boolean {
        let hasFailed = false;
        syncData.accountProgresses.forEach(value => {
            if (value.syncStatus == SyncProgressDtoSyncStatus.ActionRequired
                || value.syncStatus == SyncProgressDtoSyncStatus.SyncPending) {
                hasFailed = true;
            }
        });
        return hasFailed;
    }

    /** Increase delay by 1.1 with every new call until max has reached */
    private calcAndRunSynchProgressDelay(): number {
        this.synchProgressDelay = this.synchProgressDelay * this.synchProgressDelayMultiplier;
        if (this.synchProgressDelay > this.maxSynchProgressDelay) {
            this.synchProgressDelay = this.maxSynchProgressDelay;
        }
        return this.synchProgressDelay;
    }

    private clearTimeouts() {
        if (this.timeoutsIds && this.timeoutsIds.length) {
            this.timeoutsIds.forEach(id => clearTimeout(id));
            this.timeoutsIds = [];
        }
    }

    /** Clear all progress requests */
    cancelRequests() {
        this.clearTimeouts();
        if (this.getSyncProgressSubscription) {
            this.getSyncProgressSubscription.unsubscribe();
        }
    }
}
