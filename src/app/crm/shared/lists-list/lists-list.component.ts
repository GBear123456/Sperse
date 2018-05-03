import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { CustomerListsServiceProxy, AssignListsToCustomerInput, CustomerListInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-lists-list',
  templateUrl: './lists-list.component.html',
  styleUrls: ['./lists-list.component.less'],
  providers: [CustomerListsServiceProxy]
})
export class ListsListComponent extends AppComponentBase implements OnInit {
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Lists']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItems(value) {
        this.selectedLists = value;
    }
    get selectedItems() {
        return this.selectedLists.map(item => {
            return CustomerListInput.fromJS({name: item});
        });
    }
    private selectedLists = [];
    list: any;

    listComponent: any;
    tooltipVisible = false;
    showAddButton = false;

    constructor(
        injector: Injector,
        private _tagsService: CustomerListsServiceProxy
    ) {
        super(injector);
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedLists = this.listComponent.option('selectedItems');
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                this.selectedKeys.forEach((key) => {
                    this._tagsService.assignListsToCustomer(AssignListsToCustomerInput.fromJS({
                        customerId: key,
                        lists: this.selectedItems
                    })).subscribe((result) => {});
                });
            }
            if (this.bulkUpdateMode)
                setTimeout(() => { this.listComponent.unselectAll(); }, 500);
        }
        this.tooltipVisible = false;
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this._tagsService.getLists().subscribe((result) => {
            this.list = result.map((obj) => obj.name);
        });
    }

    addNewList() {
        this.list.push(this.searchValue);
        this.showAddButton = false;
    }

    onSearch = ($event) => {
        this.searchValue = $event.event.target.value;
        this.showAddButton = this.searchValue && this.list.every((item) => item != this.searchValue);
        $event.component.option('showClearButton', !this.showAddButton);
    }
}
