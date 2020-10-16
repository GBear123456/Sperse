/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, Injector } from '@angular/core';

/**  Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { ChangeAutoSyncInput, SyncAccountServiceProxy } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';

@Component({
    selector: 'auto-sync-dialog',
    templateUrl: 'auto-sync-dialog.component.html',
    styleUrls: [ 'auto-sync-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoSyncDialogComponent extends CFOComponentBase {
    time: Date = new Date();
    constructor(
        injector: Injector,
        private syncAccountServiceProxy: SyncAccountServiceProxy,
        private bankAccountsService: BankAccountsService,
        private dialogRef: MatDialogRef<AutoSyncDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string, syncAccountsIds: number[], autoSyncTime: string }
    ) {
        super(injector);
        if (this.data.autoSyncTime === null) {
            this.time = undefined;
        } else if (this.data.autoSyncTime) {
            const [ hours, minutes ] = data.autoSyncTime.split(':');
            this.time.setHours(+hours);
            this.time.setMinutes(+minutes);
            this.time.setSeconds(0);
        } else {
            this.time.setHours(0);
            this.time.setMinutes(0);
            this.time.setSeconds(0);
        }
    }

    setAutoSyncTime() {
        if (this.data.syncAccountsIds && this.data.syncAccountsIds.length) {
            let autoSyncTime;
            if (this.time)
                autoSyncTime = this.getFormattedTimePart(this.time.getHours()) + ':'
                    + this.getFormattedTimePart(this.time.getMinutes()) + ':'
                    + this.getFormattedTimePart(this.time.getSeconds());

            this.syncAccountServiceProxy.changeAutoSyncTime(
                this.instanceType,
                this.instanceId,
                new ChangeAutoSyncInput({
                    syncAccountIds: this.data.syncAccountsIds,
                    autoSyncTime: autoSyncTime
                })
            ).subscribe(() => {
                this.dialogRef.close(true);
                this.notify.success(this.l('AutoSyncTimeUpdated'));
            });
        }
    }

    discardAutoSyncTime() {
        this.time = undefined;
        this.setAutoSyncTime();
    }

    private getFormattedTimePart(timePart: number): string {
        return timePart < 10 ? '0' + timePart : timePart.toString();
    }
}