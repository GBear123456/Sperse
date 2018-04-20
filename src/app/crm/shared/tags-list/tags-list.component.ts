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
    list: any;

    listComponent: any;
    tooltipVisible = false;

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
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.selectedKeys && this.selectedKeys.length) {
            let tags = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index) 
                    && CustomerTagInput.fromJS({name: item});
            }).filter(Boolean);

            this.selectedKeys.forEach((key) => {
                this._tagsService.assignToCustomer(AssignToCustomerInput.fromJS({
                    customerId: key,
                    tags: tags
                })).subscribe((result) => {});
            });
            this.listComponent.unselectAll();
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
}
