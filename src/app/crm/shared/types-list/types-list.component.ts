/** Core imports */
import {Component, Injector, Input, EventEmitter, Output, OnInit} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ActionsSubject, Store, select } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { first } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { DeleteAndReassignDialogComponent } from '@app/crm/shared/delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { AppStore, PartnerTypesStoreActions, PartnerTypesStoreSelectors } from '@app/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppPermissions } from '@shared/AppPermissions';
import {
    PartnerTypeServiceProxy,
    PartnerServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'crm-types-list',
    templateUrl: './types-list.component.html',
    styleUrls: ['./types-list.component.less'],
    providers: [ PartnerTypeServiceProxy, PartnerServiceProxy ]
})
export class TypesListComponent extends AppComponentBase implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector = '[aria-label="Type"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() set selectedItems(value) {
        this.selectedTypes = value;
    }
    get selectedItems() {
        return this.selectedTypes.map(item => {
            return _.findWhere(this.list, {id: item});
        }).filter(Boolean);
    }
    @Output() onSelectedChanged: EventEmitter<any> = new EventEmitter();

    private _prevClickDate = new Date();
    private selectedTypes = [];

    list: any = [];

    lastNewAdded: any;
    addNewTimeout: any;
    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _filterService: FiltersService,
        private _partnerService: PartnerServiceProxy,
        private _partnerTypeService: PartnerTypeServiceProxy,
        private store$: Store<AppStore.State>,
        private actions$: ActionsSubject
    ) {
        super(injector);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible) {
            if (this.listComponent)
                setTimeout(() => this.listComponent.repaint());
            this.highlightSelectedFilters();
        }
    }

    apply(isRemove: boolean = false, selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l(isRemove ? 'RemoveFromTypeBulkUpdateConfirmation' : 'AddToTypeUpdateConfirmation', this.selectedKeys.length, this.selectedItems[0].name),
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
        const partnerIds = this.selectedKeys;
        const selectedItem = this.selectedItems[0];
        const typeName = isRemove || !selectedItem ? null : selectedItem.name;
        const notifyMessageKey = isRemove ? 'PartnerTypesUpdated' : 'TypesAssigned';
        this.store$.dispatch(new PartnerTypesStoreActions.AddPartnerType({
            partnerIds: partnerIds,
            typeName: typeName,
            successMessage: this.l(notifyMessageKey)
        }));
    }

    clear() {
        this.listComponent.deselectAll();
        this.apply(true);
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.store$.pipe(select(PartnerTypesStoreSelectors.getPartnerTypes)).subscribe((types: any) => {
            if (this.list && this.list.length)
                this.selectedTypes = this.selectedItems.map((item) => {
                    let selected = _.findWhere(types, {name: item.name});
                    return selected && selected.id;
                }).filter(Boolean);

            this.list = types;
        });
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
            this.addActionButton('delete', $event.cellElement, (event) => {
                if ($event.data.hasOwnProperty('id'))
                    this.listComponent.deleteRow(
                        this.listComponent.getRowIndexByKey($event.data.id));
                else
                    $event.component.cancelEditData();
            });
            if (this.filterModel && Number.isInteger($event.data.id))
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
        const itemId = $event.key;

        if (!Number.isInteger(itemId))
            return;

        $event.cancel = true;
        let dialogData = {
            deleteAllReferences: false,
            items: _.filter(this.list, (obj) => {
                return (obj.id != itemId);
            }),
            entityPrefix: 'Type',
            reassignToItemId: undefined
        };
        this.tooltipVisible = false;
        this.dialog.open(DeleteAndReassignDialogComponent, {
            data: dialogData
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.store$.dispatch(new PartnerTypesStoreActions.RemovePartnerType({
                    id: itemId,
                    moveToPartnerTypeId: dialogData.reassignToItemId,
                    deleteAllReferences: dialogData.deleteAllReferences
                }));

                this.actions$.pipe(
                    ofType(PartnerTypesStoreActions.ActionTypes.REMOVE_PARTNER_TYPE_SUCCESS),
                    first()
                ).subscribe(() => {
                    this.clearFilterIfSelected(itemId);
                });
            } else {
                this.tooltipVisible = true;
            }
        });
    }

    onRowUpdating($event) {
        let typeName = $event.newData.name.trim();

        if (!typeName || this.IsDuplicate(typeName)) {
            $event.cancel = true;
            return;
        }

        let id = $event.oldData.id;

        if (!Number.isInteger(id))
            return;

        this.store$.dispatch(new PartnerTypesStoreActions.RenamePartnerType({
            id: id,
            name: typeName
        }));

        this.actions$.pipe(
            ofType(PartnerTypesStoreActions.ActionTypes.RENAME_PARTNER_TYPE_SUCCESS),
            first()
        ).subscribe(() => {
            $event.cancel = true;
        });
    }

    onRowInserting($event) {
        let typeName = $event.data.name ? $event.data.name.trim() : '';
        if (!typeName || this.IsDuplicate(typeName))
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
        this.selectedTypes = $event.selectedRowKeys;
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
            this.selectedTypes = $event.key;
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
        return 0;
    }

    checkPermissions() {
        return this.permission.isGranted(AppPermissions.CRMCustomersManageListsAndTags) &&
            (!this.bulkUpdateMode || this.permission.isGranted(AppPermissions.CRMBulkUpdates));
    }

    radioClick(event, cell) {
        event.stopPropagation();
        this.selectedTypes = [cell.data.id];
    }
}
