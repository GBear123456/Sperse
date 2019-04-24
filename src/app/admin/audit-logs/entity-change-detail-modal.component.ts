/** Core imports */
import { Component, Inject, OnInit } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as moment from 'moment';

/** Application imports */
import { AuditLogServiceProxy, EntityChangeListDto, EntityPropertyChangeDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'entityChangeDetailModal',
    templateUrl: './entity-change-detail-modal.component.html'
})
export class EntityChangeDetailModalComponent implements OnInit {

    active = false;
    entityPropertyChanges: EntityPropertyChangeDto[];
    entityChange: EntityChangeListDto;

    constructor(
        private _auditLogService: AuditLogServiceProxy,
        private _dialogRef: MatDialogRef<EntityChangeDetailModalComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        const entityForEdit: EntityChangeListDto = this.data.entityForEdit;
        this._auditLogService.getEntityPropertyChanges(entityForEdit.id).subscribe((result) => {
            this.entityPropertyChanges = result;
        });
    }

    getPropertyChangeValue(propertyChangeValue, propertyTypeFullName) {
        if (!propertyChangeValue) {
            return propertyChangeValue;
        }
        propertyChangeValue = propertyChangeValue.replace(/^['"]+/g, '').replace(/['"]+$/g, '');
        if (this.isDate(propertyChangeValue, propertyTypeFullName)) {
            return moment(propertyChangeValue).format('YYYY-MM-DD HH:mm:ss');
        }

        if (propertyChangeValue === 'null') {
            return '';
        }

        return propertyChangeValue;
    }

    isDate(date, propertyTypeFullName): boolean {
        return propertyTypeFullName.includes('DateTime') && !isNaN(Date.parse(date).valueOf());
    }

    close(): void {
        this._dialogRef.close();
    }
}
