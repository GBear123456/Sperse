/** Core imports */
import { Component, Injector, Input, EventEmitter, Output, HostBinding, ViewChild } from '@angular/core';

/** Third party imports */
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
  selector: 'app-static-list',
  templateUrl: './static-list.component.html',
  styleUrls: ['./static-list.component.less']
})
export class StaticListComponent extends AppComponentBase {
    @ViewChild('staticList') dxList: DxListComponent;
    @ViewChild('customSearch') dxSearch: DxTextBoxComponent;
    @ViewChild(DxTooltipComponent) dxTooltip: DxTooltipComponent;
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onListFiltered: EventEmitter<any> = new EventEmitter();
    @Output() onOptionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onBottomInputApplyValue: EventEmitter<any> = new EventEmitter();
    @Input() width: string;
    @Input() height: number;
    @Input() listHeight: string;
    @Input() template: string;
    @Input() accessKey: string;
    @Input() title: string;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector: string;
    @Input() showConfirmation = true;
    @Input() updateConfirmationTitle: string;
    @Input() updateConfirmationMessage: string;
    @Input() hideButtons = false;
    @Input() searchEnabled = false;
    @Input() customSearchEnabled = false;
    @Input() pageLoadMode = 'nextButton';
    @Input() searchExprType = 'name';
    @Input() bulkUpdatePermissionKey: AppPermissions = null;
    @Input() convertNameStartCase = true;
    @Input('list')
    set list(value: any[]) {
        this._list = this.convertNameStartCase ? value.map((item) => {
            return _.extend(item, {
                name: startCase(item.name.toLowerCase())
            });
        }) : value;
    }
    get list(): any[] {
        return this._list;
    }
    @Input() showTitle = true;
    @Input() selectionMode;

    listComponent: any;
    tooltipVisible: boolean;
    bottomInputValue: string;
    @Input() selectedItems: any = [];
    @HostBinding('class.highlightSelected') @Input() highlightSelected = false;
    @HostBinding('class.disableHindmost') @Input() disableHindmost = false;
    @HostBinding('class.funnel-styling') @Input() funnelStyling = false;
    whiteSpaceRegExp = /\s/gim;
    private _list: any[];

    constructor(
        injector: Injector,
        private _filtersService: FiltersService
    ) {
        super(injector);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
        return this.tooltipVisible;
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
        if (!this.listHeight && this.height) {
            this.listHeight = (this.searchEnabled ? this.height - 90 : this.height - 65) + 'px';
        }
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
        return this.permission.isGranted(this.bulkUpdatePermissionKey);
    }

    getNewListData(event, title) {
        event.listTitle = title;
        this.onListFiltered.emit(event);
    }

    setValue(event, data) {
        event.event.stopPropagation();
        this.onBottomInputApplyValue.emit(data);
    }
}
