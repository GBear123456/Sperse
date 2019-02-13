import { Component, Inject } from '@angular/core';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './not-supported-type-dialog.component.html',
    styleUrls: ['./not-supported-type-dialog.component.less']
})
export class NotSupportedTypeDialogComponent {
    constructor(
        private documentsService: DocumentsService,
        private dialogRef: MatDialogRef<NotSupportedTypeDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    downloadDocument() {
        this.documentsService.downloadDocument(this.data.documentId);
        this.dialogRef.close();
    }
}
