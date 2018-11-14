/** Core imports */
import { Component, OnInit, Injector, Output, Input, EventEmitter } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { SyncAccountServiceProxy, CategoryTreeServiceProxy, InstanceType, SyncDto } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AccountConnectors } from '@shared/AppEnums';
import { ChooseXeroAccountComponent } from '@shared/cfo/bank-accounts/xero/import-xero-chart-of-accounts-button/choose-xero-account/choose-xero-account.component';

@Component({
    selector: 'import-xero-chart-of-accounts-button',
    templateUrl: './import-xero-chart-of-accounts-button.component.html',
    styleUrls: ['./import-xero-chart-of-accounts-button.component.less'],
    providers: [ SyncAccountServiceProxy, CategoryTreeServiceProxy ]
})
export class ImportXeroChartOfAccountsButtonComponent extends CFOComponentBase implements OnInit {
    @Output() onComplete = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    @Input() override: boolean;
    createAccountAvailable: boolean;

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector);
        this._syncAccountServiceProxy.createIsAllowed(InstanceType[this.instanceType], this.instanceId)
            .subscribe((result) => {
                this.createAccountAvailable = result;
            });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    importChartOfAccount(): void {
        abp.ui.setBusy();

        this._syncAccountServiceProxy.getActive(InstanceType[this.instanceType], this.instanceId, 'X')
            .subscribe(result => {
                if (result.length == 0) {
                    this.newConnect();
                } else {
                    abp.ui.clearBusy();
                    let dialogRef = this.dialog.open(ChooseXeroAccountComponent, {
                        width: '450px',
                        data: {
                            createAccountAvailable: this.createAccountAvailable,
                            accounts: result
                        }
                    });

                    dialogRef.afterClosed().subscribe(chooseAccountResult => {
                        if (chooseAccountResult) {
                            abp.ui.setBusy();
                            if (chooseAccountResult === -1) {
                                this.newConnect();
                            } else {
                                this.syncCategoryTree(chooseAccountResult);
                            }
                        }
                    });
                }
            });
    }
    
    newConnect() {
        abp.ui.clearBusy();
        if (!this.createAccountAvailable)
            return;
        const dialogConfig = {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    connector: AccountConnectors.Xero,
                    config: {
                        isSyncBankAccountsEnabled: false
                    }
                }
            }
        };
        const dialogRef = this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
        dialogRef.componentInstance.onComplete.subscribe(() => {
            this.importChartOfAccount();
        });
    }

    syncCategoryTree(syncAccountId) {
        let syncInput = SyncDto.fromJS({
            syncAccountId: syncAccountId
        });
        this._categoryTreeServiceProxy.sync(InstanceType[this.instanceType], this.instanceId, syncInput, this.override)
            .pipe(finalize(() => { abp.ui.clearBusy(); }))
            .subscribe(result => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.onComplete.emit();
            });
    }
}
