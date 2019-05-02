/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AuditLogServiceProxy, EntityChangeListDto, EntityPropertyChangeDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'entityChangeDetailModal',
    templateUrl: './entity-change-detail-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityChangeDetailModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    active = false;
    entityPropertyChanges: EntityPropertyChangeDto[];
    entityChange: EntityChangeListDto;

    constructor(
        private _auditLogService: AuditLogServiceProxy,
        private _dialogRef: MatDialogRef<EntityChangeDetailModalComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        const entityForEdit: EntityChangeListDto = this.data.entityForEdit;
        this.modalDialog.startLoading();
        this._auditLogService.getEntityPropertyChanges(entityForEdit.id)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                this.entityPropertyChanges = result;
                this._changeDetectorRef.detectChanges();
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
