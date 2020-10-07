/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Observable, of } from 'rxjs';
import { finalize, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactInfoDto,
    ContactServiceProxy,
    NoteInfoDto,
    NotesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less']
})
export class NotesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;

    private formatting = AppConsts.formatting;
    private readonly ident = 'Notes';

    public data: {
        contactInfo: ContactInfoDto
    };

    public userTimezone = DateHelper.getUserTimezone();
    public actionMenuItems: ActionMenuItem[];
    public userId = abp.session.userId;
    public actionRecordData: any;
    public showGridView = false;

    constructor(injector: Injector,
        private clientService: ContactsService,
        private notesService: NotesServiceProxy,
        private contactService: ContactServiceProxy,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {
        super(injector);
        clientService.invalidateSubscribe((area: string) => {
            if (area === 'notes')
                this.invalidate();
        }, this.ident);
        clientService.leadInfoSubscribe(() => {
            this.data = this.contactService['data'];
            this.loadData().subscribe(
                (notes: NoteInfoDto[]) => this.dataSource = notes
            );
            this.updateToolbar();
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
                    setTimeout(() => this.clientService.showNoteAddDialog());
            }
        });
        this.initActionMenuItems();
    }

    private updateToolbar() {
        this.clientService.toolbarUpdate({
            optionButton: {
                name: 'dataGrid',
                options: { checkPressed: () => this.showGridView },
                action: () => { this.showGridView = !this.showGridView; }
            }
        });
    }

    private initActionMenuItems() {
        this.actionMenuItems = [
            {
                text: this.l('Edit'),
                class: 'edit',
                action: this.editNote.bind(this)
            },
            {
                text: this.l('Delete'),
                class: 'delete',
                action: this.deleteNote.bind(this),
                visible: this.permission.isGranted(AppPermissions.CRMDeleteNote)
            }
        ];
    }

    invalidate() {
        this.data = this.contactService['data'];
        this.loadData().subscribe(
            (notes: NoteInfoDto[]) => this.dataSource = notes
        );
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionRecordData = null;
        this.actionMenu.hide();
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenu.toggle(target);
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

    onCellClick(event) {
        if (event.rowType === 'data') {
            let target = event.event.target;
            if (target.closest('.dx-link.dx-link-edit'))
                this.toggleActionsMenu(event.data, target);
            else
                this.editNote(event.data);
        }
    }

    editNote(data?) {
        this.clientService.showNoteAddDialog(data || this.actionRecordData);
    }

    deleteNote() {
        this.startLoading();
        this.notesService.deleteNote(this.actionRecordData.contactId, this.actionRecordData.id).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();
            this.notify.success(this.l('SuccessfullyDeleted'));
        });
    }

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}