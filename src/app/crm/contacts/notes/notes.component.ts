/** Core imports */
import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular';
import 'devextreme/data/odata/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy, ContactInfoDto, NotesServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less']
})
export class NotesComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    public data: {
        contactInfo: ContactInfoDto
    };

    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
        private _clientService: ContactsService,
        private _notesService: NotesServiceProxy,
        private _contactService: ContactServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        _clientService.invalidateSubscribe((area) => {
            if (area == 'notes') 
                this.loadData(); 
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        let notesData = this._notesService['data'];
        this.data = this._contactService['data'];
        if (notesData && notesData.groupId == this.data.contactInfo.id)
            this.dataSource = notesData.source;
        else
            this.loadData();
    }

    loadData() {
        let groupId = this.data.contactInfo.id;
        this._notesService.getNotes(groupId).subscribe((result) => {
            this._notesService['data'] = {
                groupId: groupId,
                source: this.dataSource = result
            };            
        });
    }

    onToolbarPreparing($event) {
        let toolbarItems = $event.toolbarOptions.items;
        toolbarItems.push({
            location: 'before',
            template: 'title'
        });
    }

    calculateDateCellValue = (data) => {
        return formatDate(data.dateTime, this.formatting.dateTime, abp.localization.currentLanguage.name);
    }
}