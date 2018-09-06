import { Component, Injector, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy } from 'shared/service-proxies/service-proxies';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { MatDialog } from '@angular/material';
import { AccountConnectors } from '@shared/AppEnums';

@Component({
    selector: 'xero-login-button',
    templateUrl: './xero-login-button.component.html',
    styleUrls: ['./xero-login-button.component.less'],
    providers: [ SyncAccountServiceProxy ]
})
export class XeroLoginButtonComponent extends CFOComponentBase {
    @Output() onComplete = new EventEmitter();

    constructor(
        injector: Injector,
        private dialog: MatDialog
    ) {
        super(injector);
    }

    addAccount(): void {
        const dialogConfig = { ...AccountConnectorDialogComponent.defaultConfig, ...{
            data: { selectedConnector: AccountConnectors.Xero }
        }};
        this.dialog.open(AccountConnectorDialogComponent, dialogConfig);
    }
}
