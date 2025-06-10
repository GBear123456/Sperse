/** Core imports */
import { Component, Injector, Output, Input, EventEmitter } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { SyncAccountServiceProxy, CategoryTreeServiceProxy, InstanceType, SyncDto } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AccountConnectors, SyncTypeIds } from '@shared/AppEnums';
import { ChooseAccountComponent } from '@shared/cfo/bank-accounts/chart-of-accounts/import-chart-of-accounts-button/choose-account/choose-account.component';

@Component({
    selector: 'import-chart-of-accounts-button',
    templateUrl: './import-chart-of-accounts-button.component.html',
    styleUrls: ['./import-chart-of-accounts-button.component.less'],
    providers: [ SyncAccountServiceProxy, CategoryTreeServiceProxy ]
})
export class ImportChartOfAccountsButtonComponent extends CFOComponentBase {
    @Output() onComplete = new EventEmitter();
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    @Input() override: boolean;
    @Input() syncTypeId: SyncTypeIds;
    createAccountAvailable: boolean;
    xeroConnectorIsOpen: boolean;

    syncTypeConfigs = {
        [SyncTypeIds.Plaid]: { name: 'plaid', icon: 'plaid.png', caption: 'Plaid' },
        [SyncTypeIds.QuickBook]: { name: 'quick-book', icon: 'quick-book.png', caption: 'QuickBook' },
        [SyncTypeIds.XeroOAuth2]: { name: 'xero', icon: 'xero.svg', caption: 'Xero' }
    };

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

    importChartOfAccount(): void {
        abp.ui.setBusy();

        this._syncAccountServiceProxy.getActive(InstanceType[this.instanceType], this.instanceId, this.syncTypeId)
            .subscribe(result => {
                if (result.length == 0) {
                    if (!this.xeroConnectorIsOpen) {
                        this.xeroConnectorIsOpen = true;
                        this.newConnect();
                    } else {
                        this.xeroConnectorIsOpen = false;
                        abp.ui.clearBusy();
                        return;
                    }
                } else {
                    abp.ui.clearBusy();
                    let dialogRef = this.dialog.open(ChooseAccountComponent, {
                        width: '450px',
                        data: {
                            syncTypeCaption: this.syncTypeConfigs[this.syncTypeId].caption,
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
            ...{
                data: {
                    connector: this.syncTypeId === SyncTypeIds.QuickBook ? AccountConnectors.QuickBook : AccountConnectors.XeroOAuth2,
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
        this._categoryTreeServiceProxy.sync(InstanceType[this.instanceType], this.instanceId, this.override, syncInput)
            .pipe(finalize(() => { abp.ui.clearBusy(); }))
            .subscribe((result) => {
                if (result) {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.onComplete.emit();
                } else {
                    this.message.confirm(
                        this.l('ReconnectNow'),
                        this.l('AuthorizationRequired'),
                        isConfirmed => {
                            if (isConfirmed) {
                                this.dialog.open(AccountConnectorDialogComponent, {
                                    ...{
                                        data: {
                                            connector: this.syncTypeId === SyncTypeIds.QuickBook ? AccountConnectors.QuickBook : AccountConnectors.XeroOAuth2,
                                        }
                                    }
                                }).componentInstance.onComplete.subscribe(() => {
                                    this.onComplete.emit();
                                });
                            }
                        }
                    );

                }
            });
    }
}
