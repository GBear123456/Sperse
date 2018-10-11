import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy, ViewChild } from '@angular/core';
import { SyncServiceProxy, SyncProgressOutput, InstanceType, SyncProgressDtoSyncStatus } from 'shared/service-proxies/service-proxies';
import { AppConsts } from 'shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxTooltipComponent } from 'devextreme-angular';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress',
    providers: [SyncServiceProxy]
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
    readonly maxTryCount = 3;
    tryCount = 0;

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.requestSyncAjax();
    }

    public requestSyncAjax(forcedSync: boolean = false) {
        let params = {
            forcedSync: forcedSync
        };
        this.ajaxRequest('/api/services/CFO/Sync/SyncAllAccounts?', 'POST', params)
            .done(result => {
                this.tryCount = 0;
                this.hasFailedAccounts = false;
                if (!this.getSyncProgressRequest && (!this.timeoutsIds || !this.timeoutsIds.length)) {
                    this.getSynchProgressAjax();
                }
            }).fail(result => {
                this.syncFailed = true;
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
                        () => this.getSynchProgressAjax(), 10 * 1000
                    ));
                } else {
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

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.deactivate();
    }

    deactivate() {
        this.clearTimeouts();
        if (this.getSyncProgressRequest) {
            this.getSyncProgressRequest.reject();
        }
    }
}
