/** Core imports */
import { AfterViewInit, Component, OnInit, OnDestroy, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountBankDto, ConnectionMode } from '@shared/service-proxies/service-proxies';
import { AccountConnectors, SyncTypeIds } from '@shared/AppEnums';
import { BankAccountsWidgetComponent } from '@shared/cfo/bank-accounts/bank-accounts-widgets/bank-accounts-widget.component';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@Component({
    selector: 'bank-accounts-component',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less']
})
export class BankAccountsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(BankAccountsWidgetComponent) bankAccountsWidget: BankAccountsWidgetComponent;
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;
    nameColumnWidth$: Observable<number> = this.leftMenuService.collapsed$.pipe(
        map((collapsed: boolean) => collapsed || window.innerWidth > 1400 ? null : 250)
    );

    constructor(
        injector: Injector,
        private synchProgress: SynchProgressService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private leftMenuService: LeftMenuService,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.activate();
    }

    ngAfterViewInit() {
        this.refresh();
    }

    subscribeToObservables() {
        /** Redirect user to the start page if instance isn't initialized */
        this._cfoService.initialized$.pipe(
            filter((initialized: boolean) => !initialized),
            takeUntil(this.deactivate$)
        ).subscribe(() => {
            this._router.navigate(['../start'], { relativeTo: this.route } );
        });
        this.synchProgress.syncCompleted$.pipe(
            takeUntil(this.deactivate$),
            filter(Boolean)
        ).subscribe(() => {
            this.refresh();
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

    onUpdateAccount(event: {account: SyncAccountBankDto, mode: ConnectionMode}) {
        if (!this.isInstanceAdmin && !this.isMemberAccessManage)
            return;

        let syncTypeId = event.account.syncTypeId;
        let syncTypeKey = Object.keys(SyncTypeIds).find((v) => SyncTypeIds[v] == syncTypeId);
        let connector: AccountConnectors = AccountConnectors[syncTypeKey];
        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
            data: {
                connector: connector,
                config: {
                    accountId: event.account.syncAccountId,
                },
                operationType: 'update',
                instanceType: this.instanceType,
                instanceId: this.instanceId,
                mode: event.mode
            }
        }};
        this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
    }

    bankAccountDataChanged() {
        this.synchProgress.runSynchProgress().subscribe();
    }

    openAutoSyncDialog() {
        this.bankAccountsWidget.updateAutoSyncTime(
            this.l('ChooseDayTimeToRunAutoSync'),
            this.bankAccountsWidget.getSelectedSyncAccountIds()
        )
    }

    activate() {
        this.subscribeToObservables();
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