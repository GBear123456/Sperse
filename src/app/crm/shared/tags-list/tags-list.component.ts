import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { CustomerTagsServiceProxy, AssignToCustomerInput, CustomerTagInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-tags-list',
  templateUrl: './tags-list.component.html',
  styleUrls: ['./tags-list.component.less'],
  providers: [CustomerTagsServiceProxy]
})
export class TagsListComponent extends AppComponentBase implements OnInit {
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Tags']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItems(value) {
        this.selectedTags = value;
    }
    get selectedItems() {
        return this.selectedTags.map(item => {
            return CustomerTagInput.fromJS({name: item});
        });
    }
    private selectedTags = [];
    list: any;

    listComponent: any;
    tooltipVisible = false;
    showAddButton = false;

    constructor(
        injector: Injector,
        private _tagsService: CustomerTagsServiceProxy
    ) {
        super(injector);
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedTags = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index) && item;
            }).filter(Boolean);
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                this.selectedKeys.forEach((key) => {
                    this._tagsService.assignToCustomer(AssignToCustomerInput.fromJS({
                        customerId: key,
                        tags: this.selectedItems
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
        this._tagsService.getTags().subscribe((result) => {
            this.list = result.map((obj) => obj.name);
        });
    }

    addNewTag() {
        this.list.push(this.searchValue);
        this.showAddButton = false;
    }

    onSearch = ($event) => {
        this.searchValue = $event.event.target.value;
        this.showAddButton = this.list.every((item) => !item.includes(this.searchValue));
        $event.component.option('showClearButton', !this.showAddButton);
    }

    reset() {
        this.selectedItems = [];
    }
}