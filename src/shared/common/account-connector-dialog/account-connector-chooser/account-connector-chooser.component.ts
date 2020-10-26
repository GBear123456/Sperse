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
import { environment } from '@root/environments/environment';

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
    constructor(
        private dialogRef: MatDialogRef<AccountConnectorChooserComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.connectors = [
            {
                name: AccountConnectors.Plaid,
                iconName: 'plaid-connector',
                title: this.ls.l('PlaidConnectorTitle'),
                description: this.ls.l('PlaidConnectorDescription'),
                disabled: false
                // disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Plaid))
            },
            {
                name: AccountConnectors.QuickBook,
                iconName: 'quick-book-connector',
                title: this.ls.l('QuickBookConnectorTitle'),
                description: this.ls.l('QuickBookConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.QuickBook))
            },
            {
                name: AccountConnectors.XeroOAuth2,
                iconName: 'xero-connector',
                title: this.ls.l('XeroConnectorTitle'),
                description: this.ls.l('XeroConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.XeroOAuth2))
            }
        ];
        /** Select connector by default */
        this.selectConnector(this.connectors.find((connector: AccountConnector) => !connector.disabled));
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
