/** Core imports */
import { Component, Injector, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SyncAccountServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { SynchProgressService } from '../helpers/synch-progress.service';

@Component({
    selector: 'add-account-button',
    templateUrl: './add-account-button.component.html',
    styleUrls: ['./add-account-button.component.less'],
    providers: [ SyncAccountServiceProxy ]
})
export class AddAccountButtonComponent extends CFOComponentBase {
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    @Output() onClosed: EventEmitter<any> = new EventEmitter();
    createAccountAvailable: boolean;
    prevSyncStatus: string;

    constructor(
        injector: Injector,
        private cfoService: CFOService,
        private syncProgressService: SynchProgressService,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector);

        this.syncProgressService.syncData$.pipe(
            takeUntil(this.deactivate$)
        ).subscribe((res) => {
            if (res.totalProgress.syncStatus != this.prevSyncStatus) {
                this.prevSyncStatus = res.totalProgress.syncStatus;
                this.checkCreateIsAllowed();
            }
        });

        this.checkCreateIsAllowed();
    }

    checkCreateIsAllowed() {
        this._syncAccountServiceProxy.createIsAllowed(
            InstanceType[this.instanceType], this.instanceId
        ).subscribe((result) => {
            this.createAccountAvailable = result;
        });
    }

    openAddAccountDialog() {
        if (!this.createAccountAvailable)
            return;

        const accountConnectorDialog = this.dialog.open(AccountConnectorDialogComponent, {
            ...AccountConnectorDialogComponent.defaultConfig,
            ...{
                data: {
                    instanceType: this.instanceType,
                    instanceId: this.instanceId
                }
            }
        });
        accountConnectorDialog.afterClosed().subscribe(() => {
            this.onClosed.emit();
        })
        accountConnectorDialog.componentInstance.onComplete.subscribe(() => {
            this.onComplete.emit();
        });
    }
}