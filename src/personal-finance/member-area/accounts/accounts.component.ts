/** Core imports  */
import { Component, Injector, ViewChild, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CFOService } from '@shared/cfo/cfo.service';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { BankAccountsComponent } from '@shared/cfo/bank-accounts/bank-accounts.component';
import { InstanceType, SyncServiceProxy, InstanceServiceProxy } from '@shared/service-proxies/service-proxies';
import { AccountConnectors } from '@shared/AppEnums';

@Component({
    templateUrl: './accounts.component.html',
    providers: [ ],
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(BankAccountsComponent) bankAccounts: BankAccountsComponent;

    isStartDisabled = false;
    isInstanceInfoLoaded = false;

    constructor(
        injector: Injector,
        private _cfoService: CFOService,
        private _quovoService: QuovoService,
        private _syncService: SyncServiceProxy,
        private _instanceServiceProxy: InstanceServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.CreditReportLocalizationSourceName);
    }

    ngOnInit() {
        this._cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;
            /** To avoid waiting after clicking "GetStarted" button */
            this._quovoService.connect();
        });
    }

    onStart(): void {
        this.isStartDisabled = true;
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType]).subscribe(data => {
                this.addAccount();
            });
    }

    onSyncComplete() {
        if (this.bankAccounts) {
            this.bankAccounts.activate();
        }
    }

    private addAccount() {
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    disabledConnectors: [ AccountConnectors.Xero ]
                }
            }
        };
        const dialogRef = this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe(e => {
            this.onQuovoClose(e);
        });
    }

    private onQuovoClose(e) {
        this.isStartDisabled = false;
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
