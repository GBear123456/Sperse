import {Component, Injector, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppConsts } from '@shared/AppConsts';

import { CustomerTagsServiceProxy, AssignToCustomerInput, CustomerTagInput, UpdateCustomerTagInput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'crm-tags-list',
  templateUrl: './tags-list.component.html',
  styleUrls: ['./tags-list.component.less'],
  providers: [CustomerTagsServiceProxy]
})
export class TagsListComponent extends AppComponentBase {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Tags']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItems(value) {
        this.selectedTags = value;
    }
    get selectedItems() {
        return this.selectedTags.map(item => {
            return CustomerTagInput.fromJS(_.findWhere(this.list, {id: item}));
        });
    }

    private _prevClickDate = new Date();
    private selectedTags = [];
    list: any = [];

    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filterService: FiltersService,
        private _tagsService: CustomerTagsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible) {
            this.refresh();

            if (this.bulkUpdateMode)
                this.selectedTags = [];
        }
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                        isConfirmed => {
                            isConfirmed && this.process();
                        }
                    );
                else
                    this.process();
            }
        }
        this.tooltipVisible = false;
    }

    process() {
        this.selectedKeys.forEach((key) => {
            this._tagsService.assignToCustomer(AssignToCustomerInput.fromJS({
                customerId: key,
                tags: this.selectedItems
            })).subscribe((result) => {});
        });

        if (this.bulkUpdateMode)
            setTimeout(() => { this.listComponent.deselectAll(); }, 500);
    }

    clear() {
        this.listComponent.deselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    refresh() {
        this._tagsService.getTags().subscribe((result) => {
            this.list = result.map((obj) => {
                obj['parent'] = 0;
                return obj;
            });
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
            while(elements.length)        
                elements[0].classList.remove('filtered');
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            this.addActionButton('delete', $event.cellElement, (event) => {
                this.listComponent.deleteRow(
                    this.listComponent.getRowIndexByKey($event.data.id));
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

    onRowRemoving($event) {
        //!!VP should be applied corresponding method
    }

    onRowUpdating($event) {
        let tagName = $event.newData.name.trim();
        if (tagName) {
            this._tagsService.rename(UpdateCustomerTagInput.fromJS({
                id: $event.oldData.id,
                name: tagName
            })).subscribe((res) => {
                if (res)
                    $event.cancel = true;
            });
        } else {
            $event.cancel = true;
        }
    }

    onRowInserting($event) {
        if (!$event.data.name.trim())
            $event.cancel = true;
    }

    onSelectionChanged($event) {
        this.selectedTags = $event.component.getSelectedRowKeys('all');
    }

    onInitNewRow($event) {        
        $event.data.name = $event.component.option('searchPanel.text');
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
}