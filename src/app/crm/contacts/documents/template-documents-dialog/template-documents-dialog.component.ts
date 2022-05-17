/** Core imports */
import { Component, ViewChild, OnInit, AfterViewInit, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import RemoteFileProvider from 'devextreme/ui/file_manager/file_provider/remote';
import CustomFileProvider from 'devextreme/ui/file_manager/file_provider/custom';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';
import { finalize, map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from 'abp-ng2-module';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { DocumentServiceProxy, UploadDocumentInput, DocumentInfo } from '@shared/service-proxies/service-proxies';
import { StringHelper } from '@shared/helpers/StringHelper';
import { TemplateDocumentsDialogData } from '@app/crm/contacts/documents/template-documents-dialog/template-documents-dialog-data.interface';

@Component({
    templateUrl: 'template-documents-dialog.component.html',
    styleUrls: ['template-documents-dialog.component.less']
})
export class TemplateDocumentsDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxFileManagerComponent) fileManager: DxFileManagerComponent;

    files         = [];
    uploadedCount = 0;
    totalCount    = 0;

    private slider: any;
    private uploadSubscribers = [];

    public readonly VIEW_MODE_DETAILS    = 'details';
    public readonly VIEW_MODE_THUMBNAILS = 'thumbnails';

    layout = this.VIEW_MODE_THUMBNAILS;
    documentsFileProvider = new CustomFileProvider({
        getItems: () => {
            return this.documentService.getAll(this.data.contactId).pipe(
                map((documents: DocumentInfo[]) => {
                    return documents.map((item: DocumentInfo) => {
                        return {
                            key: item.fileId,
                            name: item.fileName,
                            size: item.size
                        };
                    });
                })
            ).toPromise();
        }
    });
    templatesFileProvider = new RemoteFileProvider({
        endpointUrl: AppConsts.remoteServiceBaseUrl + '/api/services/CRM/DocumentTemplates/FileSystem'
    });
    isDocumentsVisible = !!(this.data.showDocuments && this.data.contactId);
    isTemplatesVisible = this.permission.isGranted(AppPermissions.CRMFileStorageTemplates);
    folderTabs = [
        {
            id: 0,
            visible: this.isDocumentsVisible || this.isTemplatesVisible,
            text: '',
            icon: 'upload',
        },
        {
            id: 1,
            visible: this.isDocumentsVisible,
            text: this.ls.l('Documents'),
            icon: 'inactivefolder',
        },
        {
            id: 2,
            visible: this.isTemplatesVisible,
            text: this.ls.l('Templates'),
            icon: 'activefolder',
        }
    ];
    selectedIndex = 0;
    title: string = this.data.title || this.ls.l('UploadDocumentsDialogTitle');

    constructor(
        private documentService: DocumentServiceProxy,
        private elementRef: ElementRef,
        private notify: NotifyService,
        private loadingService: LoadingService,
        private permission: PermissionCheckerService,
        public dialogRef: MatDialogRef<TemplateDocumentsDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: TemplateDocumentsDialogData,
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: (this.data.fullHeight ? 0 : 75) + 'px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: (this.data.fullHeight ? 0 : 75) + 'px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, this.data.fullHeight ? '100vh' : 'calc(100vh - 75px)');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: (this.data.fullHeight ? 0 : 75) + 'px',
                    right: '0px'
                });
            }, 100);
        });
    }

    getHeight() {
        return innerHeight - (this.data.fullHeight ? 170 : 250) + 'px';
    }

    onContentReady() {
        setTimeout(() =>
            this.loadingService.finishLoading(
                this.elementRef.nativeElement
            ), 600
        );
    }

    onAddFile() {
        let selected = this.fileManager.instance.getSelectedItems().filter(item => !item.isDirectory);
        if (selected.length)
            this.dialogRef.close(selected);
        else
            this.notify.error(this.ls.l('File_Empty_Error'));
    }

    onLayoutToogle() {
        this.layout = this.layout == this.VIEW_MODE_DETAILS
            ? this.VIEW_MODE_THUMBNAILS : this.VIEW_MODE_DETAILS;
    }

    fileDropped(dropedFiles: NgxFileDropEntry[]) {
        let files = [];
        dropedFiles.forEach((item) => {
            (item.fileEntry as FileSystemFileEntry).file((file: File) => {
                files.push(file);
                if (dropedFiles.length == files.length)
                    this.uploadFiles(files);
            });
        });
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
            this.files.push({
                type: this.getFileTypeByExt(file.name),
                name: file.name,
                progress: 0
            });
            let fileReader: FileReader = new FileReader();
            fileReader.onloadend = (loadEvent: any) => {
                if (loadEvent.target.result != null)
                    this.uploadFile({
                        name: file.name,
                        size: StringHelper.getSize(file.size, loadEvent.target.result),
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
        if (AppConsts.regexPatterns.notSupportedDocuments.test(input.name)) {
            this.notify.error(this.ls.l('FileTypeIsNotAllowed'));
            this.updateUploadedCounter();
            return;
        }

        if (input.size > AppConsts.maxDocumentSizeBytes) {
            this.notify.error(this.ls.l('FilesizeLimitWarn', AppConsts.maxDocumentSizeMB));
            this.updateUploadedCounter();
            return;
        }

        let progressInterval = setInterval(
            this.updateUploadProgress.bind(this, index),
            Math.round(input.size / 10000)
        );
        this.uploadSubscribers.push(
            this.documentService.upload(UploadDocumentInput.fromJS({
                contactId: this.data.contactId,
                fileName: input.name,
                size: input.size,
                file: input.fileBase64
            })).pipe(finalize(() => {
                this.finishUploading(progressInterval, index);
            })).subscribe(() => {
                if (this.data.invalidate)
                    this.data.invalidate();
            })
        );
    }

    finishUploading(progressInterval, index) {
        clearInterval(progressInterval);
        this.finishUploadProgress(index);
        this.updateUploadedCounter();
    }

    updateUploadedCounter() {
        this.uploadedCount++;
        if (this.uploadedCount >= this.totalCount) {
            this.totalCount = 0;
            this.uploadedCount = 0;
        }
    }

    cancelUpload(index) {
        let file = this.files[index];
        if (file && file.progress < 100) {
            if (this.uploadSubscribers[index]) {
                this.uploadSubscribers[index].unsubscribe();
                this.uploadSubscribers.splice(index, 1);
            }
            this.files.splice(index, 1);
            this.totalCount = this.files.length;
        }
    }

    close() {
        this.dialogRef.close();
    }
}