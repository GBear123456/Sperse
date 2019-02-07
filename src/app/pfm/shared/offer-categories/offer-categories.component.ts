import { Component, Injector, Input, EventEmitter, Output, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';

import { AppConsts } from '@shared/AppConsts';

import * as _ from 'underscore';

@Component({
    selector: 'offer-categories',
    templateUrl: './offer-categories.component.html',
    styleUrls: ['./offer-categories.component.less']
})
export class OfferCategoriesComponent extends AppComponentBase {
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onListFiltered: EventEmitter<any> = new EventEmitter();
    @Input() width: string;
    @Input() height: number;
    @Input() title: string;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector: string;
    @Input() showConfirmation = false;
    @Input() updateConfirmationTitle: string;
    @Input() updateConfirmationMessage: string;
    @Input() searchEnabled = true;
    @Input() customSearchEnabled = false;
    @Input() searchExprType = 'name';

    @Input() list: any;
    @Input() showTitle = true;

    listComponent: any;
    listHeight: number;
    tooltipVisible: boolean;
    @Input() selectedItems: any = [];
    @HostBinding('class.highlightSelected') @Input() highlightSelected = false;
    @HostBinding('class.disableHindmost') @Input() disableHindmost = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply() {
        if (this.listComponent && this.selectedItems && this.selectedItems.length) {
            this.changeItems();
        }
        this.tooltipVisible = false;
    }

    changeItems(selectedData = this.selectedItems[0]) {
        if (this.selectedKeys && this.selectedKeys.length) {
            this.onItemSelected.emit(selectedData);
        }
    }

    onInitialized($event) {
        this.listComponent = $event.component;
        this.listHeight = this.height - 90;
    }

    highlightSelectedFilters() {
        let filterValue = this.filterModel &&
            this.filterModel.items.element.value;
        this.clearFiltersHighlight();
        if (this.listComponent && filterValue) {
            let items = this.listComponent.element()
                .getElementsByClassName('item-row');
            _.each(items, (item) => {
                let itemValue = item.id;
                if (filterValue.join && filterValue.indexOf(itemValue) >= 0 || filterValue == itemValue)
                    item.parentNode.parentNode.classList.add('filtered');
            });
        }
    }

    clearFiltersHighlight() {
        if (this.listComponent) {
            let elements = this.listComponent.element()
                .getElementsByClassName('filtered');
            while (elements.length)
                elements[0].classList.remove('filtered');
        }
    }

    applyFilter(event, data) {
        event.stopPropagation();
        this.clearFiltersHighlight();
        if (this.filterModel.items.element.value == data.id)
            this.filterModel.items.element.value = [];
        else {
            this.filterModel.items.element.value = [data.id];
            event.target.parentNode.parentNode.parentNode.classList.add('filtered');
        }
        this._filtersService.change(this.filterModel);
    }

    onContentReady($event) {
        if (this.selectedKeys && this.selectedKeys.length) {
            this.listComponent.option('selectedItemKeys', this.selectedKeys);
        }
        this.highlightSelectedFilters();
    }

    onItemClick(event) {
        this.tooltipVisible = false;
        if (event.itemData.action) {
            event.itemData['action'](event);
        } else if (event.itemData.id) {
            this.changeItems(event.itemData);
        }
    }

    getNewListData(event, title) {
        event.listTitle = title;
        this.onListFiltered.emit(event);
    }
}
