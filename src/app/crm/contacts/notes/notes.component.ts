/** Core imports */
import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, Observable, of, zip } from 'rxjs';
import { first, filter, finalize, map, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ContactInfoDto,
    ContactServiceProxy,
    LeadInfoDto,
    NoteInfoDto,
    NotesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { AppPermissions } from '@shared/AppPermissions';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

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
    refresh$: BehaviorSubject<any> = new BehaviorSubject(false);

    public userTimezone = DateHelper.getUserTimezone();
    public actionMenuItems: ActionMenuItem[];
    public userId = abp.session.userId;
    public actionRecordData: any;
    public showGridView = false;
    notes: NoteInfoDto[];
    notes$: Observable<NoteInfoDto[]> = combineLatest(
        this.getContactIds(),
        this.refresh$.asObservable()
    ).pipe(
        switchMap(([contactIds, refresh]: [number[], boolean]) => {
            return !refresh && this.notesService['data'] && this.notesService['data'].contactIds && this.notesService['data'].contactIds == contactIds
                    ? of(this.notesService['data'].source)
                    : this.notesService.getNotes(contactIds).pipe(
                        tap((notes: NoteInfoDto[]) => {
                            this.notesService['data'] = {
                                contactIds: contactIds,
                                source: notes
                            };
                        })
                    )
        }),
        tap(() => {
            this.updateToolbar();
        })
    );

    constructor(injector: Injector,
        private clientService: ContactsService,
        private notesService: NotesServiceProxy,
        private contactService: ContactServiceProxy,
        private clipboardService: ClipboardService,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {
        super(injector);
        clientService.invalidateSubscribe((area: string) => {
            if (area === 'notes')
                this.invalidate();
        }, this.ident);
    }

    getContactIds(): Observable<number[]> {
        return zip(
            this.clientService.contactInfo$.pipe(filter(Boolean)),
            this.clientService.leadInfo$.pipe(filter(Boolean))
        ).pipe(
            map(([contactInfo, leadInfo]: [ ContactInfoDto, LeadInfoDto]) => {
                return [
                    contactInfo.id, contactInfo.primaryOrganizationContactId, leadInfo.propertyId
                ].filter(Boolean);
            }),
            distinctUntilChanged((prevIds: number[], nextIds: number[]) => !ArrayHelper.dataChanged(prevIds, nextIds)),
        );
    };

    ngOnInit() {
        this.notes$.pipe(first()).subscribe((notes: NoteInfoDto[]) => {
            if (this.componentIsActivated) {
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
                action: this.deleteNote.bind(this)
            }
        ];
    }

    invalidate() {
        this.data = this.contactService['data'];
        this.refresh$.next(true);
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

    copyToClipbord(event, note) {
        this.clipboardService.copyFromContent(note);
        this.notify.info(this.l('SavedToClipboard'));
        event.stopPropagation();
        event.preventDefault();
    }

    showActonMenu(note: NoteInfoDto) {
        return (note && note.addedByUserId === this.userId) || this.permission.isGranted(AppPermissions.CRMManageOtherUsersNote);
    }

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}