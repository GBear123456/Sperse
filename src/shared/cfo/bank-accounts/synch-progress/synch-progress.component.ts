import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy, ViewChild } from '@angular/core';
import { SyncProgressOutput, InstanceType, SyncProgressDtoSyncStatus } from 'shared/service-proxies/service-proxies';
import { AppConsts } from 'shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxTooltipComponent } from 'devextreme-angular';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { takeUntil } from 'rxjs/operators';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress'
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild('accountProgressTooltip') accountProgressTooltip: DxTooltipComponent;
    @Output() onComplete = new EventEmitter();
    completed = true;
    syncData: SyncProgressOutput;
    currentProgress: number;
    showComponent = true;
    hasFailedAccounts = false;
    syncFailed = false;
    tooltipVisible: boolean;
    accountProgressTooltipTarget;
    accountProgressTooltipVisible = false;
    accountProgressTooltipText: string;

    constructor(
        injector: Injector,
        private syncProgressService: SynchProgressService
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.activate();
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

    accountProgressMouseEnter(elementId: string, message: string) {
        this.accountProgressTooltipVisible = true;
        this.accountProgressTooltipTarget = '#' + elementId;
        this.accountProgressTooltipText = message;

        setTimeout(() => this.accountProgressTooltip.instance.repaint());
    }

    activate() {
        this.syncProgressService.startSynchronization();
        this.syncProgressService.syncData$.pipe(takeUntil(this.deactivate$)).subscribe(syncData => {
            this.syncData = syncData;
        });
        this.syncProgressService.currentProgress$.pipe(takeUntil(this.deactivate$)).subscribe(currentProgress => this.currentProgress = currentProgress);
        this.syncProgressService.syncFailed$.pipe(takeUntil(this.deactivate$)).subscribe(() => this.syncFailed = true);
        this.syncProgressService.hasFailedAccounts$.pipe(takeUntil(this.deactivate$)).subscribe(hasFailedAccounts => this.hasFailedAccounts = hasFailedAccounts);
        this.syncProgressService.syncCompleted$.pipe(takeUntil(this.deactivate$)).subscribe(completed => {
            this.completed = completed;
            if (this.completed) {
                this.onComplete.emit();
            }
        });
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.deactivate();
    }

    deactivate() {
        super.deactivate();
        this.syncProgressService.cancelRequests();
    }
}
