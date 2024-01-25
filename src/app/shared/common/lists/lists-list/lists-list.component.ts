/** Core imports */
import { Component, Injector, OnInit, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ActionsSubject, Store, select } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { finalize, first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppStore, ListsStoreActions, ListsStoreSelectors } from '@app/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { ContactListsServiceProxy, ContactListInput } from '@shared/service-proxies/service-proxies';
import { DeleteAndReassignDialogComponent } from '../delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
  selector: 'lists-list',
  templateUrl: './lists-list.component.html',
  styleUrls: ['../styles/lists.less'],
  providers: [ ContactListsServiceProxy ]
})
export class ListsListComponent extends AppComponentBase implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any = [];
    @Input() managePermission = AppPermissions.CRMCustomersManage;
    @Input() targetSelector = '[aria-label="' + this.l('Toolbar_Lists') + '"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() showSelection = false;
    @Input() set selectedItems(value: ContactListInput[]) {
        this.selectedLists = value && value.slice();
    }
    get selectedItems() {
        return this.selectedLists.map((item: ContactListInput) => {
            return ContactListInput.fromJS(_.findWhere(this.list, {id: item}));
        }).filter(Boolean);
    }
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onUpdated: EventEmitter<any> = new EventEmitter();

    private _prevClickDate = new Date();
    selectedLists = [];
    list: any = [];

    lastNewAdded: any;
    addNewTimeout: any;
    listComponent: any;

    tooltipVisible = false;

    isUpdateDeleteAllowed = this.permission.isGranted(AppPermissions.CRMManageListsAndTags);

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _filterService: FiltersService,
        private _listsService: ContactListsServiceProxy,
        private store$: Store<AppStore.State>,
        private actions$: ActionsSubject
    ) {
        super(injector);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible) {
            if (this.listComponent)
                setTimeout(() => {
                    this.listComponent.getScrollable().scrollTo(0);
                    this.listComponent.refresh();
                });
            this.highlightSelectedFilters();
        }
    }

    apply(isRemove: boolean = false, selectedKeys?: number[]) {
        if (this.listComponent) {
            this.selectedLists = this.listComponent.option('selectedRowKeys');
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l(isRemove ? 'RemoveFromBulkUpdateConfirmation' : 'AddToListsBulkUpdateConfirmation',
                            this.selectedKeys.length, this.selectedLists.length || this.l('all')), '',
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
        let lists = this.selectedItems;
        if (contactIds.length > 1 || this.bulkUpdateMode) {
            if (isRemove)
                return this._listsService.removeContactsFromLists(
                    contactIds, this.selectedLists
                ).pipe(finalize(() => {
                    this.listComponent.deselectAll();
                })).subscribe(() => {
                    this.onUpdated.emit();
                    this.notify.success(this.l('ListsUnassigned'));
                });
            else {
                this.store$.dispatch(new ListsStoreActions.AddList({
                    contactIds: contactIds,
                    lists: lists,
                    successMessage: this.l('ListsAssigned'),
                    serviceMethodName: 'addContactsToLists'
                }));
            }
        } else
            this.store$.dispatch(new ListsStoreActions.AddList({
                contactIds: [contactIds[0]],
                lists: lists,
                successMessage: this.l('CustomerListsUpdated'),
                serviceMethodName: 'updateContactLists'
            }));

        this.actions$.pipe(
            ofType(ListsStoreActions.ActionTypes.ADD_LIST_SUCCESS), first(),
            finalize(() => this.listComponent && this.listComponent.deselectAll())
        ).subscribe(() => this.onUpdated.emit());
    }

    refresh() {
        this.store$.pipe(select(ListsStoreSelectors.getLists)).subscribe((lists: ContactListInput[]) => {
            if (this.list && this.list.length)
                this.selectedLists = this.selectedItems.map((item: ContactListInput) => {
                    let selected = _.findWhere(lists, {name: item.name});
                    return selected && selected.id;
                }).filter(Boolean);

            this.list = lists;
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

    reset() {
        this.selectedItems = [];
    }

    addActionButton(name, container: HTMLElement, callback) {
        let buttonElement = document.createElement('a');
        buttonElement.innerText = this.l(this.capitalize(name));
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
                    this._filterService.change(this.filterModel);
                });
        }
    }

    clearFilterIfSelected(selectedId?) {
        let modelItems = this.filterModel && this.filterModel.items.element.value;
        if (modelItems && modelItems.length == 1 && (!selectedId || modelItems[0] == selectedId))  {
            this.clearFiltersHighlight();
            this.filterModel.items.element.value = [];
        }
        this._filterService.change(this.filterModel);
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
            entityPrefix: 'List',
            reassignToItemId: undefined
        };
        this.tooltipVisible = false;
        this.dialog.open(DeleteAndReassignDialogComponent, {
            data: dialogData
        }).afterClosed().subscribe((result) => {
            if (result) {
                /** Dispatch list remove event */
                this.store$.dispatch(new ListsStoreActions.RemoveList({
                    id: itemId,
                    moveToListId: dialogData.reassignToItemId,
                    deleteAllReferences: dialogData.deleteAllReferences
                }));

                /** Listen succes remove and clear filters if so */
                this.actions$.pipe(
                    ofType(ListsStoreActions.ActionTypes.REMOVE_LIST_SUCCESS),
                    first()
                ).subscribe(() => {
                    this.clearFilterIfSelected(itemId);
                    this.notify.success(this.l('SuccessfullyDeleted'));
                });
            } else {
                this.tooltipVisible = true;
            }
        });
    }

    onRowUpdating($event) {
        let listName = $event.newData.name.trim();

        if (!listName || this.IsDuplicate(listName)) {
            $event.cancel = true;
            return;
        }

        let id = $event.oldData.id;

        if (!Number.isInteger(id))
            return;

        this.store$.dispatch(
            new ListsStoreActions.RenameList({
                id: id,
                name: listName
            })
        );

        this.actions$.pipe(
            ofType(ListsStoreActions.ActionTypes.RENAME_LIST_SUCCESS),
            first()
        ).subscribe(() => {
            $event.cancel = true;
        });
    }

    onRowInserting($event) {
        let listName = $event.data.name.trim();
        if (!listName || this.IsDuplicate(listName))
            $event.cancel = true;
    }

    IsDuplicate(name) {
        let nameNormalized = name.toLowerCase();
        let duplicates = _.filter(this.list, (obj) => {
            return (obj.name.toLowerCase() == nameNormalized);
        });
        return duplicates.length > 0;
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
            this.selectedLists = this.listComponent.option('selectedRowKeys');
            this.selectedLists.push($event.key);
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
        let filterIds = this.filterModel &&
            this.filterModel.items.element.value;
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
            if (this.lastNewAdded.name == item2)
                return 1;
        }
        if (this.selectedItems.some(item => item.name == item1))
            return -1;
        if (this.selectedItems.some(item => item.name == item2))
            return 1;
        return 0;
    }

    onSelectionChange(event) {
        this.selectedItems = event.selectedRowKeys;
        this.onSelectionChanged.emit(event);
    }

    isManageAllowed() {
        let selected = this.selectedKeys.length;
        return (selected || this.showSelection) && this.permission.isGranted(this.managePermission) &&
            (selected == 1 || this.showSelection || (this.bulkUpdateMode && this.permission.isGranted(AppPermissions.CRMBulkUpdates)));
    }
}