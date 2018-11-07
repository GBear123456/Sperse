/** Core imports */
import { Component, OnInit, AfterViewInit, Inject, Injector, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { filter, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { DocumentServiceProxy, UploadDocumentInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { StringHelper } from '@shared/helpers/StringHelper';
import { ContactsService } from '../../contacts.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'upload-documents-dialog.html',
    styleUrls: ['upload-documents-dialog.less']
})
export class UploadDocumentsDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @ViewChild('dropDown') dropDownElement: ElementRef;
    @ViewChild('uploading') uploadingElement: ElementRef;

    private files = [];
    private slider: any;

    uploadedCount = 0;
    totalCount    = 0; 

    constructor(injector: Injector,
        private _clientService: ContactsService,
        private _documentService: DocumentServiceProxy,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<UploadDocumentsDialogComponent>,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '157px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '157px',
                    right: '0px'
                });
            }, 100);
        });
    }

    fileChangeListener($event) {
        this.uploadFiles($event.target.files);
    }

    fileDropped($event) {
        let files = [];
        $event.files.forEach((item) => {
            (item.fileEntry as FileSystemFileEntry).file((file: File) => {
                files.push(file);
                if ($event.files.length == files.length)
                    this.uploadFiles(files);
            });
        });
    }

  
    close() {
        this.dialogRef.close();
    }

    displayElement(element, visible = true) {
        element.nativeElement.style.display = visible ? 'block': 'none';
    }

    uploadFiles(files) {
        this.files = [];
        this.uploadedCount = 0;
        this.totalCount = files.length;
        this.displayElement(this.dropDownElement, false);
        this.displayElement(this.uploadingElement, true);

        Array.prototype.forEach.call(files, (file) => {
            let fileReader: FileReader = new FileReader();
            fileReader.onloadend = (loadEvent: any) => {
                this.files.push({
                    name: file.name, 
                    progress: 0
                });
                this.uploadFile({
                    name: file.name,
                    size: file.size,
                    fileBase64: StringHelper.getBase64(loadEvent.target.result)
                });
            };
            fileReader.readAsDataURL(file);
        });
    }

    updateUploadProgress(data) {
        let elm = document.querySelector('file-drop .content');
        if (elm && data.progress < 90 || data.progress > 95)
            elm['style'].background = 'linear-gradient(to right, #e9f7fb ' + (data.progress++) + '%, #F8F7FC 0%)';
    }

    uploadFile(input) {
        let data = {progress: 0},
            progressInterval = setInterval(
                this.updateUploadProgress.bind(this, data),
                Math.round(input.size / 10000)
            );
        this._documentService.upload(UploadDocumentInput.fromJS({
            contactGroupId: this.data.contactId,
            fileName: input.name,
            size: input.size,
            fileBase64: input.fileBase64
        })).pipe(finalize(() => {
            this.uploadedCount++;
            clearInterval(progressInterval);
            this.updateUploadProgress({progress: 100});
            setTimeout(() => {
                this.updateUploadProgress({progress: 0});
            }, 5000);
        })).subscribe(() => {
            this._clientService.invalidate('documents');
        });
    }
}