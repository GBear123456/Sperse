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
    @Input()
    set selectedItems(value) {
        this.selectedLists = value;
        this.editClientMode = true;
    }
    list: any;
    selectedLists = [];

    listComponent: any;
    tooltipVisible = false;
    editClientMode = false;

    constructor(
        injector: Injector,
        private _tagsService: CustomerListsServiceProxy
    ) {
        super(injector);
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
        if (!this.editClientMode && this.listComponent)
            this.listComponent.unselectAll();
    }

    apply(selectedKeys = undefined) {
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.listComponent && this.selectedKeys && this.selectedKeys.length) {
            let lists = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index)
                    && CustomerListInput.fromJS({name: item});
            }).filter(Boolean);
            this.selectedKeys.forEach((key) => {
                this._tagsService.assignListsToCustomer(AssignListsToCustomerInput.fromJS({
                    customerId: key,
                    lists: lists
                })).subscribe((result) => {});
            });
            if (this.editClientMode) {
                this.selectedLists = lists.map((item) => {
                    return item.name;
                });
            }
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
}
