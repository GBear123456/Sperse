import {Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CustomersServiceProxy, CustomerInfoDto, DocumentServiceProxy, UploadDocumentInput,
    DocumentInfo, WopiRequestOutcoming } from '@shared/service-proxies/service-proxies';
import { MatDialog } from '@angular/material';

import { UploadEvent, UploadFile } from 'ngx-file-drop';

import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import { StringHelper } from '@shared/helpers/StringHelper';

import { ImageViewerComponent } from 'ng2-image-viewer';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ DocumentServiceProxy ]
})
export class DocumentsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;

    public data: {
        customerInfo: CustomerInfoDto
    };

    private masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    dataSource: any;

    public actionMenuItems: any;
    public actionRecordData: any;
    public openDocumentMode = false;
    public currentDocumentInfo: DocumentInfo;
    public wopiUrlsrc: string;
    public wopiAccessToken: string;
    public wopiAccessTokenTtl: string;
    public showViewerType: number;

    public readonly WOPI_VIEWER  = 0;
    public readonly IMAGE_VIEWER = 1;
    public readonly TEXT_VIEWER  = 2;

    validImageExtensions: String[] = ['png', 'jpg', 'jpeg', 'gif'];
    validTextExtensions: String[] = ['txt', 'text'];

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _documentService: DocumentServiceProxy,
        private _customerService: CustomersServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

        this.actionMenuItems = [
            {
                text: this.l('View'),
                action: this.viewDocument.bind(this)
            },
            {
                text: this.l('Edit'),
                action: this.editDocument.bind(this)
            }
        ];
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        this.data = this._customerService['data'];
        this.loadDocuments();
    }

    loadDocuments() {
        this._documentService.getAll(this.data.customerInfo.id).subscribe((result) => {
            this.dataSource = result;
        });
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }

    calculateDateCellValue = (data) => {
        return data.dateTime.format(this.formatting.dateTime.toUpperCase());
    }

    ngAfterViewInit(): void {
    }

    onContentReady(event) {
        this.setGridDataLoaded();
    }

    ngOnDestroy() {
    }

    fileSelected($event) {
        let files = $event.target.files;
        if (files.length)
            this.uploadSelectedFiles(files);
    }

    uploadSelectedFiles(files) {
        for (let file of files) {
            this.uploadFile(file);
        }
    }

    fileDropped($event) {
        let files = $event.files;
        if (files.length)
            this.uploadDroppedFiles(files);
    }

    uploadDroppedFiles(list) {
        for (let droppedFile of list) {
            if (droppedFile.fileEntry.isFile)
                this.uploadDroppedFile(droppedFile);
        }
    }

    uploadDroppedFile(droppedFile) {
        let fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => this.uploadFile(file));
    }

    uploadFile(file) {
        let myReader: FileReader = new FileReader();
        myReader.onloadend = (loadEvent: any) => {
            this._documentService.upload(UploadDocumentInput.fromJS({
                customerId: this.data.customerInfo.id,
                fileName: file.name,
                size: file.size,
                fileBase64: StringHelper.getBase64(loadEvent.target.result)
            })).subscribe(() => {
                this.loadDocuments();
            });
        };
        myReader.readAsDataURL(file);
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }

    showActionsMenu(event) {
        this.actionRecordData = event.data;
        event.cancel = true;
    }

    onMenuItemClick($event) {
        this.currentDocumentInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
    }

    viewDocument() {
        let ext = this.currentDocumentInfo.fileName.split('.').pop();
        this.showViewerType = this.validImageExtensions.indexOf(ext) < 0 ?
            (this.validTextExtensions.indexOf(ext) < 0 ? this.WOPI_VIEWER : this.TEXT_VIEWER) : this.IMAGE_VIEWER;
        if (this.showViewerType == this.WOPI_VIEWER)
            this._documentService.getViewWopiRequestInfo(this.currentDocumentInfo.id).subscribe((response) => {
                this.submitWopiRequest(response);
            });
        else
            this.openDocumentMode = true;
    }

    editDocument() {
        this._documentService.getEditWopiRequestInfo(this.currentDocumentInfo.id).subscribe((response) => {
            this.submitWopiRequest(response);
        });
    }

    submitWopiRequest(wopiRequestInfo: WopiRequestOutcoming) {
        this.openDocumentMode = true;
        this.showViewerType = this.WOPI_VIEWER;
        this.wopiUrlsrc = wopiRequestInfo.wopiUrlsrc;
        this.wopiAccessToken = wopiRequestInfo.accessToken;
        this.wopiAccessTokenTtl = wopiRequestInfo.accessTokenTtl.toString();
        setTimeout(() => {
            window['submitWopiRequest']();
        }, 500);
    }

    closeDocument() {
        this.openDocumentMode = false;
    }
}
