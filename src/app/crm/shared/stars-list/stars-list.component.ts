import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { CustomerStarsServiceProxy, MarkCustomerInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

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
    @Input() set selectedItemKey(value) {
        this.selectedItemKeys = [value];
    }
    get selectedItemKey() {
        return this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined;
    }
    private selectedItemKeys = [];

    @Input() targetSelector = "[aria-label='star-icon']";
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
            this.selectedItemKeys = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(index) && item.id;
            }).filter(Boolean);
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
                setTimeout(() => { this.listComponent.unselectAll(); }, 500);
        }
        this.tooltipVisible = false;
    }

    process() {
        this.selectedKeys.forEach((key) => {
            this._starsService.markCustomer(MarkCustomerInput.fromJS({
                customerId: key,
                starId: this.selectedItemKey
            })).subscribe((result) => {});
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
}
