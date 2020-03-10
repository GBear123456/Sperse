/** Core imports */
import { Component, Inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { StringHelper } from '@shared/helpers/StringHelper';
import { DocumentTypesListComponent } from '../document-types-list/document-types-list.component';
import { DocumentTypeServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '../../../shared/common/localization/app-localization.service';

@Component({
  selector: 'upload-document-dialog',
  templateUrl: 'upload-document-dialog.html',
  styleUrls: ['upload-document-dialog.less'],
  providers: [DocumentTypeServiceProxy]
})
export class UploadDocumentDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DocumentTypesListComponent, { static: false }) documentTypesListComponent: DocumentTypesListComponent;

    public documentTypes = [];
    public file: File;

    constructor(
        private documentTypeService: DocumentTypeServiceProxy,
        public dialogRef: MatDialogRef<UploadDocumentDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    fileChangeListener($event) {
        this.file = $event.target.files[0];
    }

    onSave(event) {
        let documentTypeId = this.documentTypesListComponent.selectedDocumentTypeId;

        if (!this.file)
            return;

        let fileReader: FileReader = new FileReader();
        fileReader.onloadend = (loadEvent: any) => {
            this.dialogRef.close({
                typeId: documentTypeId,
                name: this.file.name,
                size: this.file.size,
                fileBase64: StringHelper.getBase64(loadEvent.target.result)
            });
        };
        fileReader.readAsDataURL(this.file);
    }

    loadDocumentTypes() {
        this.documentTypeService.getAll().subscribe((response) => {
            this.documentTypes = response;
        });
    }

    ngOnInit() {
        this.file = this.data.file;
    }

    ngAfterViewInit() {
        this.loadDocumentTypes();
    }
}
