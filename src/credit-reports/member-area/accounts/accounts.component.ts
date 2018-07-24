import { Component, Injector, ViewChild } from '@angular/core';

import { finalize } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';

import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import * as _ from 'underscore';

import { BankAccountsComponent } from '@shared/cfo/bank-accounts/bank-accounts.component';
import { InstanceType, SyncServiceProxy, InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './accounts.component.html',
    providers: [],
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase {
    @ViewChild(BankAccountsComponent) bankAccounts: BankAccountsComponent;

    quovoHandler: any;
    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    constructor(
        injector: Injector,
        private _cfoService: CFOService,
        private _quovoService: QuovoService,
        private _syncService: SyncServiceProxy,
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super(injector, AppConsts.localization.CreditReportLocalizationSourceName);
        _cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;
        });
    }

    onStart(): void {
        this.isStartDisabled = true;
        this.startLoading(true);
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType]).subscribe((data) => {
                this.addAccount();
            });
    }

    private addAccount() {
        if (!this.quovoHandler) {
            this.quovoHandler = this._quovoService.getQuovoHandler(this._cfoService.instanceType, this._cfoService.instanceId);
        }
        if (this.quovoHandler.isLoaded) {
            if (this.loading) {
                this.finishLoading(true);
            }
            this.quovoHandler.open(e => this.onQuovoHandlerClose(e));
            return;
        } else {
            setTimeout(() => this.addAccount(), 100);
        }
    }

    private onQuovoHandlerClose(e) {
        if (e.addedIds.length) {
            this.startLoading(true);
            this._syncService.syncAllAccounts(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, true, true)
                .pipe(finalize(() => {
                    this.isStartDisabled = false;
                }))
                .subscribe(() => {
                    this._cfoService.instanceChangeProcess(() => {
                        this.bankAccounts.loadBankAccounts();
                        this.finishLoading(true);
                    });
                });
        } else {
            this.isStartDisabled = false;
        }
    }
}
