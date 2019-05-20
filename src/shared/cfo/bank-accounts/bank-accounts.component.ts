/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize, first, filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountBankDto } from '@shared/service-proxies/service-proxies';
import { AccountConnectors } from '@shared/AppEnums';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

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
        private dialog: MatDialog,
        public cfoPreferences: CfoPreferencesService
    ) {
        super(injector);
        this.bankAccountsService = bankAccountsService;
        this.subscribeToObservables();
    }

    subscribeToObservables() {
        this.syncCompletedSubscription = this._synchProgress.syncCompleted$.pipe(
            takeUntil(this.deactivate$),
            filter(completed => !!completed)
        ).subscribe(() => {
            this.refresh();
        });
        this.refreshSubscription = this._bankAccountsGeneralService.refresh$.pipe(takeUntil(this.deactivate$))
            .subscribe( () => {
                this.refresh();
            });
    }

    ngOnInit() {
        this.activate();
        this.syncAccounts = this.bankAccountsService.filteredSyncAccounts$.pipe(first());
        this._quovoService.quovoSynced$.subscribe(() => {
            this.bankAccountsService.load();
        });
    }

    refresh() {
        const elementForSpinner = document.querySelector('.frame-wrap');
        abp.ui.setBusy(elementForSpinner);
        this.bankAccountsService.load(false)
            .pipe(finalize(() => { abp.ui.clearBusy(elementForSpinner); }))
            .subscribe();
    }

    selectedAccountsChange() {
        this.bankAccountsService.applyFilter();
    }

    onUpdateAccount(syncAccount: SyncAccountBankDto) {
        if (!this.isInstanceAdmin && !this.isMemberAccessManage)
            return;

        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
            data: {
                connector: syncAccount.syncTypeId === 'Q' ? AccountConnectors.Quovo : AccountConnectors.Xero,
                config: {
                    accountId: syncAccount.syncTypeId === 'Q' ? syncAccount.syncRef : syncAccount.syncAccountId,
                },
                operationType: 'update'
            }
        }};
        this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
    }

    bankAccountDataChanged() {
        this._synchProgress.refreshSyncComponent();
    }

    activate() {
        /** Load sync accounts */
        this.bankAccountsService.load(false);
    }

    deactivate() {
        super.deactivate();
    }

    ngOnDestroy() {
        this.deactivate();
    }
}
