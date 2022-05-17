/** Core imports */
import { Component, Injector, OnDestroy, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { BehaviorSubject, combineLatest, Observable, of, zip } from 'rxjs';
import { first, filter, finalize, map, switchMap, tap, publishReplay, refCount,

    distinctUntilChanged, takeUntil, debounceTime } from 'rxjs/operators';

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
export class NotesComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;

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

    leadInfo: any;
    contactInfo: any;
    manageAllowed: boolean;
    notes: NoteInfoDto[];
    contactIds$: Observable<number[]> = zip(
        this.clientService.contactInfo$.pipe(filter(Boolean)),
        this.clientService.leadInfo$.pipe(filter(Boolean))
    ).pipe(
        map(([contactInfo, leadInfo]: [ ContactInfoDto, LeadInfoDto]) => {
            this.leadInfo = leadInfo;
            this.contactInfo = contactInfo;
            this.manageAllowed = this.permission.checkCGPermission(contactInfo.groups);
            this.updateToolbar();
            return [
                contactInfo.id, contactInfo.primaryOrganizationContactId || 0, leadInfo.propertyId || 0
            ];
        }),
        distinctUntilChanged((prevIds: number[], nextIds: number[]) => !ArrayHelper.dataChanged(prevIds, nextIds)),
    );

    notes$: Observable<NoteInfoDto[]> = combineLatest(
        this.contactIds$,
        this.refresh$.asObservable()
    ).pipe(
        switchMap(([contactIds, refresh]: [number[], boolean]) => {
            if (!refresh && this.notesService['data'] && this.notesService['data'].contactIds && this.notesService['data'].contactIds == contactIds)
                return of(this.notesService['data'].source);
            else {
                this.startLoading(true);
                return this.notesService.getNotes(this.getFilteredContactIds(contactIds), this.ascendingSorting).pipe(
                        finalize(() => this.finishLoading(true)),
                        map(notes => notes.map(item => {
                            item['pinned'] = item.pinnedDateTime ? 1 : 0;
                            return item;
                        })),
                        tap((notes: NoteInfoDto[]) => {
                            this.notes = notes;
                            this.notesService['data'] = {
                                contactIds: contactIds,
                                source: notes
                            };
                        })
                    );
            }
        }), publishReplay(), refCount()
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

        this.notes$.pipe(first()).subscribe((notes: NoteInfoDto[]) => {
            if (this.componentIsActivated) {
                if (this.manageAllowed && (!notes || !notes.length || this.route.snapshot.queryParams.addNew))
                    setTimeout(() => this.clientService.showNoteAddDialog());
            }
        });
    }

    getFilteredContactIds(contactIds: number[]) {
        if (this.filterBy.length)
            return this.filterBy.map(key => {
                return contactIds[key];
            }).filter(Boolean);
        else
            return contactIds.filter(Boolean);
    }

    private updateToolbar() {
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
                            {
                                id: this.FilterPersonIndex,
                                text: this.l('Person'),
                                visible: this.contactInfo.primaryOrganizationContactId || this.leadInfo.propertyId
                            },
                            {
                                id: this.FilterCompanyIndex,
                                text: this.l('Company'),
                                visible: this.contactInfo.primaryOrganizationContactId
                            },
                            {
                                id: this.FilterPropertyIndex,
                                text: this.l('Property'),
                                visible: this.leadInfo.propertyId
                            }
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
                }]
            }, {
                location: 'after',
                items: [{
                    widget: 'dxTextBox',
                    visible: this.showGridView,
                    options: {
                        inputAttr: {view: 'headline'},
                        readOnly: true,
                        onInitialized: (event) => {
                            this.showGridView && this.notes$.pipe(
                                takeUntil(this.destroy$),
                                takeUntil(this.clientService.toolbarSubject$),
                                debounceTime(300)
                            ).subscribe(() => {
                                let dataGrid = this.dataGrid && this.dataGrid.instance,
                                    startItemIndex = dataGrid && this.showGridView ? (dataGrid.pageIndex() * dataGrid.pageSize() + 1) : 1,
                                    endItemIndex = dataGrid && this.showGridView ? startItemIndex + dataGrid.getVisibleRows().length - 1 : this.notes.length,
                                    totalCount = dataGrid && this.showGridView ? dataGrid.totalCount() : this.notes.length;
                                event.component.option('value', startItemIndex + ' - ' + endItemIndex + ' of ' + totalCount);
                                event.component.option('visible', !!totalCount);
                            });
                        }
                    }
                }]
            }, {
                location: 'after',
                items: [
                    {
                        name: 'sort',
                        options: {
                            onInitialized: (event) => {
                                setTimeout(() => {
                                    let item = event.element.getElementsByTagName('img')[0];
                                    item.classList[this.ascendingSorting ? 'add' : 'remove']('rotate');
                                });
                            }
                        },
                        action: (event) => {
                            let item = event.element.getElementsByTagName('img')[0];
                            this.ascendingSorting = !item.classList.contains('rotate');
                            if (this.ascendingSorting)
                                item.classList.add('rotate');
                            else
                                item.classList.remove('rotate');
                            this.invalidate();
                        }
                    }
                ]
            }, {
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
        this.clientService.toolbarUpdate();
        this.clientService.unsubscribe(this.ident);
    }
}