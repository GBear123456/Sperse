/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { AccountConnectors } from '@shared/AppEnums';
import { AccountConnectorDialogData } from '@shared/common/account-connector-dialog/models/account-connector-dialog-data';
import { ConnectionMode } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'account-connector-dialog',
    styleUrls: [ './qlink-icons.less', './account-connector-dialog.less' ],
    templateUrl: './account-connector-dialog.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorDialogComponent implements OnInit {
    static defaultConfig: MatDialogConfig = {
        height: '680px',
        width: '900px',
        id: 'account-connector-dialog',
        panelClass: ['account-connector-dialog']
    };
    @Output() onComplete: EventEmitter<boolean> = new EventEmitter<boolean>();
    selectedConnector: AccountConnectors;
    accountConnectors = AccountConnectors;
    showBackButton = true;

    get connectionMode(): ConnectionMode {
        return this.data.mode || ConnectionMode.Create;
    }

    constructor(
        private elementRef: ElementRef,
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
        let container = this.elementRef.nativeElement.closest(
            '#' + this.dialogRef.id
        );
        container.style.padding = 0;
        if (connector == AccountConnectors.SaltEdge) {
            container.style.background = 'transparent';
            container.style.boxShadow = 'none';
        } else
            this.dialogRef.updateSize('0', '0');
        this.selectedConnector = connector;
    }

    closeDialog(e?) {
        this.dialogRef.close(e);
    }

    complete(startLoading: boolean = false) {
        this.onComplete.emit(startLoading);
        this.closeDialog();
    }
}