/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';

/** Application imports */
import { AuditLogListDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'auditLogDetailModal',
    templateUrl: './audit-log-detail-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogDetailModalComponent implements OnInit {
    auditLog: AuditLogListDto;

    constructor(
        public ls: AppLocalizationService,
        private dialogRef: MatDialogRef<AuditLogDetailModalComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        const self = this;
        self.auditLog = this.data.record;
    }

    getExecutionTime(): string {
        const self = this;
        return moment(self.auditLog.executionTime).fromNow() + ' (' + moment(self.auditLog.executionTime).format('YYYY-MM-DD HH:mm:ss') + ')';
    }

    getDurationAsMs(): string {
        return this.ls.ls('Platform', 'Xms', this.auditLog.executionDuration.toString());
    }

    getFormattedParameters(): string {
        try {
            const json = JSON.parse(this.auditLog.parameters);
            return JSON.stringify(json, null, 4);
        } catch (e) {
            return this.auditLog.parameters;
        }
    }

    close(): void {
        this.dialogRef.close();
    }
}
