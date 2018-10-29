import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy, ViewChild } from '@angular/core';
import { SyncProgressOutput, InstanceType, SyncProgressDtoSyncStatus } from 'shared/service-proxies/service-proxies';
import { AppConsts } from 'shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxTooltipComponent } from 'devextreme-angular';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { takeUntil } from '@node_modules/rxjs/internal/operators';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress'
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild('accountProgressTooltip') accountProgressTooltip: DxTooltipComponent;
    @Output() onComplete = new EventEmitter();
    completed = true;
    synchData: SyncProgressOutput;
    currentProgress: number;
    showComponent = true;
    hasFailedAccounts = false;
    syncFailed = false;
    lastSyncDate;
    statusCheckCompleted = false;
    tooltipVisible: boolean;
    timeoutsIds: any[] = [];
    accountProgressTooltipTarget;
    accountProgressTooltipVisible = false;
    accountProgressTooltipText: string;
    getSyncProgressRequest;
    tryCount = 0;
    readonly maxTryCount = 3;
    readonly initialSynchProgressDelay = 5 * 1000;
    private synchProgressDelay = this.initialSynchProgressDelay;
    private maxSynchProgressDelay = 10 * 60 * 1000;

    constructor(
        injector: Injector,
        private syncProgressService: SynchProgressService
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.requestSyncAjax();
        this.syncProgressService.startSynchronization$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.requestSyncAjax(true, true);
            });
    }

    public requestSyncAjax(forcedSync: boolean = false, newOnly: boolean = false) {
        let params = {
            forcedSync: forcedSync,
            newOnly: newOnly
        };
        this.ajaxRequest('/api/services/CFO/Sync/SyncAllAccounts?', 'POST', params)
            .done(result => {
                this.tryCount = 0;
                this.hasFailedAccounts = false;
                if (forcedSync || (!this.getSyncProgressRequest && (!this.timeoutsIds || !this.timeoutsIds.length))) {
                    this.getSynchProgressAjax();
                }
            }).fail(result => {
                this.syncFailed = true;
                this.cancelRequests();
            });
        this.getSynchProgressAjax();
    }

    public getSynchProgressAjax() {
        this.getSyncProgressRequest = this.ajaxRequest('/api/services/CFO/Sync/GetSyncProgress?', 'GET', {});
        this.getSyncProgressRequest
            .done((result: SyncProgressOutput) => {
                this.currentProgress = result.totalProgress.progressPercent;
                this.synchData = result;
                let hasFailed = false;
                this.synchData.accountProgresses.forEach(value => {
                    if (value.syncStatus == SyncProgressDtoSyncStatus.ActionRequired
                        || value.syncStatus == SyncProgressDtoSyncStatus.SyncPending) {
                        hasFailed = true;
                    }
                });
                this.hasFailedAccounts = hasFailed;
                if (this.currentProgress != 100) {
                    setTimeout(() => { this.completed = false; });
                    this.timeoutsIds.push(setTimeout(
                        () => this.getSynchProgressAjax(), this.calcAndGetSynchProgressDelay()
                    ));
                } else {
                    /** Replace with initial delay */
                    this.synchProgressDelay = this.initialSynchProgressDelay;
                    if (!this.completed) {
                        setTimeout(() => { this.completed = true; });
                        this.onComplete.emit();
                    } else if (this.lastSyncDate && this.lastSyncDate < result.totalProgress.lastSyncDate) {
                        this.onComplete.emit();
                    } else if (this.tryCount < this.maxTryCount) {
                        this.tryCount++;
                        this.timeoutsIds.push(setTimeout(
                            () => this.getSynchProgressAjax(), 10 * 1000
                        ));
                    }
                }
                this.lastSyncDate = result.totalProgress.lastSyncDate;
                this._cfoService.instanceType = this.instanceType;
                if (!this.statusCheckCompleted && result.accountProgresses &&
                    !result.accountProgresses.every((account) => {
                        return account.progressPercent < 100;
                    })
                ) this._cfoService.instanceChangeProcess((hasTransactions) => {
                    this.statusCheckCompleted = hasTransactions;
                });
                this.getSyncProgressRequest = null;
            }).fail(result => {
                this.syncFailed = true;
                this.getSyncProgressRequest = null;
            });
    }

    /** Increase interval by 2 with every new call until max has reached */
    calcAndGetSynchProgressDelay(): number {
        this.synchProgressDelay = this.synchProgressDelay * 2;
        if (this.synchProgressDelay > this.maxSynchProgressDelay) {
            this.synchProgressDelay = this.maxSynchProgressDelay;
        }
        return this.synchProgressDelay;
    }

    calculateChartsScrolableHeight() {
        return document.querySelector('.scroll-zone').clientHeight;
    }

    toggleComponent() {
        this.showComponent = !this.showComponent;
        this.tooltipVisible = false;
    }

    toggleTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    isFailedAccount(accountStatus: string): boolean {
        return accountStatus == SyncProgressDtoSyncStatus.ActionRequired.toString() ||
            accountStatus == SyncProgressDtoSyncStatus.SyncPending.toString() ||
            accountStatus == SyncProgressDtoSyncStatus.Unavailable.toString();
    }

    ajaxRequest(url: string, method: string, params) {
        let _url = AppConsts.remoteServiceBaseUrl + url;

        let requestParams = {
            instanceType: InstanceType[this.instanceType],
            instanceId: this.instanceId
        };

        requestParams = { ...requestParams, ...params };
        let paramKeys = Object.keys(requestParams);
        paramKeys.forEach(key => {
            if (key && requestParams[key] !== undefined)
                _url += key + '=' + encodeURIComponent('' + requestParams[key]) + '&';
        });
        _url = _url.replace(/[?&]$/, '');

        return abp.ajax({
            url: _url,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + abp.auth.getToken()
            },
            abpHandleError: false
        });
    }

    accountProgressMouseEnter(elementId: string, message: string) {
        this.accountProgressTooltipVisible = true;
        this.accountProgressTooltipTarget = '#' + elementId;
        this.accountProgressTooltipText = message;

        setTimeout(() => this.accountProgressTooltip.instance.repaint());
    }

    clearTimeouts() {
        if (this.timeoutsIds && this.timeoutsIds.length) {
            this.timeoutsIds.forEach(id => clearTimeout(id));
            this.timeoutsIds = [];
        }
    }

    cancelRequests() {
        this.clearTimeouts();
        if (this.getSyncProgressRequest) {
            this.getSyncProgressRequest.reject();
        }
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.deactivate();
    }

    deactivate() {
        this.cancelRequests();
    }
}
