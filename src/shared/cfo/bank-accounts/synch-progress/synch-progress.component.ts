/** Core imports */
import { Component, OnInit, Injector, EventEmitter, Input, Output, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { merge } from 'rxjs';
import { filter, first, takeUntil } from 'rxjs/operators';

/** Application imports */
import {
    SyncProgressOutput,
    SyncProgressStatus,
    InstanceType,
    SyncAccountServiceProxy
} from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress',
    providers: [ SyncAccountServiceProxy ]
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild('accountProgressTooltip', { static: true }) accountProgressTooltip: DxTooltipComponent;
    @Input() showSyncAccountButton = false;
    @Output() onComplete = new EventEmitter();
    @Output() onSyncStarted = new EventEmitter();
    @Output() onAutoSyncButtonClicked = new EventEmitter();
    createAccountAvailable: boolean;
    completed = true;
    showProgress = true;
    syncData: SyncProgressOutput;
    currentProgress: number;
    hasFailedAccounts = false;
    syncFailed = false;
    tooltipVisible: boolean;
    accountProgressTooltipTarget;
    accountProgressTooltipVisible = false;
    accountProgressTooltipText: string;
    showLoader = false;

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private syncProgressService: SynchProgressService,
        private syncAccountServiceProxy: SyncAccountServiceProxy
    ) {
        super(injector);
        this.syncAccountServiceProxy.createIsAllowed(InstanceType[this.instanceType], this.instanceId)
            .subscribe((createIsAllowed: boolean) => {
                this.createAccountAvailable = createIsAllowed;
            });
    }

    ngOnInit(): void {
        this.activate();
    }

    calculateChartsScrollableHeight() {
        return document.querySelector('.scroll-zone').clientHeight;
    }

    toggleComponent() {
        this.showProgress = !this.showProgress;
        this.tooltipVisible = false;
    }

    toggleTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    isFailedAccount(accountStatus: string): boolean {
        return accountStatus == SyncProgressStatus.ActionRequired.toString() ||
            accountStatus == SyncProgressStatus.SyncPending.toString() ||
            accountStatus == SyncProgressStatus.Unavailable.toString();
    }

    accountProgressMouseEnter(elementId: string, message: string) {
        this.accountProgressTooltipVisible = true;
        this.accountProgressTooltipTarget = '#' + elementId;
        this.accountProgressTooltipText = message;
    }

    syncAll(toggleComponent: boolean = false) {
        this.showLoader = true;
        if (toggleComponent) this.toggleComponent();
        this.syncProgressService.startSynchronization(true);
        merge(
            this.syncProgressService.lastProgressFinished$,
            this.syncProgressService.syncCompleted$.pipe(filter(completed => !completed))
        ).pipe(
            takeUntil(this.deactivate$),
            first()
        ).subscribe(
            () => {
                this.showLoader = false;
                this.onSyncStarted.emit();
            }
        );
    }

    openAutoSyncDialog(e) {
        this.onAutoSyncButtonClicked.emit();
        e.stopPropagation();
        e.preventDefault();
    }

    activate() {
        this.syncProgressService.runGetStatus();
        this.syncProgressService.syncData$.pipe(takeUntil(this.deactivate$)).subscribe(syncData => {
            this.syncData = syncData;
        });
        this.syncProgressService.currentProgress$.pipe(takeUntil(this.deactivate$))
            .subscribe(currentProgress => this.currentProgress = currentProgress);
        this.syncProgressService.syncFailed$.pipe(takeUntil(this.deactivate$))
            .subscribe(() => this.syncFailed = true);
        this.syncProgressService.hasFailedAccounts$.pipe(takeUntil(this.deactivate$))
            .subscribe(hasFailedAccounts => this.hasFailedAccounts = hasFailedAccounts);
        this.syncProgressService.syncCompleted$.pipe(takeUntil(this.deactivate$)).subscribe(completed => {
            this.completed = completed;
            if (this.completed) {
                this.onComplete.emit();
            }
        });
        this.syncProgressService.syncCompletedDistinct$.pipe(takeUntil(this.deactivate$)).subscribe(() => {
            this.notify.info(this.l('SynchronizationFinished'));
        });
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.deactivate();
    }

    deactivate() {
        super.deactivate();
    }
}
