import { Component, ChangeDetectionStrategy, Output, EventEmitter, Injector, Input, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AccountConnector } from '@shared/common/account-connector-dialog/models/account-connector.model';
import { AccountConnectors } from '@shared/AppEnums';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'account-connector-chooser',
    styleUrls: [ './account-connector-chooser.less' ],
    templateUrl: './account-connector-chooser.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorChooserComponent extends AppComponentBase implements OnInit {
    @Input() disabledConnectors: AccountConnectors[];
    @Output() onConnectorChosen: EventEmitter<AccountConnectors> = new EventEmitter<AccountConnectors>();
    selectedConnector: AccountConnector;
    connectors: AccountConnector[];
    constructor(
        injector: Injector,
        private dialogRef: MatDialogRef<AccountConnectorChooserComponent>
    ) {
        super(injector);
    }

    ngOnInit() {
        this.connectors = [
            {
                name: AccountConnectors.Quovo,
                iconName: 'quovo-connector',
                title: this.l('QuovoConnectorTitle'),
                description: this.l('QuovoConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Quovo))
            },
            {
                name: AccountConnectors.Xero,
                iconName: 'xero-connector',
                title: this.l('XeroConnectorTitle'),
                description: this.l('XeroConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Xero))
            }
        ];
        /** Select quovo by default */
        this.selectConnector(this.connectors[0]);
    }

    selectConnector(connector: AccountConnector) {
        if (!connector.disabled) {
            this.selectedConnector = connector;
        }
    }

    next() {
        if (this.selectedConnector) {
            this.onConnectorChosen.emit(this.selectedConnector.name);
        }
    }

    close() {
        this.dialogRef.close();
    }
}
