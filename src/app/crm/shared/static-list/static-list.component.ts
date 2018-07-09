import {Component, Injector, Input, EventEmitter, Output} from '@angular/core';
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
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();

    @Input() width: string;
    @Input() title: string;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector: string;
    @Input() showConfirmation: boolean = true;
    @Input() hideButtons = false;

    @Input() list: any;

    listComponent: any;
    tooltipVisible: boolean;
    selectedItems: any = [];

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
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.showConfirmation)
                    this.message.confirm(
                        this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                        isConfirmed => {
                            isConfirmed && this.onItemSelected.emit(this.selectedItems[0]);
                        }
                    );
                else
                    this.onItemSelected.emit(this.selectedItems[0]);
            }
        }
        this.tooltipVisible = false;
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
            while(elements.length)
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
        this.highlightSelectedFilters();
    }

    onSelectionChange(event) {
        this.onSelectionChanged.emit(event);
    }
}
