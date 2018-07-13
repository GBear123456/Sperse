/** Core imports */
import {Component, OnInit, Injector, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CustomersServiceProxy, CustomerInfoDto, NotesServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less'],
    providers: [ NotesServiceProxy ]
})
export class NotesComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    public data: {
        customerInfo: CustomerInfoDto
    };

    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
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

    calculateDateCellValue = (data) => {
        return formatDate(data.dateTime, this.formatting.dateTime, abp.localization.currentLanguage.name);
    }

    noteAdded() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.ngOnInit();
    }

}
