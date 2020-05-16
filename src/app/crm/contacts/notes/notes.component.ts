/** Core imports */
import { Component, OnInit, Injector, ViewChild, OnDestroy } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { forkJoin, Observable, of } from 'rxjs';
import { first, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactServiceProxy,
    ContactInfoDto,
    NotesServiceProxy,
    NoteInfoDto,
    PersonContactInfoDto,
    OrganizationContactInfoDto
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { NoteAddDialogComponent } from '@app/crm/contacts/notes/note-add-dialog/note-add-dialog.component';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less']
})
export class NotesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

    public data: {
        contactInfo: ContactInfoDto
    };
    private formatting = AppConsts.formatting;
    private readonly ident = 'Notes';

    constructor(injector: Injector,
        private clientService: ContactsService,
        private notesService: NotesServiceProxy,
        private contactService: ContactServiceProxy,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {
        super(injector);
        clientService.invalidateSubscribe((area: string) => {
            if (area === 'notes') {
                this.data = this.contactService['data'];
                this.loadData().subscribe(
                    (notes: NoteInfoDto[]) => this.dataSource = notes
                );
            }
        }, this.ident);
        clientService.leadInfoSubscribe(() => {
            this.data = this.contactService['data'];
            this.loadData().subscribe(
                (notes: NoteInfoDto[]) => this.dataSource = notes
            );
        }, this.ident);
    }

    ngOnInit() {
        let notesData = this.notesService['data'];
        this.data = this.contactService['data'];
        const dataSource$ = notesData && notesData.contactId == this.data.contactInfo.id
                            ? of(notesData.source)
                            : this.loadData();
        dataSource$.subscribe((notes: NoteInfoDto[]) => {
            if (this.componentIsActivated) {
                this.dataSource = notes;
                if (!notes || !notes.length || this.route.snapshot.queryParams.addNew)
                    setTimeout(() => this.openNoteAddDialog());
            }
        });
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    loadData(): Observable<NoteInfoDto[]> {
        let contactId = this.data.contactInfo.id;
        const notes$ = this.notesService.getNotes(contactId).pipe(publishReplay(), refCount());
        notes$.subscribe((result: NoteInfoDto[]) => {
            this.notesService['data'] = {
                contactId: contactId,
                source: result
            };
        });
        return notes$;
    }

    openNoteAddDialog() {
        /** When every piece of data is loaded - open note add dialog */
        forkJoin(
            this.clientService.contactInfo$.pipe(first()),
            this.clientService.personContactInfo$.pipe(first()),
            this.clientService.organizationContactInfo$.pipe(first())
        ).subscribe(([contactInfo, personContactInfo, organizationContactInfo]: [ContactInfoDto, PersonContactInfoDto, OrganizationContactInfoDto]) => {
            this.dialog.open(NoteAddDialogComponent, {
                panelClass: ['slider'],
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {
                    contactInfo: contactInfo
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

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}
