import {
    Component,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    Injector,
    Input,
    OnInit
} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AccountConnector } from '@shared/common/account-connector-dialog/models/account-connector.model';
import { AccountConnectors } from '@shared/AppEnums';
import { MatDialogRef } from '@angular/material/dialog';

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
    xeroConnector = {
        name: AccountConnectors.Xero,
        iconName: 'xero-connector',
        title: this.l('XeroConnectorTitle'),
        description: this.l('XeroConnectorDescription'),
        disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Xero))
    };
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
                disabled: true
            },
            {
                name: AccountConnectors.Plaid,
                iconName: 'quovo-connector',
                title: this.l('QuovoConnectorTitle'),
                description: this.l('QuovoConnectorDescription'),
                disabled: false
                // disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Plaid))
            },
            {
                name: AccountConnectors.XeroOAuth2,
                iconName: 'xero-connector',
                title: this.l('XeroConnectorTitle'),
                description: this.l('XeroConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.XeroOAuth2))
            }
        ];
        /** Select quovo by default */
        this.selectConnector(this.connectors[1]);
    }

    selectConnector(connector: AccountConnector, next = false) {
        if (!connector.disabled) {
            this.selectedConnector = connector;
            if (next) {
                this.next();
            }
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
