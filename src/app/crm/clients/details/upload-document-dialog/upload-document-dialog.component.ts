import { Component, Inject, Injector, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StringHelper } from '@shared/helpers/StringHelper';
import { DocumentTypesListComponent } from '../document-types-list/document-types-list.component';
import { DocumentTypeServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'upload-document-dialog',
  templateUrl: 'upload-document-dialog.html',
  styleUrls: ['upload-document-dialog.less'],
  providers: [DocumentTypeServiceProxy]
})
export class UploadDocumentDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild(DocumentTypesListComponent) documentTypesListComponent: DocumentTypesListComponent;

    public documentTypes = [];
    public file: File;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<UploadDocumentDialogComponent>,
        private documentTypeService: DocumentTypeServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

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
