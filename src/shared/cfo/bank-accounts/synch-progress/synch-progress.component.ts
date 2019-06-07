import { Component, OnInit, Injector, EventEmitter, Input, Output, OnDestroy, ViewChild } from '@angular/core';
import { SyncProgressOutput, SyncProgressDtoSyncStatus } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { takeUntil } from 'rxjs/operators';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress'
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @Input() isSyncAccountButtonShown = false;
    @ViewChild('accountProgressTooltip') accountProgressTooltip: DxTooltipComponent;
    @Output() onComplete = new EventEmitter();
    completed = true;
    syncData: SyncProgressOutput;
    currentProgress: number;
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
    }

    ngOnInit(): void {
        this.activate();
    }

    calculateChartsScrolableHeight() {
        return document.querySelector('.scroll-zone').clientHeight;
    }

    toggleComponent() {
        this.isSyncAccountButtonShown = !this.isSyncAccountButtonShown;
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

    syncAll() {
        setTimeout(() => {
            this.syncProgressService.startSynchronization(true, false, 'all');
            this.toggleComponent();
        }, 300);
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
