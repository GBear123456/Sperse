/** Core imports */
import { AfterViewInit, Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Observable } from 'rxjs';
import { first, filter, takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountBankDto } from '@shared/service-proxies/service-proxies';
import { AccountConnectors, SyncTypeIds } from '@shared/AppEnums';
import { BankAccountsWidgetComponent } from '@shared/cfo/bank-accounts/bank-accounts-widgets/bank-accounts-widget.component';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsWidgetComponent, { static: false }) bankAccountsWidget: BankAccountsWidgetComponent;
    syncCompletedSubscription: Subscription;
    refreshSubscription: Subscription;
    repaintSubscription: Subscription;
    syncAccounts;
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;
    nameColumnWidth$: Observable<number> = this.leftMenuService.collapsed$.pipe(
        map((collapsed: boolean) => collapsed ? null : 250)
    );

    constructor(
        injector: Injector,
        private synchProgress: SynchProgressService,
        private bankAccountsGeneralService: BankAccountsGeneralService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private leftMenuService: LeftMenuService,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this.subscribeToObservables();
    }

    ngOnInit() {
        this.activate();
        this.syncAccounts = this.bankAccountsService.filteredSyncAccounts$.pipe(first());
        /** Redirect user to the start page if instance isn't initialized */
        this._cfoService.initialized$.pipe(
            filter((initialized: boolean) => !initialized),
            takeUntil(this.deactivate$)
        ).subscribe(() => {
            this._router.navigate(['../start'], { relativeTo: this.route.parent } );
        });
    }

    ngAfterViewInit() {
        this.refresh();
    }

    subscribeToObservables() {
        this.syncCompletedSubscription = this.synchProgress.syncCompleted$.pipe(
            takeUntil(this.deactivate$),
            filter(completed => !!completed)
        ).subscribe(() => {
            this.refresh();
        });
        this.refreshSubscription = this.bankAccountsGeneralService.refresh$.pipe(takeUntil(this.deactivate$))
            .subscribe( () => {
                this.refresh();
            });
        this.repaintSubscription = this.bankAccountsGeneralService.repaint$.pipe(takeUntil(this.deactivate$))
            .subscribe( () => {
                setTimeout(() => this.repaint(), 1001);
            });
    }

    refresh() {
        if (this.bankAccountsWidget) {
            this.bankAccountsWidget.refresh();
        }
    }

    repaint() {
        if (this.bankAccountsWidget) {
            this.bankAccountsWidget.repaint();
        }
    }

    selectedAccountsChange() {
        this.bankAccountsService.applyFilter();
    }

    onUpdateAccount(syncAccount: SyncAccountBankDto) {
        if (!this.isInstanceAdmin && !this.isMemberAccessManage)
            return;

        let syncTypeId = syncAccount.syncTypeId;
        let syncTypeKey = Object.keys(SyncTypeIds).find((v) => SyncTypeIds[v] == syncTypeId);
        let connector: AccountConnectors = AccountConnectors[syncTypeKey];

        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
            data: {
                connector: connector,
                config: {
                    accountId: syncAccount.syncAccountId,
                },
                operationType: 'update',
                instanceType: this.instanceType,
                instanceId: this.instanceId
            }
        }};
        this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
    }

    bankAccountDataChanged() {
        this.synchProgress.refreshSyncComponent();
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
