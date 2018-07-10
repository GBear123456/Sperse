import {Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CustomersServiceProxy, CustomerInfoDto, DocumentServiceProxy, UploadDocumentInput,
    DocumentInfo, WopiServiceProxy, WopiRequestOutcoming } from '@shared/service-proxies/service-proxies';
import { MatDialog } from '@angular/material';

import { UploadEvent, UploadFile } from 'ngx-file-drop';

import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import { StringHelper } from '@shared/helpers/StringHelper';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [ DocumentServiceProxy, WopiServiceProxy ]
})
export class DocumentsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

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
    public wopiResponseHtml: any;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _documentService: DocumentServiceProxy,
        private _customerService: CustomersServiceProxy,
        private _wopiService: WopiServiceProxy,
        private http: HttpClient,
        private domSanitizer: DomSanitizer
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
        this._wopiService.getViewRequestInfo(this.currentDocumentInfo.id).subscribe((response) => {
            this.submitWopiRequest(response);
        });
    }

    editDocument() {
        this._wopiService.getEditRequestInfo(this.currentDocumentInfo.id).subscribe((response) => {
            this.submitWopiRequest(response);
        });
    }

    submitWopiRequest(wopiRequestInfo: WopiRequestOutcoming) {
        let formData = new FormData();
        formData.append('access_token', wopiRequestInfo.accessToken);
        formData.append('access_token_ttl', wopiRequestInfo.accessTokenTtl.toString());
        this.http.post(wopiRequestInfo.wopiUrlsrc, formData, { responseType: 'text' }).subscribe((response) => {
            this.wopiResponseHtml = this.domSanitizer.bypassSecurityTrustHtml(response.toString());
            this.openDocumentMode = true;
        });
    }

    closeDocument() {
        this.openDocumentMode = false;
    }

    onDocumentIframeLoad(event) {
        event.target.width = screen.width - 350;
        event.target.height = screen.height - 390;
    }
}
