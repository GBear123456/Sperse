import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FinancialInformationServiceProxy, SyncProgressOutput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress',
    providers: [FinancialInformationServiceProxy]
})
export class SynchProgressComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() onComplete = new EventEmitter();
    @Output() completed: boolean = true;
    synchData: SyncProgressOutput;

    tooltipVisible: boolean;
    timeoutHandler: any;

    constructor(injector: Injector,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        this._financialInformationServiceProxy.syncAllAccounts(true)
            .subscribe((result) => {
                this.getSynchProgress();
            });
    }

    getSynchProgress() {
        this._financialInformationServiceProxy.getSyncProgress()
            .subscribe((result) => {
                if (result.totalProgress.progressPercent != 100) {
                    this.completed = false;
                    this.synchData = result;
                    this.timeoutHandler = setTimeout(() => this.getSynchProgress(), 10 * 1000);
                }
                else {
                    if (!this.completed) {
                        this.completed = true;
                        this.onComplete.emit();
                    }
                }
            });
    }

    toggleTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    ngOnDestroy(): void {
        if (!this.completed)
            clearTimeout(this.timeoutHandler);
    }
}
