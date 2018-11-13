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
    public files = [];
    private slider: any;
    private uploadSubscribers = [];

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

    getFileTypeByExt(fileName) {
        let ext = fileName.split('.').pop();
        if (['xdoc', 'doc', 'txt'].indexOf(ext) >= 0)
            return 'doc';
        return ext;
    }

    uploadFiles(files) {
        this.files = [];
        this.uploadedCount = 0;
        this.uploadSubscribers = [];
        this.totalCount = files.length;

        Array.prototype.forEach.call(files, (file, index) => {
            let fileReader: FileReader = new FileReader();
            fileReader.onloadend = (loadEvent: any) => {
                this.files.push({
                    type: this.getFileTypeByExt(file.name),
                    name: file.name, 
                    progress: 0
                });
                this.uploadFile({
                    name: file.name,
                    size: file.size,
                    fileBase64: StringHelper.getBase64(loadEvent.target.result)
                }, index);
            };
            fileReader.readAsDataURL(file);
        });
    }

    finishUploadProgress(index) {
        this.files[index].progress = 100;
    }

    updateUploadProgress(index) {
        let file = this.files[index];
        if (file && file.progress < 95)
            file.progress++;
    }

    uploadFile(input, index) {
        let progressInterval = setInterval(
                this.updateUploadProgress.bind(this, index),
                Math.round(input.size / 10000)
            );
        this.uploadSubscribers.push(
            this._documentService.upload(UploadDocumentInput.fromJS({
                contactId: this.data.contactId,
                fileName: input.name,
                size: input.size,
                fileBase64: input.fileBase64
            })).pipe(finalize(() => {
                this.uploadedCount++;            
                clearInterval(progressInterval);
                this.finishUploadProgress(index);
                if (this.uploadedCount >= this.totalCount) {
                    this.totalCount = 0;
                    this.uploadedCount = 0;
                }                
            })).subscribe(() => {
                this._clientService.invalidate('documents');
            })
        );
    }

    cancelUpload(index) {
        let file = this.files[index];
        if (file && file.progress < 100 && this.uploadSubscribers[index]) {
            this.uploadSubscribers[index].unsubscribe();
            this.uploadSubscribers.splice(index, 1);
            this.files.splice(index, 1);
            this.totalCount = this.files.length;
        }
    }
}