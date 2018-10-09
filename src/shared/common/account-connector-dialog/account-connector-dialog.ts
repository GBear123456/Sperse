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
import { AccountConnectors } from '@shared/AppEnums';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material';
import { AccountConnectorDialogData } from '@shared/common/account-connector-dialog/models/account-connector-dialog-data';
import { QuovoLoginComponent } from '@shared/common/account-connector-dialog/quovo-login/quovo-login.component';
import { XeroLoginComponent } from '@shared/common/account-connector-dialog/xero-login/xero-login.component';

@Component({
    selector: 'account-connector-dialog',
    styleUrls: [ './account-connector-dialog.less'],
    templateUrl: './account-connector-dialog.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorDialogComponent implements OnInit {
    static defaultConfig: MatDialogConfig = {
        height: '655px',
        width: '900px',
        id: 'account-connector-dialog',
        panelClass: ['account-connector-dialog']
    };
    @ViewChild(QuovoLoginComponent) quovoLogin: QuovoLoginComponent;
    @ViewChild(XeroLoginComponent) xeroLogin: XeroLoginComponent;
    @Output() onComplete: EventEmitter<null> = new EventEmitter<null>();
    selectedConnector: AccountConnectors;
    accountConnectors = AccountConnectors;

    constructor(
        private dialogRef: MatDialogRef<AccountConnectorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AccountConnectorDialogData
    ) {}

    ngOnInit() {
        /** Move to the connector and skip choosing if certain connector comes from outside */
        if (this.data && this.data.connector) {
            this.openConnector(this.data.connector);
        }
        this.dialogRef.afterClosed().subscribe(() => {
            window.scrollTo(0, 0);
        });
    }

    openConnector(connector: AccountConnectors) {
        if (connector === AccountConnectors.Quovo) {
            /** Decrease dialog sized to 0 (like hide) and open quovo iframe dialog instead,
             * setTimeout to avoid changed after check error */
            this.dialogRef.updateSize('0', '0');
        }
        this.selectedConnector = connector;
    }

    closeDialog(e) {
        this.dialogRef.close(e);
    }

    complete() {
        this.onComplete.emit();
    }
}
