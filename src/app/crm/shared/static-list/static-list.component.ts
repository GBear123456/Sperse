import { Component, Injector, Input, EventEmitter, Output, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';

import { AppConsts } from '@shared/AppConsts';

import * as _ from 'underscore';

@Component({
  selector: 'crm-static-list',
  templateUrl: './static-list.component.html',
  styleUrls: ['./static-list.component.less']
})
export class StaticListComponent extends AppComponentBase {
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Input() width: string;
    @Input() title: string;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector: string;
    @Input() showConfirmation = true;
    @Input() updateConfirmationTitle: string;
    @Input() updateConfirmationMessage: string;
    @Input() hideButtons = false;

    @Input() list: any;
    @Input() showTitle = true;

    listComponent: any;
    tooltipVisible: boolean;
    @Input() selectedItems: any = [];
    @HostBinding('class.highlightSelected') @Input() highlightSelected = false;
    @HostBinding('class.disableHindmost') @Input() disableHindmost = false;
    @HostBinding('class.funnel-styling') @Input() funnelStyling = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
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
            if (this.showConfirmation && this.checkPermissions())
                this.message.confirm(
                    this.updateConfirmationMessage || this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                    this.updateConfirmationTitle || null,
                    isConfirmed => {
                        isConfirmed && this.onItemSelected.emit(selectedData);
                    }
                );
            else
                this.onItemSelected.emit(selectedData);
        }
    }

    onInitialized($event) {
        this.listComponent = $event.component;
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
        if (event.itemData.action) {
            event.itemData['action'](event);
        } else if (event.itemData.id) {
            this.changeItems(event.itemData);
        }
    }

    checkPermissions() {
        return this.permission.isGranted('Pages.CRM.BulkUpdates');
    }
}