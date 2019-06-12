/** Core imports */
import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Observable, of } from 'rxjs';
import { first, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy,
    ContactInfoDto,
    NotesServiceProxy,
    NoteInfoDto
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { NoteAddDialogComponent } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog.component';

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
        private _contactService: ContactServiceProxy,
        private dialog: MatDialog
    ) {
        super(injector);

        _clientService.invalidateSubscribe((area) => {
            if (area == 'notes') {
                this.data = this._contactService['data'];
                this.loadData().subscribe(
                    (notes: NoteInfoDto[]) => this.dataSource = notes
                );
            }
        });
    }

    ngOnInit() {
        let notesData = this._notesService['data'];
        this.data = this._contactService['data'];
        const dataSource$ = notesData && notesData.contactId == this.data.contactInfo.id
                            ? of(notesData.source)
                            : this.loadData();
        dataSource$.subscribe((notes: NoteInfoDto[]) => {
            if (this.componentIsActivated) {
                this.dataSource = notes;
                if (!notes || !notes.length)
                    setTimeout(() => this.openNoteAddDialog());
            }
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    loadData(): Observable<NoteInfoDto[]> {
        let contactId = this.data.contactInfo.id;
        const notes$ = this._notesService.getNotes(contactId).pipe(publishReplay(), refCount());
        notes$.subscribe((result: NoteInfoDto[]) => {
            this._notesService['data'] = {
                contactId: contactId,
                source: result
            };
        });
        return notes$;
    }

    openNoteAddDialog() {
        if (this.data.contactInfo.personContactInfo)
            this._clientService.organizationContactInfo.pipe(first()).subscribe(() => {
                this.dialog.open(NoteAddDialogComponent, {
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {
                        contactInfo: this._contactService['data'].contactInfo
                    }
                });
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
