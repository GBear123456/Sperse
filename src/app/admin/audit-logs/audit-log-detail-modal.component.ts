import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AuditLogListDto } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'auditLogDetailModal',
    templateUrl: './audit-log-detail-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogDetailModalComponent extends AppModalDialogComponent implements OnInit {
    auditLog: AuditLogListDto;

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.data = injector.get(MAT_DIALOG_DATA);
        this.data.title = this.l('AuditLogDetail');
    }

    ngOnInit() {
        const self = this;
        self.auditLog = this.data.record;
    }

    getExecutionTime(): string {
        const self = this;
        return moment(self.auditLog.executionTime).fromNow() + ' (' + moment(self.auditLog.executionTime).format('YYYY-MM-DD HH:mm:ss') + ')';
    }

    getDurationAsMs(): string {
        const self = this;
        return self.l('Xms', self.auditLog.executionDuration);
    }

    getFormattedParameters(): string {
        const self = this;
        try {
            const json = JSON.parse(self.auditLog.parameters);
            return JSON.stringify(json, null, 4);
        } catch (e) {
            return self.auditLog.parameters;
        }
    }

    close(): void {
        this.dialogRef.close();
    }
}
