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
import { filter, first, switchMap } from 'rxjs/operators';

/** Application imports */
import { AccountConnectors, SyncTypeIds } from '@shared/AppEnums';
import { AccountConnectorDialogData } from '@shared/common/account-connector-dialog/models/account-connector-dialog-data';
import { QuovoLoginComponent } from '@shared/common/account-connector-dialog/quovo-login/quovo-login.component';
import { XeroLoginComponent } from '@shared/common/account-connector-dialog/xero-login/xero-login.component';
import { SyncAccountServiceProxy, CreateSyncAccountInput } from '@shared/service-proxies/service-proxies';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { CFOService } from '@shared/cfo/cfo.service';

@Component({
    selector: 'account-connector-dialog',
    styleUrls: [ './qlink-icons.less', './account-connector-dialog.less' ],
    templateUrl: './account-connector-dialog.html',
    providers: [SyncAccountServiceProxy],
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
    @ViewChild(QuovoLoginComponent) quovoLogin: QuovoLoginComponent;
    @ViewChild(XeroLoginComponent) xeroLogin: XeroLoginComponent;
    @Output() onComplete: EventEmitter<null> = new EventEmitter<null>();
    selectedConnector: AccountConnectors;
    accountConnectors = AccountConnectors;
    showBackButton = true;

    constructor(
        private syncAccount: SyncAccountServiceProxy,
        private dialogRef: MatDialogRef<AccountConnectorDialogComponent>,
        private syncProgressService: SynchProgressService,
        private cfoService: CFOService,
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
        if (connector === AccountConnectors.Quovo) {
            /** Decrease dialog sized to 0 (like hide) and open quovo iframe dialog instead,
             * setTimeout to avoid changed after check error */
            this.dialogRef.updateSize('0', '0');
        } else if (connector === AccountConnectors.Plaid) {
            if (window['Plaid'])
                this.createPlaidHandler();
            else
              this.loadPlaidScript(() => this.createPlaidHandler());
        } else if (connector === AccountConnectors.XeroOAuth2) {
            this.dialogRef.close();
        }
        this.selectedConnector = connector;
    }

    private loadPlaidScript(callback: () => void): void {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.addEventListener('load', callback);
        document.head.appendChild(script);
    }

    createPlaidHandler() {
        this.cfoService.statusActive$.pipe(
            filter(Boolean),
            first(),
            switchMap(() => this.syncAccount.getPlaidConfig(this.cfoService.instanceType, this.cfoService.instanceId))
        ).subscribe(res => {
            let handler = window['Plaid'].create({
                clientName: res.clientName,
                env: res.evn,
                key: res.key,
                product: res.product,
                webhook: res.webhook,
                onLoad: () => this.closeDialog(null),
                onSuccess: (public_token, metadata) => {
                    this.complete();
                    handler.exit();
                    this.syncAccount.create(this.cfoService.instanceType, this.cfoService.instanceId, new CreateSyncAccountInput({
                        isSyncBankAccountsEnabled: true,
                        typeId: SyncTypeIds.Plaid,
                        consumerKey: undefined,
                        consumerSecret: undefined,
                        publicToken: public_token
                    })).subscribe(() => this.syncProgressService.startSynchronization(true, false));
                }
            });
            handler.open();
        });
    }

    closeDialog(e) {
        this.dialogRef.close(e);
    }

    complete() {
        this.onComplete.emit();
    }
}
