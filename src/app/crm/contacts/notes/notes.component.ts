/** Core imports */
import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular';
import { MatSidenav } from '@angular/material/sidenav';
import 'devextreme/data/odata/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactGroupServiceProxy, ContactGroupInfoDto, NotesServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less']
})
export class NotesComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild('drawer') drawer: MatSidenav;
    public data: {
        contactInfo: ContactGroupInfoDto
    };

    private formatting = AppConsts.formatting;

    constructor(injector: Injector,
        private _notesService: NotesServiceProxy,
        private _customerService: ContactGroupServiceProxy
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        let notesData = this._notesService['data'];
        this.data = this._customerService['data'];
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
        toolbarItems.push({
            location: 'after',
            widget: 'dxButton',
            options: {
                icon: ' icon-note',
                text: this.l('AddNote'),
                elementAttr: { 'class': 'btn-layout' },
                onClick: () => this.addNotesToggle()
            }
        });
    }

    addNotesToggle() {
        this.drawer.toggle();
        setTimeout(() => {
            this.dataGrid.instance.updateDimensions();
        }, 400);
    }

    calculateDateCellValue = (data) => {
        return formatDate(data.dateTime, this.formatting.dateTime, abp.localization.currentLanguage.name);
    }

    noteAdded() {
        this.notify.info(this.l('SavedSuccessfully'));
        this.loadData();
    }
}