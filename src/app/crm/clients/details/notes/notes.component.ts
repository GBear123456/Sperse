import {Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewEncapsulation, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CustomersServiceProxy, CustomerInfoDto, NotesServiceProxy } from '@shared/service-proxies/service-proxies';

import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';
import * as _ from 'underscore';

@Component({    
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less'],
    providers: [NotesServiceProxy]
})
export class NotesComponent extends AppComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    public data: {
        customerInfo: CustomerInfoDto
    };

    private masks = AppConsts.masks;
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
        $event.toolbarOptions.items.unshift({
            location: 'before',
            template: 'title'
        });
    }

    ngAfterViewInit(): void {
    }

    onContentReady(event) {
    }

    ngOnDestroy() {        
    }
}
