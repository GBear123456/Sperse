import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import { CustomerListsServiceProxy, AssignListsToCustomerInput, CustomerListInput, 
    UpdateCustomerListInput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'crm-lists-list',
  templateUrl: './lists-list.component.html',
  styleUrls: ['./lists-list.component.less'],
  providers: [CustomerListsServiceProxy]
})
export class ListsListComponent extends AppComponentBase implements OnInit {
    @Output() onFilterSelected: EventEmitter<any> = new EventEmitter();

    @Input() showFilter: boolean;
    @Input() filterData: any;
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Lists']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItems(value) {
        this.selectedLists = value;
    }
    get selectedItems() {
        return this.selectedLists.map(item => {
            return CustomerListInput.fromJS(_.findWhere(this.list, {id: item}));
        }).filter(Boolean);
    }

    private _prevClickDate = new Date();
    private selectedLists = [];
    list: any;

    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _listsService: CustomerListsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedLists = this.listComponent.option('selectedRowKeys');
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
            if (this.bulkUpdateMode)
                setTimeout(() => { this.listComponent.deselectAll(); }, 500);
        }
        this.tooltipVisible = false;
    }

    process() {
        this.selectedKeys.forEach((key) => {
            this._listsService.assignListsToCustomer(AssignListsToCustomerInput.fromJS({
                customerId: key,
                lists: this.selectedItems
            })).subscribe((result) => {});
        });
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this._listsService.getLists().subscribe((result) => {
            this.list = result.map((obj, index) => {
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

    clearSelection(clearFilter) {
        $('.filtered').removeClass('filtered');
        if (clearFilter)
            this.onFilterSelected.emit(null);
        return clearFilter;
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            this.addActionButton('delete', $event.cellElement, (event) => {
                this.listComponent.deleteRow(
                    this.listComponent.getRowIndexByKey($event.data.id));
            });
            if (this.showFilter)
                this.addActionButton('filter', $event.cellElement, (event) => {
                    let wrapper = $event.cellElement.parentElement;
                    if (!this.clearSelection(wrapper.classList.contains('filtered'))) {
                        wrapper.classList.add('filtered');
                        this.onFilterSelected.emit($event.data);
                        this.tooltipVisible = false;
                    }
                });
        }
    }

    onRowRemoving($event) {
        //!!VP should be applied corresponding method
    }

    onRowUpdating($event) {
        this._listsService.rename(UpdateCustomerListInput.fromJS({
            id: $event.oldData.id,
            name: $event.newData.name
        })).subscribe((res) => {
            if (res)
                $event.cancel = true;
        });
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
        if (this.filterData) {
            let row = $event.component.getRowElement(
                $event.component.getRowIndexByKey(this.filterData.id));
            if (row && row[0]) row[0].classList.add('filtered');
        }
    }
}
