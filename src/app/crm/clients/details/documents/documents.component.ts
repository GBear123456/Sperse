import {Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CustomersServiceProxy, CustomerInfoDto /*, DocumentsServiceProxy */} from '@shared/service-proxies/service-proxies';
import { MatDialog } from '@angular/material';

import { UploadEvent, UploadFile } from 'ngx-file-drop';

import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import * as _ from 'underscore';

@Component({
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.less'],
    providers: [/*DocumentsServiceProxy*/]
})
export class DocumentsComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    public data: {
        customerInfo: CustomerInfoDto
    };

    private masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    dataSource: any;

    constructor(injector: Injector,
        public dialog: MatDialog,
//        private _documentsService: DocumentsServiceProxy,
        private _customerService: CustomersServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        this.data = this._customerService['data'];
        this.dataSource = [];
/*
        this._documentsService.getDocuments(this.data.customerInfo.id).subscribe((result) => {
            this.dataSource = result;
        });
*/
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
    }

    onShowingPopup(e) {
        e.component.option('visible', false);
        e.component.hide();
    }
}