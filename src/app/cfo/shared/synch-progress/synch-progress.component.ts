import { Component, OnInit, Injector, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FinancialInformationServiceProxy, SyncProgressOutput, InstanceType44, InstanceType45 } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './synch-progress.component.html',
    styleUrls: ['./synch-progress.component.less'],
    selector: 'synch-progress',
    providers: [FinancialInformationServiceProxy]
})
export class SynchProgressComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @Output() onComplete = new EventEmitter();
    @Output() completed: boolean = true;
    synchData: SyncProgressOutput;

    tooltipVisible: boolean;
    timeoutHandler: any;

    constructor(injector: Injector,
        route: ActivatedRoute,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy
    ) {
        super(injector, route);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.requestSync();
    }

    public requestSync() {
        this._financialInformationServiceProxy.syncAllAccounts(
            InstanceType44[this.instanceType],
            this.instanceId,
            true)
            .subscribe((result) => {
                this.getSynchProgress();
            });
    }

    getSynchProgress() {
        this._financialInformationServiceProxy.getSyncProgress(
            InstanceType45[this.instanceType],
            this.instanceId)
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
        if (!this.completed) {
            clearTimeout(this.timeoutHandler);
        }
        
        super.ngOnDestroy();
    }
}
