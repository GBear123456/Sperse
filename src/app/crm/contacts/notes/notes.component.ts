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
    PinNoteInput,
    UnpinNoteInput,
    ContactInfoDto,
    ContactServiceProxy,
    LeadInfoDto,
    NoteInfoDto,
    NotesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppPermissions } from '@shared/AppPermissions';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

@Component({
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.less']
})
export class NotesComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    @ViewChild(ActionMenuComponent, { static: false }) actionMenu: ActionMenuComponent;

    public formatting = AppConsts.formatting;
    private readonly ident = 'Notes';

    private readonly FilterPersonIndex   = 0;
    private readonly FilterCompanyIndex  = 1;
    private readonly FilterPropertyIndex = 2;

    public data: {
        contactInfo: ContactInfoDto
    };
    refresh$: BehaviorSubject<any> = new BehaviorSubject(false);

    public userTimezone = DateHelper.getUserTimezone();
    public actionMenuItems: ActionMenuItem[];
    public userId = abp.session.userId;
    public actionRecordData: any;
    public showGridView = false;
    public ascendingSorting = false;
    public filterBy = [
        this.FilterPersonIndex,
        this.FilterCompanyIndex,
        this.FilterPropertyIndex
    ];

    notes: NoteInfoDto[];
    notes$: Observable<NoteInfoDto[]> = combineLatest(
        this.getContactIds(),
        this.refresh$.asObservable()
    ).pipe(
        switchMap(([contactIds, refresh]: [number[], boolean]) => {
            if (!refresh && this.notesService['data'] && this.notesService['data'].contactIds && this.notesService['data'].contactIds == contactIds)
                return of(this.notesService['data'].source);
            else {
                this.startLoading();
                return this.notesService.getNotes(this.getFilteredContactIds(contactIds), this.ascendingSorting).pipe(
                        finalize(() => this.finishLoading()),
                        map(notes => notes.map(item => {
                            item['pinned'] = item.pinnedDateTime ? 1 : 0;
                            return item;
                        })),
                        tap((notes: NoteInfoDto[]) => {
                            this.notes = notes;
                            setTimeout(() => this.updateToolbar(), 500);
                            this.notesService['data'] = {
                                contactIds: contactIds,
                                source: notes
                            };
                        })
                    );
            }
        })
    );

    constructor(injector: Injector,
        private clientService: ContactsService,
        private notesService: NotesServiceProxy,
        private contactService: ContactServiceProxy,
        private clipboardService: ClipboardService,
        private sessionService: AppSessionService,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {
        super(injector);
        clientService.invalidateSubscribe((area: string) => {
            if (area === 'notes')
                this.invalidate();
        }, this.ident);
    }

    getFilteredContactIds(contactIds: number[]) {
        if (this.filterBy.length)
            return this.filterBy.map(key => {
                return contactIds[key];
            }).filter(Boolean);
        else
            return contactIds.filter(Boolean);
    }

    getContactIds(): Observable<number[]> {
        return zip(
            this.clientService.contactInfo$.pipe(filter(Boolean)),
            this.clientService.leadInfo$.pipe(filter(Boolean))
        ).pipe(
            map(([contactInfo, leadInfo]: [ ContactInfoDto, LeadInfoDto]) => {
                return [
                    contactInfo.id, contactInfo.primaryOrganizationContactId || 0, leadInfo.propertyId || 0
                ];
            }),
            distinctUntilChanged((prevIds: number[], nextIds: number[]) => !ArrayHelper.dataChanged(prevIds, nextIds)),
        );
    }

    ngOnInit() {
        this.notes$.pipe(first()).subscribe((notes: NoteInfoDto[]) => {
            if (this.componentIsActivated) {
                if (!notes || !notes.length || this.route.snapshot.queryParams.addNew)
                    setTimeout(() => this.clientService.showNoteAddDialog());
            }
        });
    }

    private updateToolbar() {
        let dataGrid = this.dataGrid && this.dataGrid.instance,
            startItemIndex = dataGrid && this.showGridView ? (dataGrid.pageIndex() * dataGrid.pageSize() + 1) : 1,
            endItemIndex = dataGrid && this.showGridView ? startItemIndex + dataGrid.getVisibleRows().length - 1 : this.notes.length,
            totalCount = dataGrid && this.showGridView ? dataGrid.totalCount() : this.notes.length;
        this.clientService.toolbarUpdate({
            customToolbar: [{
                location: 'before',
                items: [{
                    widget: 'dxButtonGroup',
                    options: {
                        keyExpr: 'id',
                        elementAttr: {
                            class: 'group-notes-filter'
                        },
                        items: [
                            {id: this.FilterPersonIndex, text: this.l('Person')},
                            {id: this.FilterCompanyIndex, text: this.l('Company')},
                            {id: this.FilterPropertyIndex, text: this.l('Property')}
                        ],
                        selectionMode: 'multiple',
                        stylingMode: 'text',
                        focusStateEnabled: false,
                        width: '340px',
                        selectedItemKeys: this.filterBy,
                        onSelectionChanged: event => {
                            this.filterBy = event.component.option('selectedItemKeys');
                            if (event.addedItems.length || event.removedItems.length)
                                this.invalidate();
                        }
                    }
                }, {
                    widget: 'dxSelectBox',
                    options: {
                        width: '230px',
                        valueExpr: 'id',
                        displayExpr: 'name',
                        value: this.ascendingSorting,
                        showClearButton: false,
                        placeholder: this.l('SortBy', ''),
                        dataSource: [
                            {id: false, name: this.l('SortBy', this.l('Newest'))},
                            {id: true, name: this.l('SortBy', this.l('Latest'))}
                        ],
                        onValueChanged: event => {
                            this.ascendingSorting = event.value;
                            this.invalidate();
                        },
                        inputAttr: {view: 'headline'}
                    }
                }]
            }, {
                location: 'after',
                items: [{
                    widget: 'dxTextBox',
                    options: {
                        value: startItemIndex + ' - ' + endItemIndex + ' of ' + totalCount,
                        inputAttr: {view: 'headline'},
                        visible: !!totalCount,
                        readOnly: true
                    }
                }]
            },
            {
                location: 'after',
                items: [
                    {
                        name: 'prev',
                        action: (e) => this.clientService.prev.next(e),
                        disabled: this.clientService.isPrevDisabled
                    },
                    {
                        name: 'next',
                        action: (e) => this.clientService.next.next(e),
                        disabled: this.clientService.isNextDisabled
                    }
                ]
            },
            {
                location: 'after',
                items: [{
                    name: 'dataGrid',
                    options: { checkPressed: () => this.showGridView },
                    action: () => {
                        this.showGridView = !this.showGridView;
                        if (!this.showGridView)
                            this.updateToolbar();
                    }
                }]
            }
        ]});
    }

    private togglePinNote(note) {
        this.startLoading();            
        let request = note.pinnedDateTime ?
            this.notesService.unpinNote(new UnpinNoteInput({
                contactId: note.contactId,
                noteId: note.id
            })) :
            this.notesService.pinNote(new PinNoteInput({
                contactId: note.contactId,
                noteId: note.id
            }));

        request.pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.invalidate();        
        });
    }

    private initActionMenuItems(note) {
        this.actionMenuItems = [
            {
                text: this.l((note.pinnedDateTime ? 'Unpin' : 'Pin')),
                class: 'dx-icon-' + (note.pinnedDateTime ? 'un' : '') + 'pin',
                action: this.togglePinNote.bind(this, note)
            },
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
        this.initActionMenuItems(data);
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
        return (note && note.addedByUserId === this.userId) ||
            this.permission.isGranted(AppPermissions.CRMManageOtherUsersNote);
    }

    onContentReady() {
        this.updateToolbar();
    }

    onRowPrepared(event) {
        if (event.data && event.data.pinnedDateTime)
            event.rowElement.classList.add('pinned');
    }

    onOptionChanged(event) {
        if (event.fullName.includes('sortOrder')) {
            setTimeout(() => {
                let sortList = event.component.getDataSource().sort();
                if (sortList && (!sortList.length || sortList[0].selector != 'pinned')) {
                    sortList.unshift({selector: 'pinned', desc: true});
                    event.component.getDataSource().sort(sortList);
                    event.component.getDataSource().reload();
                    event.component.refresh();
                }
            });
        }
    }

    ngOnDestroy() {
        this.clientService.unsubscribe(this.ident);
    }
}