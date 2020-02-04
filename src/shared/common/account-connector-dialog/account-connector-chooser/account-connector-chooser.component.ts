import {
    Component,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    Input,
    OnInit
} from '@angular/core';
import { AccountConnector } from '@shared/common/account-connector-dialog/models/account-connector.model';
import { AccountConnectors } from '@shared/AppEnums';
import { MatDialogRef } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'account-connector-chooser',
    styleUrls: [ './account-connector-chooser.less' ],
    templateUrl: './account-connector-chooser.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorChooserComponent implements OnInit {
    @Input() disabledConnectors: AccountConnectors[];
    @Output() onConnectorChosen: EventEmitter<AccountConnectors> = new EventEmitter<AccountConnectors>();
    selectedConnector: AccountConnector;
    connectors: AccountConnector[];
    xeroConnector = {
        name: AccountConnectors.Xero,
        iconName: 'xero-connector',
        title: this.ls.l('XeroConnectorTitle'),
        description: this.ls.l('XeroConnectorDescription'),
        disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Xero))
    };
    constructor(
        private dialogRef: MatDialogRef<AccountConnectorChooserComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.connectors = [
            {
                name: AccountConnectors.Quovo,
                iconName: 'quovo-connector',
                title: this.ls.l('QuovoConnectorTitle'),
                description: this.ls.l('QuovoConnectorDescription'),
                disabled: true
            },
            {
                name: AccountConnectors.Plaid,
                iconName: 'quovo-connector',
                title: this.ls.l('QuovoConnectorTitle'),
                description: this.ls.l('QuovoConnectorDescription'),
                disabled: false
                // disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Plaid))
            },
            {
                name: AccountConnectors.XeroOAuth2,
                iconName: 'xero-connector',
                title: this.ls.l('XeroConnectorTitle'),
                description: this.ls.l('XeroConnectorDescription'),
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
