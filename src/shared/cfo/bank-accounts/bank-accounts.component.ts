/** Core imports */
import { Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { Subscription } from 'rxjs';
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { InstanceType, SyncAccountBankDto } from '@shared/service-proxies/service-proxies';
import { XeroLoginDialogComponent } from '@shared/cfo/bank-accounts/xero/xero-login-dialog/xero-login-dialog.component';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @ViewChild(XeroLoginDialogComponent) xeroLoginDialog: XeroLoginDialogComponent;
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    quovoHandler: any;
    bankAccountsService: BankAccountsService;
    syncAccounts;

    constructor(
        injector: Injector,
        bankAccountsService: BankAccountsService,
        private _quovoService: QuovoService,
        private _synchProgress: SynchProgressService,
        private _bankAccountsGeneralService: BankAccountsGeneralService
    ) {
        super(injector);
        this.bankAccountsService = bankAccountsService;
        this.subscribeToObservables();
    }

    subscribeToObservables() {
        this.syncCompletedSubscription = this._synchProgress.syncCompleted$.subscribe(() => {
            this.refresh();
        });
        this.refreshSubscription = this._bankAccountsGeneralService.refresh$.subscribe( () => {
            this.refresh();
        });
    }

    unsubscribeSubscriptions() {
        this.syncCompletedSubscription.unsubscribe();
        this.refreshSubscription.unsubscribe();
    }

    ngOnInit() {
        this.activate();
        this.syncAccounts = this.bankAccountsService.filteredSyncAccounts$.pipe(first());
        this.quovoHandler = this._quovoService.getQuovoHandler(InstanceType[this.instanceType], this.instanceId);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    refresh() {
        const elementForSpinner = document.querySelector('.frame-wrap');
        abp.ui.setBusy(elementForSpinner);
        this.bankAccountsService.load(false)
            .pipe(finalize(() => { abp.ui.clearBusy(elementForSpinner); }))
            .subscribe();
    }

    entitiesItemsChanged(selectedEntitiesIds: number[]) {
        this.bankAccountsService.changeState({
            selectedBusinessEntitiesIds: selectedEntitiesIds,
            selectedBankAccountIds: null
        });
        this.bankAccountsService.applyFilter();
    }

    selectedAccountsChange() {
        this.bankAccountsService.applyFilter();
    }

    onUpdateAccount(syncAccount: SyncAccountBankDto) {
        if (!this.isInstanceAdmin)
            return;

        if (syncAccount.syncTypeId === 'Q') {
            if (this.quovoHandler.isLoaded) {
                if (this.loading) {
                    this.finishLoading(true);
                }
                this.quovoHandler.open(null, syncAccount.syncRef);
            } else {
                if (!this.loading) {
                    this.startLoading(true);
                }
                setTimeout(() => this.onUpdateAccount(syncAccount), 100);
            }
        } else {
            this.xeroLoginDialog.show({id: syncAccount.syncAccountId});
        }
    }

    addAccountClose(event) {
        if (event.addedIds.length) {
            this.bankAccountsService.load();
            this._synchProgress.refreshSyncComponent();
        }
    }

    bankAccountDataChanged() {
        this._synchProgress.refreshSyncComponent();
    }

    activate() {
        /** Load sync accounts */
        this.bankAccountsService.load(false);
    }

    deactivate() {
        this.unsubscribeSubscriptions();
    }
}
