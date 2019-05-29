import {Component, Injector, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppConsts } from '@shared/AppConsts';

import { ContactListsServiceProxy, AddContactsToListsInput, ContactListInput,
    UpdateContactListInput, UpdateContactListsInput} from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';
import { DeleteAndReassignDialogComponent } from '../delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-advanced-list',
    templateUrl: './advanced-list.component.html',
    styleUrls: ['./advanced-list.component.less'],
    providers: [ContactListsServiceProxy]
})
export class AdvancedListComponent extends AppComponentBase implements OnInit {
    @Input() name: string;
    @Input() permissionName = 'Pages.CRM.Customers.ManageListsAndTags';
    @Input() bulkUpdateConfirmationKey: string;
    @Input() bulkRemoveConfirmationKey: string;
    @Input() dataSource: any;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector = '[aria-label="Lists"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() set selectedItems(value) {
        this.selectedLists = value;
    }
    get selectedItems() {
        return this.selectedLists.map(item => {
            return ContactListInput.fromJS(_.findWhere(this.list, {id: item}));
        }).filter(Boolean);
    }
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();

    private _prevClickDate = new Date();
    selectedLists = [];
    list: any;

    lastNewAdded: any;
    addNewTimeout: any;
    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _filterService: FiltersService
    ) {
        super(injector);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(isRemove: boolean = false, selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedLists = this.listComponent.option('selectedRowKeys');
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l(isRemove ? this.bulkRemoveConfirmationKey : this.bulkUpdateConfirmationKey,
                            this.selectedKeys.length, this.selectedLists.length || this.l('all')),
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
            setTimeout(() => { this.listComponent.option('searchPanel.text', undefined); }, 500);
        }
        this.tooltipVisible = false;
    }

    process(isRemove: boolean) {
        let customerIds = this.selectedKeys;
        let lists = this.selectedItems;
        if (this.bulkUpdateMode) {
            // if (isRemove)
            //     this._listsService.removeCustomersFromLists(customerIds, this.selectedLists
            //     ).pipe(finalize(() => {
            //         this.listComponent.deselectAll();
            //     })).subscribe((result) => {
            //         this.notify.success(this.l('ListsUnassigned'));
            //     });
            // else
            //     this._listsService.addCustomersToLists(AddCustomersToListsInput.fromJS({
            //         customerIds: customerIds,
            //         lists: lists
            //     })).pipe(finalize(() => {
            //         this.listComponent.deselectAll();
            //     })).subscribe((result) => {
            //         this.notify.success(this.l('ListsAssigned'));
            //     });
        }
        // else
        //     this._listsService.updateCustomerLists(UpdateCustomerListsInput.fromJS({
        //         customerId: customerIds[0],
        //         lists: lists
        //     })).subscribe((result) => {
        //         this.notify.success(this.l('CustomerListsUpdated'));
        //     });
    }

    refresh() {
        /** Emit to parent refresh event */
    }

    clear() {
        this.listComponent.deselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {}

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
            this.addActionButton('delete', $event.cellElement, (event) => {
                if ($event.data.hasOwnProperty('id'))
                    this.listComponent.deleteRow(
                        this.listComponent.getRowIndexByKey($event.data.id));
                else
                    $event.component.cancelEditData();
            });
            if (this.filterModel)
                this.addActionButton('filter', $event.cellElement, (event) => {
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

    clearFilterIfSelected(selectedId) {
        let modelItems = this.filterModel.items.element.value;
        if (modelItems.length == 1 && modelItems[0] == selectedId)  {
            this.clearFiltersHighlight();
            this.filterModel.items.element.value = [];
        }
        this._filterService.change(this.filterModel);
    }

    onRowRemoving($event) {
        $event.cancel = true;
        let itemId = $event.key,
            dialogData = {
                deleteAllReferences: false,
                items: _.filter(this.list, (obj) => {
                    return (obj.id != itemId);
                }),
                entityPrefix: this.capitalize(this.name),
                reassignToItemId: undefined
            };
        this.tooltipVisible = false;
        this.dialog.open(DeleteAndReassignDialogComponent, {
            data: dialogData
        }).afterClosed().subscribe((result) => {
            // if (result)
            //     this._listsService
            //         .delete(itemId, dialogData.reassignToItemId, dialogData.deleteAllReferences)
            //         .subscribe(() => {
            //             this.refresh();
            //             this.clearFilterIfSelected(itemId);
            //         });
            // else
            //     this.tooltipVisible = true;
        });
    }

    onRowUpdating($event) {
        let listName = $event.newData.name.trim();

        if (!listName || this.IsDuplicate(listName)) {
            $event.cancel = true;
            return;
        }

        let id = $event.oldData.id;
        if (Number.isInteger(id)) {
            // this._listsService.rename(UpdateCustomerListInput.fromJS({
            //     id: id,
            //     name: listName
            // })).subscribe((res) => {
            //     if (res)
            //         $event.cancel = true;
            // });
        }
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
            else if (this.lastNewAdded.name == item2)
                return 1;
        }
    }

    onSelectionChange(event) {
        this.selectedItems = event.selectedRowKeys;
        this.onSelectionChanged.emit(event);
    }

    checkPermissions() {
        return this.permission.isGranted(this.permissionName) &&
            (!this.bulkUpdateMode || this.permission.isGranted('Pages.CRM.BulkUpdates'));
    }
}
