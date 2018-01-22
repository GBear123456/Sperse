import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FinancialInformationServiceProxy, SyncProgressOutput, InstanceType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress',
    providers: [FinancialInformationServiceProxy]
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @Output() onComplete = new EventEmitter();
    @Output() completed = true;
    synchData: SyncProgressOutput;
    currentProgress: any;

    statusCheckCompleted = false;
    tooltipVisible: boolean;
    timeoutHandler: any;

    constructor(injector: Injector,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.requestSync();
    }

    public requestSync() {
        this._financialInformationServiceProxy.syncAllAccounts(
            InstanceType[this.instanceType],
            this.instanceId,
            true)
            .subscribe((result) => {
                this.getSynchProgress();
            });
    }

    getSynchProgress() {
        this._financialInformationServiceProxy.getSyncProgress(
            InstanceType[this.instanceType],
            this.instanceId)
            .subscribe((result) => {
                this.currentProgress = 38;
                if (this.currentProgress != 100) {
                    this.completed = false;
                    this.synchData = result;
                    this.timeoutHandler = setTimeout(
                        () => this.getSynchProgress(), 10 * 1000
                    );

                } else {
                    if (!this.completed) {
                        this.completed = true;
                        this.onComplete.emit();
                    }
                }

                this._cfoService.instanceType = this.instanceType;
                if (!this.statusCheckCompleted && result.accountProgresses &&
                    !result.accountProgresses.every((account) => {
                        return account.progressPercent < 100;
                    })
                ) this._cfoService.instanceChangeProcess((hasTransactions) => {
                    this.statusCheckCompleted = hasTransactions;
                });
            });
    }

    format(value) {
        return value * 100 + '%';
    }

    toggleTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    ngOnDestroy(): void {
        if (!this.completed) {
            clearTimeout(this.timeoutHandler);
        }

        super.ngOnDestroy();
    }
}
