import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';

import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { CustomerStarsServiceProxy, MarkCustomerInput, MarkCustomersInput } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
  selector: 'crm-stars-list',
  templateUrl: './stars-list.component.html',
  styleUrls: ['./stars-list.component.less'],
  providers: [CustomerStarsServiceProxy]
})
export class StarsListComponent extends AppComponentBase implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() set selectedItemKey(value) {
        this.selectedItemKeys = [value];
    }
    get selectedItemKey() {
        return this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined;
    }
    private selectedItemKeys = [];

    @Input() targetSelector = "[aria-label='star-icon']";
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    list: any;

    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _starsService: CustomerStarsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.message.confirm(
                        this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                        isConfirmed => {
                            if (isConfirmed) 
                                this.process();
                            else
                                this.listComponent.unselectAll();
                        }
                    );
                else
                    this.process();
            }
        }
        this.tooltipVisible = false;
    }

    process() {
        if (this.bulkUpdateMode)
            this._starsService.markCustomers(MarkCustomersInput.fromJS({
                customerIds: this.selectedKeys,
                starId: this.selectedItemKey
            })).pipe(finalize(() => {
                this.listComponent.unselectAll();
            })).subscribe((result) => {
                this.notify.success(this.l('CustomersMarked'));
            });
        else
            this._starsService.markCustomer(MarkCustomerInput.fromJS({
                contactGroupId: this.selectedKeys[0],
                starId: this.selectedItemKey
            })).subscribe((result) => {
                this.notify.success(this.l('CustomersMarked'));
            });
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    highlightSelectedFilters() {
        let filterIds = this.filterModel &&
            this.filterModel.items.element.value;
        this.clearFiltersHighlight();
        if (this.listComponent && filterIds && filterIds.length) {
            let items = this.listComponent.element()
                .getElementsByClassName('item-row');
            _.each(items, (item) => {
                if (filterIds.indexOf(Number(item.getAttribute('id'))) >= 0)
                    item.parentNode.parentNode.classList.add('filtered');
            });
        }
    }

    clearFiltersHighlight() {
        if (this.listComponent) {
            let elements = this.listComponent.element()
                .getElementsByClassName('filtered');
            while(elements.length)
                elements[0].classList.remove('filtered');
        }
    }

    applyFilter(event, data) {
        event.stopPropagation();

        this.clearFiltersHighlight();

        let modelItems = this.filterModel.items.element.value;
        if (modelItems.length == 1 && modelItems[0] == data.id)
            this.filterModel.items.element.value = [];
        else {
            this.filterModel.items.element.value = [data.id];
            event.target.parentNode.parentNode.parentNode.classList.add('filtered');
        }

        this._filtersService.change(this.filterModel);
    }

    onContentReady($event) {
        this.highlightSelectedFilters();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this._starsService.getStars().subscribe((result) => {
            this.list = result;
        });
    }

    onSelectionChange(event) {
        this.selectedItemKey = event && event.addedItems.length ? event.addedItems[0].id : undefined;
        this.onSelectionChanged.emit(event);
    }

    checkPermissions() {
        return this.permission.isGranted('Pages.CRM.Customers.ManageRatingAndStars') && 
            (!this.bulkUpdateMode || this.permission.isGranted('Pages.CRM.BulkUpdates'));
    }
}
