/** Core imports  */
import { Component, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { finalize } from 'rxjs/operators';

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
export class AccountsComponent extends AppComponentBase {
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
        _cfoService.instanceChangeProcess(() => {
            this.isInstanceInfoLoaded = true;
            /** To avoid waiting after clicking "GetStarted" button */
            this._quovoService.getQuovoHandler(this._cfoService.instanceType, this._cfoService.instanceId);
        });
    }

    onStart(): void {
        this.isStartDisabled = true;
        if (this._cfoService.initialized)
            this.addAccount();
        else
            this._instanceServiceProxy.setup(InstanceType[this._cfoService.instanceType]).subscribe((data) => {
                this.addAccount();
            });
    }

    onSyncComplete() {
        this.bankAccounts.activate();
    }

    private addAccount() {
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    disabledConnectorsNames: [ AccountConnectors.Xero ]
                }
            }
        };
        const dialogRef = this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe(e => {
            this.onQuovoHandlerClose(e);
        });
    }

    private onQuovoHandlerClose(e) {
        if (e && e.addedIds.length) {
            this.startLoading(true);
            this._syncService.syncAllAccounts(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, true, true)
                .pipe(finalize(() => {
                    this.isStartDisabled = false;
                }))
                .subscribe(() => {
                    this._cfoService.instanceChangeProcess(() => {
                        this.bankAccounts.activate();
                        this.finishLoading(true);
                    });
                });
        } else {
            this.isStartDisabled = false;
        }
    }
}
