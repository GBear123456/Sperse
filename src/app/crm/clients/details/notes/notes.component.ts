import {Component, OnInit, Injector, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, NotesServiceProxy } from '@shared/service-proxies/service-proxies';
//import { MatDialog } from '@angular/material';

import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less'],
    providers: [NotesServiceProxy]
})
export class NotesComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    public data: {
        customerInfo: CustomerInfoDto
    };

    private masks = AppConsts.masks;
    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
        //public dialog: MatDialog,
        private _notesService: NotesServiceProxy,
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
        this._notesService.getNotes(this.data.customerInfo.id).subscribe((result) => {
            this.dataSource = result;
        });
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            template: 'title'
        });
    }

    // showAddNoteDialog($event) {
    //     this.dialog.closeAll();
    //     this.dialog.open(NoteAddDialogComponent, {
    //         id: 'permanent',
    //         panelClass: 'note-add-dialog',
    //         disableClose: true,
    //         closeOnNavigation: false,
    //         hasBackdrop: false,
    //         data: {
    //             refreshParent: this.ngOnInit.bind(this),
    //             customerInfo: this.data.customerInfo
    //         }
    //     }).afterClosed().subscribe(() => {});
    // }

    calculateDateCellValue = (data) => {
        return formatDate(data.dateTime, this.formatting.dateTime, abp.localization.currentLanguage.name);
    }

    noteAdded() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.ngOnInit();
    }

}
