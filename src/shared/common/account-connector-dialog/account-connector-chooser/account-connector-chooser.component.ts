import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AccountConnector } from '@shared/common/account-connector-dialog/models/account-connector.model';
import { AccountConnectors } from '@shared/AppEnums';
import { MatDialogRef } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ConditionsType } from '@shared/AppEnums';

@Component({
    selector: 'account-connector-chooser',
    styleUrls: [ './account-connector-chooser.less' ],
    templateUrl: './account-connector-chooser.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorChooserComponent implements OnInit {
    @Input() disabledConnectors: AccountConnectors[];
    @Output() onConnectorChosen: EventEmitter<AccountConnectors> = new EventEmitter<AccountConnectors>();

    conditionsType = ConditionsType;
    selectedConnector: AccountConnector;
    accountConnectors = AccountConnectors;
    connectors: {
        [name: string]: AccountConnector
    };

    constructor(
        private dialog: MatDialog,
        private appSessionService: AppSessionService,
        private dialogRef: MatDialogRef<AccountConnectorChooserComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.connectors = {
            [AccountConnectors.Plaid]: {
                name: AccountConnectors.Plaid,
                iconName: 'plaid-connector',
                title: this.ls.l('PlaidConnectorTitle'),
                description: this.ls.l('PlaidConnectorDescription'),
                disabled: this.checkDisabled(AccountConnectors.Plaid)
            },
            [AccountConnectors.SaltEdge]: {
                name: AccountConnectors.SaltEdge,
                iconName: 'salt-edge-connector',
                title: this.ls.l('SaltEdgeConnectorTitle'),
                description: this.ls.l('SaltEdgeConnectorDescription'),
                disabled: this.checkDisabled(AccountConnectors.SaltEdge)
            },        
            [AccountConnectors.QuickBook]: {
                name: AccountConnectors.QuickBook,
                iconName: 'quick-book-connector',
                title: this.ls.l('QuickBookConnectorTitle'),
                description: this.ls.l('QuickBookConnectorDescription'),
                disabled: this.checkDisabled(AccountConnectors.QuickBook)
            },
            [AccountConnectors.XeroOAuth2]: {
                name: AccountConnectors.XeroOAuth2,
                iconName: 'xero-connector',
                title: this.ls.l('XeroConnectorTitle'),
                description: this.ls.l('XeroConnectorDescription'),
                disabled: this.checkDisabled(AccountConnectors.XeroOAuth2)
            }
        };
        /** Select connector by default */
        this.selectConnector(Object.keys(AccountConnectors).map((name: AccountConnectors) => {
            return this.connectors[name];
        }).find((connector: AccountConnector) => !connector.disabled));
    }

    checkDisabled(connectorName: AccountConnectors) {      
        return connectorName == AccountConnectors.SaltEdge || 
            !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(connectorName));
    }

    selectConnector(connector: AccountConnector, next: boolean = false) {
        if (!connector.disabled) {
            this.selectedConnector = connector;
            if (next) {
                this.next();
            }
        }
    }

    openTermsModal(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type } });
    }

    next() {
        if (this.selectedConnector)
            this.onConnectorChosen.emit(this.selectedConnector.name);
    }

    close() {
        this.dialogRef.close();
    }
}