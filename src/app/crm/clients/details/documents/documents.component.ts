import {Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import {DomSanitizer} from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { FileSystemFileEntry } from 'ngx-file-drop';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CustomersServiceProxy, CustomerInfoDto, DocumentsServiceProxy, UploadDocumentInput,
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
    providers: [ DocumentsServiceProxy, WopiServiceProxy ]
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
        private _documentsService: DocumentsServiceProxy,
        private _customerService: CustomersServiceProxy,
        private _wopiService: WopiServiceProxy,
        private http: Http,
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
        this._documentsService.getDocuments(this.data.customerInfo.id).subscribe((result) => {
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
        if ($event.target.files.length)
            this.uploadFiles($event.target.files);
    }

    fileDropped($event) {
        if ($event.files.length)
            this.uploadFiles($event.files);
    }

    uploadFiles(list) {
        for (const droppedFile of list) {
            if (droppedFile.fileEntry.isFile)
                this.uploadFile(droppedFile);
        }
    }

    uploadFile(droppedFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
        let myReader: FileReader = new FileReader();
        myReader.onloadend = (loadEvent: any) => {
            this._documentsService.uploadDocument(UploadDocumentInput.fromJS({
                customerId: this.data.customerInfo.id,
                fileName: file.name,
                size: file.size,
                fileBase64: StringHelper.getBase64(loadEvent.target.result)
            })).subscribe(() => {
                this.loadDocuments();
            });
        };
        myReader.readAsDataURL(file);
        });
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
        formData.append('accessToken', wopiRequestInfo.accessToken);
        formData.append('accessTokenTtl', wopiRequestInfo.accessTokenTtl.toString());
        this.http.post(wopiRequestInfo.wopiUrlsrc, formData).subscribe((response) => {
            this.wopiResponseHtml = this.domSanitizer.bypassSecurityTrustHtml(response.text());
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
