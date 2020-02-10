/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    ViewChild,
    ViewEncapsulation,
    Inject,
    OnInit,
    Output
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { AccountConnectors } from '@shared/AppEnums';
import { AccountConnectorDialogData } from '@shared/common/account-connector-dialog/models/account-connector-dialog-data';
import { QuovoLoginComponent } from '@shared/common/account-connector-dialog/quovo-login/quovo-login.component';
import { XeroLoginComponent } from '@shared/common/account-connector-dialog/xero-login/xero-login.component';

@Component({
    selector: 'account-connector-dialog',
    styleUrls: [ './qlink-icons.less', './account-connector-dialog.less' ],
    templateUrl: './account-connector-dialog.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorDialogComponent implements OnInit {
    static defaultConfig: MatDialogConfig = {
        height: '662px',
        width: '900px',
        id: 'account-connector-dialog',
        panelClass: ['account-connector-dialog']
    };
    @ViewChild(QuovoLoginComponent, { static: true }) quovoLogin: QuovoLoginComponent;
    @ViewChild(XeroLoginComponent, { static: true }) xeroLogin: XeroLoginComponent;
    @Output() onComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
    selectedConnector: AccountConnectors;
    accountConnectors = AccountConnectors;
    showBackButton = true;

    constructor(
        private dialogRef: MatDialogRef<AccountConnectorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AccountConnectorDialogData
    ) {}

    ngOnInit() {
        /** Move to the connector and skip choosing if certain connector comes from outside */
        if (this.data) {
            if (this.data.connector) {
                this.openConnector(this.data.connector);
            }
            if (this.data.showBackButton !== undefined) {
                this.showBackButton = this.data.showBackButton;
            }
        }
        /** To avoid bug of scrolling of document out of the window */
        this.dialogRef.afterClosed().subscribe(() => {
            window.scrollTo(0, 0);
        });
    }

    openConnector(connector: AccountConnectors) {
        if (connector === AccountConnectors.Quovo || connector == AccountConnectors.XeroOAuth2) {
            /** Decrease dialog sized to 0 (like hide) and open quovo iframe dialog instead,
             * setTimeout to avoid changed after check error */
            this.dialogRef.updateSize('0', '0');
        }
        this.selectedConnector = connector;
    }

    closeDialog(e?) {
        this.dialogRef.close(e);
    }

    complete(startLoading = false) {
        this.onComplete.emit(startLoading);
        this.closeDialog();
    }
}
