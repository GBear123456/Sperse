/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { InstanceType, SyncAccountBankDto } from '@shared/service-proxies/service-proxies';
import { AccountConnectors } from '@shared/AppEnums';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, OnDestroy {
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    bankAccountsService: BankAccountsService;
    syncAccounts;

    constructor(
        injector: Injector,
        bankAccountsService: BankAccountsService,
        private _quovoService: QuovoService,
        private _synchProgress: SynchProgressService,
        private _bankAccountsGeneralService: BankAccountsGeneralService,
        private dialog: MatDialog
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

        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
                data: {
                    connector: syncAccount.syncTypeId === 'Q' ? AccountConnectors.Quovo : AccountConnectors.Xero,
                    config: {
                        accountId: syncAccount.syncTypeId === 'Q' ? syncAccount.syncRef : syncAccount.syncAccountId,
                    }
                }
            }};
        this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
    }

    addAccountClose(event) {
        if (event.addedIds.length) {
            this.bankAccountsService.load();
            this._synchProgress.refreshSyncComponent();
        }
    }

    addAccountComplete() {
        this.bankAccountsService.load();
        this._synchProgress.refreshSyncComponent();
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
