/** Core imports */
import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ActionsSubject, Store, select } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { finalize, first } from 'rxjs/operators';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { AppStore, TagsStoreActions, TagsStoreSelectors } from '@app/store';
import { DeleteAndReassignDialogComponent } from '..//delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { FiltersService } from '@shared/filters/filters.service';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactTagsServiceProxy, ContactTagInfoDto, ContactTagInput, UntagContactsInput } from '@shared/service-proxies/service-proxies';
import { MessageService, NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
  selector: 'tags-list',
  templateUrl: './tags-list.component.html',
  styleUrls: ['../styles/lists.less'],
  providers: [ ContactTagsServiceProxy ]
})
export class TagsListComponent implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: number[] = [];
    @Input() targetSelector = '[aria-label="' + this.ls.l('Toolbar_Tags') + '"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() managePermission = AppPermissions.CRMCustomersManage;
    @Input() showSelection = false;
    @Input() set selectedItems(value) {
        this.selectedTags = value && value.slice();
    }
    get selectedItems() {
        return this.selectedTags.map(item => {
            return ContactTagInput.fromJS(_.findWhere(this.list, {id: item}));
        }).filter(Boolean);
    }
    @Output() onSelectedChanged: EventEmitter<any> = new EventEmitter();
    @Output() onUpdated: EventEmitter<any> = new EventEmitter();

    private _prevClickDate = new Date();
    selectedTags = [];

    list: any = [];

    lastNewAdded: any;
    addNewTimeout: any;
    listComponent: any;
    tooltipVisible = false;

    isUpdateDeleteAllowed = this.permissionChecker.isGranted(AppPermissions.CRMManageListsAndTags);

    constructor(
        private filterService: FiltersService,
        private tagsService: ContactTagsServiceProxy,
        private store$: Store<AppStore.State>,
        private actions$: ActionsSubject,
        private messageService: MessageService,
        private notifyService: NotifyService,
        private permissionChecker: AppPermissionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService
    ) {}

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible) {
            if (this.listComponent)
                setTimeout(() => this.listComponent.repaint());
            this.highlightSelectedFilters();
        }
    }

    apply(isRemove: boolean = false, selectedKeys?) {
        if (this.listComponent) {
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.messageService.confirm(
                        this.ls.l(isRemove ? 'UntagBulkUpdateConfirmation' : 'TagBulkUpdateConfirmation',
                            this.selectedKeys.length), '',
                        isConfirmed => {
                            if (isConfirmed)
                                this.process(isRemove);
                            else
                                this.listComponent.deselectAll();
                        }
                    );
                else
                    this.process(isRemove);
            }
            this.listComponent.clearFilter();
        }
        this.tooltipVisible = false;
    }

    process(isRemove: boolean) {
        let contactIds = this.selectedKeys;
        let tags = this.selectedItems;
        if (contactIds.length > 1) {
            if (isRemove)
                return this.tagsService.untagContacts(UntagContactsInput.fromJS({
                    contactIds: contactIds,
                    tagIds: this.selectedTags
                })).pipe(finalize(() => {
                    this.listComponent.deselectAll();
                })).subscribe(() => {
                    this.onUpdated.emit();
                    this.notifyService.success(this.ls.l('TagsUnassigned'));
                });
            else {
                this.store$.dispatch(new TagsStoreActions.AddTag({
                    contactIds: contactIds,
                    tags: tags,
                    successMessage: this.ls.l('TagsAssigned'),
                    serviceMethodName: 'tagContacts'
                }));
            }
        } else
            this.store$.dispatch(new TagsStoreActions.AddTag({
                contactIds: [contactIds[0]],
                tags: tags,
                successMessage: this.ls.l('CustomerTagsUpdated'),
                serviceMethodName: 'updateContactTags'
            }));

        this.actions$.pipe(
            ofType(TagsStoreActions.ActionTypes.ADD_TAG_SUCCESS), first(),
            finalize(() => this.listComponent && this.listComponent.deselectAll())
        ).subscribe(() => {
            this.onUpdated.emit();
        });
    }

    clear() {
        this.listComponent.deselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.store$.pipe(select(TagsStoreSelectors.getTags)).subscribe((tags: ContactTagInfoDto[]) => {
            if (this.list && this.list.length)
                this.selectedTags = this.selectedItems.map((item) => {
                    let selected = _.findWhere(tags, {name: item.name});
                    return selected && selected.id;
                }).filter(Boolean);
            this.list = tags;
        });
    }

    reset() {
        this.selectedItems = [];
    }

    addActionButton(name, container: HTMLElement, callback) {
        let buttonElement = document.createElement('a');
        buttonElement.innerText = this.ls.l(capitalize(name));
        buttonElement.className = 'dx-link dx-link-' + name;
        buttonElement.addEventListener('click', callback);
        container.appendChild(buttonElement);
    }

    clearFiltersHighlight() {
        if (this.listComponent) {
            let elements = this.listComponent.element()
                .getElementsByClassName('filtered');
            while (elements.length)
                elements[0].classList.remove('filtered');
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            if (!this.isUpdateDeleteAllowed)
                $event.cellElement.classList.add('no-manage');
            if (this.isUpdateDeleteAllowed)
                this.addActionButton('delete', $event.cellElement, () => {
                    if ($event.data.hasOwnProperty('id'))
                        this.onRowRemoving($event);
                    else
                        $event.component.cancelEditData();
                });
            if (this.filterModel && Number.isInteger($event.data.id))
                this.addActionButton('filter', $event.cellElement, () => {
                    this.clearFiltersHighlight();

                    let modelItems = this.filterModel.items.element.value;
                    if (modelItems.length == 1 && modelItems[0] == $event.data.id)
                        this.filterModel.items.element.value = [];
                    else {
                        this.filterModel.items.element.value = [$event.data.id];
                        $event.cellElement.parentElement.classList.add('filtered');
                    }

                    this.filterService.change(this.filterModel);
                });
        }
    }

    clearFilterIfSelected(selectedId?) {
        let modelItems = this.filterModel && this.filterModel.items.element.value;
        if (modelItems && modelItems.length == 1 && (!selectedId || modelItems[0] == selectedId))  {
            this.clearFiltersHighlight();
            this.filterModel.items.element.value = [];
        }
        this.filterService.change(this.filterModel);
    }

    onRowRemoving($event) {
        let itemId = $event.key;

        if (!Number.isInteger(itemId))
            return;

        $event.cancel = true;
        let dialogData = {
            deleteAllReferences: false,
            items: _.filter(this.list, (obj) => {
                return (obj.id != itemId);
            }),
            entityPrefix: 'Tag',
            reassignToItemId: undefined
        };
        this.tooltipVisible = false;
        this.dialog.open(DeleteAndReassignDialogComponent, {
            data: dialogData
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.store$.dispatch({
                    type: TagsStoreActions.ActionTypes.REMOVE_TAG,
                    payload: {
                        id: itemId,
                        moveToTagId: dialogData.reassignToItemId,
                        deleteAllReferences: dialogData.deleteAllReferences
                    }
                });

                this.actions$.pipe(
                    ofType(TagsStoreActions.ActionTypes.REMOVE_TAG_SUCCESS),
                    first()
                ).subscribe(() => {
                    this.clearFilterIfSelected(itemId);
                    this.notifyService.success(this.ls.l('SuccessfullyDeleted'));
                });
            } else {
                this.tooltipVisible = true;
            }
        });
    }

    onRowUpdating($event) {
        let tagName = $event.newData.name.trim();

        if (!tagName || this.IsDuplicate(tagName)) {
            $event.cancel = true;
            return;
        }

        let id = $event.oldData.id;

        if (!Number.isInteger(id))
            return;

        this.store$.dispatch(
            new TagsStoreActions.RenameTag({
                id: id,
                name: tagName
            })
        );

        this.actions$.pipe(
            ofType(TagsStoreActions.ActionTypes.RENAME_TAG_SUCCESS),
            first()
        ).subscribe(() => {
            $event.cancel = true;
        });
    }

    onRowInserting($event) {
        let tagName = $event.data.name.trim();
        if (!tagName || this.IsDuplicate(tagName))
            $event.cancel = true;
    }

    IsDuplicate(name) {
        let nameNormalized = name.toLowerCase();
        let duplicates = _.filter(this.list, (obj) => {
            return (obj.name.toLowerCase() == nameNormalized);
        });
        return duplicates.length > 0;
    }

    onSelectionChanged($event) {
        this.selectedTags = $event.selectedRowKeys;
        this.onSelectedChanged.emit($event);
    }

    editorPrepared($event) {
        if (!$event.value && $event.editorName == 'dxTextBox') {
            if ($event.editorElement.closest('tr')) {
                if (this.addNewTimeout)
                    this.addNewTimeout = null;
                else {
                    $event.component.cancelEditData();
                    $event.component.getScrollable().scrollTo(0);
                    this.addNewTimeout = setTimeout(() => {
                        $event.component.addRow();
                    });
                }
            }
        }
    }

    onInitNewRow($event) {
        $event.data.name = $event.component.option('searchPanel.text');
    }

    onRowInserted($event) {
        this.lastNewAdded = $event.data;
        setTimeout(() => {
            this.selectedTags = this.listComponent.option('selectedRowKeys');
            this.selectedTags.push($event.key);
        });
    }

    onRowClick($event) {
        if (!this.isUpdateDeleteAllowed)
            return;

        let nowDate = new Date();
        if (nowDate.getTime() - this._prevClickDate.getTime() < 500) {
            $event.event.originalEvent.preventDefault();
            $event.event.originalEvent.stopPropagation();
            $event.component.editRow($event.rowIndex);
        }
        this._prevClickDate = nowDate;
    }

    onKeyDown($event) {
        if ($event.event.keyCode == 13) {
            $event.event.preventDefault();
            $event.event.stopPropagation();
            $event.component.focus($event.component.getCellElement(0, 0));
            $event.component.saveEditData();
        }
    }

    onContentReady($event) {
        this.highlightSelectedFilters();
    }

    highlightSelectedFilters() {
        let filterIds = this.filterModel && this.filterModel.items.element.value;
        this.clearFiltersHighlight();
        if (this.listComponent && filterIds && filterIds.length) {
            filterIds.forEach((id) => {
                let row = this.listComponent.getRowElement(
                    this.listComponent.getRowIndexByKey(id));
                if (row && row[0]) row[0].classList.add('filtered');
            });
        }
    }

    customSortingMethod = (item1, item2) => {
        if (this.lastNewAdded) {
            if (this.lastNewAdded.name == item1)
                return -1;
            else if (this.lastNewAdded.name == item2)
                return 1;
        }
        return 0;
    }

    isManageAllowed() {
        let selected = this.selectedKeys.length;
        return (selected || this.showSelection) && this.permissionChecker.isGranted(this.managePermission) &&
            (selected == 1 || this.showSelection || (this.bulkUpdateMode && this.permissionChecker.isGranted(AppPermissions.CRMBulkUpdates)));
    }
}
