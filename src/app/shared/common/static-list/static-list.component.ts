/** Core imports */
import { Component, Input, EventEmitter, Output, HostBinding, ViewChild } from '@angular/core';

/** Third party imports */
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { DxTabsComponent } from 'devextreme-angular/ui/tabs';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Application imports */
import { FiltersService } from '@shared/filters/filters.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from '@abp/message/message.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Component({
  selector: 'app-static-list',
  templateUrl: './static-list.component.html',
  styleUrls: ['./static-list.component.less']
})
export class StaticListComponent {
    @ViewChild('staticList', { static: false }) dxList: DxListComponent;
    @ViewChild(DxTabsComponent, { static: false }) dxTabs: DxTabsComponent;
    @ViewChild(DxTooltipComponent, { static: true }) dxTooltip: DxTooltipComponent;
    @Output() onApply: EventEmitter<any> = new EventEmitter();
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onListFiltered: EventEmitter<any> = new EventEmitter();
    @Output() onOptionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onBottomInputApplyValue: EventEmitter<any> = new EventEmitter();
    @Output() onFilterApply: EventEmitter<any> = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Input() width: string = '100%';
    @Input() height: number;
    @Input() listHeight: string;
    @Input() template: string;
    @Input() accessKey: string;
    @Input() title: string;
    @Input() filterModel: any;
    @Input() selectedKeys: any[];
    @Input() relatedItemsKeys: any[];
    @Input() targetSelector: string;
    @Input() showConfirmation = true;
    @Input() updateConfirmationTitle: string;
    @Input() updateConfirmationMessage: string;
    @Input() showSelectionControls = false;
    @Input() hideButtons = true;
    @Input() hideApplyForEmpty = true;
    @Input() searchEnabled = false;
    @Input() customSearchEnabled = false;
    @Input() pageLoadMode = 'nextButton';
    @Input() searchExprType = 'displayName';
    @Input() bulkUpdatePermissionKey: AppPermissions = null;
    @Input() convertNameStartCase = true;
    @Input() disabled = false;
    @Input('list')
    set list(value: any[]) {
        this._list = (value ? value.map((item) => {
            return _.extend(item, {
                displayName: this.convertNameStartCase ? startCase(item.name.toLowerCase()) : item.name
            });
        }) : (value || [])).filter((item) => !!item.name);
    }
    get list(): any[] {
        return this._list;
    }
    @Input() selectedTabId;
    @Input('tabsDataSource')
    set tabsDataSource(value: any[]) {
        this._tabsDataSource = value;
        this.list = value && this.selectedTabId ? this._tabsDataSource.find((v) => v.id == this.selectedTabId).items : null;
    }
    get tabsDataSource() {
        return this._tabsDataSource;
    }
    @Input() showTitle = true;
    @Input() selectionMode;

    listComponent: any;
    tooltipVisible: boolean;
    @Input() selectedItems: any = [];
    @HostBinding('class.highlightSelected') @Input() highlightSelected = false;
    @HostBinding('class.disableHindmost') @Input() disableHindmost = false;
    @HostBinding('class.funnel-styling') @Input() funnelStyling = false;
    whiteSpaceRegExp = /\s/gim;
    private _list: any[];
    private _tabsDataSource: any[];
    get selectionDisabled() {
        return (this.relatedItemsKeys && !this.relatedItemsKeys.length)
            || (!this.highlightSelected && !this.isBulkUpdateAvailable());
    }

    constructor(
        private filtersService: FiltersService,
        private messageService: MessageService,
        private permissionCheckerService: PermissionCheckerService,
        public ls: AppLocalizationService
    ) {}

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
        return this.tooltipVisible;
    }

    apply() {
        if (!this.hideApplyForEmpty || this.selectedItems && this.selectedItems.length)
            this.onApply.emit(this.selectedItems);
        this.tooltipVisible = false;
    }

    changeItems(selectedData = this.selectedItems[0]) {
        if (this.relatedItemsKeys && this.relatedItemsKeys.length && this.showConfirmation && this.isBulkUpdateAvailable()) {
            this.toggle();
            this.messageService.confirm(
                this.updateConfirmationMessage || this.ls.l('BulkUpdateConfirmation', this.relatedItemsKeys.length),
                this.updateConfirmationTitle || null,
                isConfirmed => {
                    isConfirmed && this.onItemSelected.emit(selectedData);
                    this.selectedItems = [];
                }
            );
        } else
            this.onItemSelected.emit(selectedData);
    }

    onInitialized($event) {
        this.listComponent = $event.component;
        if (!this.listHeight && this.height) {
            this.listHeight = (this.searchEnabled ? this.height - 90 : this.height - 65) + 'px';
        }
    }

    highlightSelectedFilters() {
        let filterValue = this.filterModel && this.filterModel.items.element.value;
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

    applyFilter(event, data?) {
        let filterElement = this.filterModel.items.element;
        this.clearFiltersHighlight();
        if (this.onFilterApply.observers.length)
            this.onFilterApply.emit(data);
        else {
            if (!data || filterElement.value == data.id)
                filterElement.value = [];
            else
                filterElement.value = [data.id];
        }
        this.dxList.instance.repaint();
        this.filtersService.change([this.filterModel]);
        event.stopPropagation();
    }

    isFilteredItem(data?) {
        let value = this.filterModel && this.filterModel.items.element.value;
        if (value)
            return value.some ? value.some(item => {
                let value = typeof(item) == 'string' ? item : item.value;
                return data ? value == data.id : !!value;
            }) : (data ? data.id == value : !!value);
    }

    onContentReady() {
        if (this.selectedKeys && this.selectedKeys.length) {
            this.listComponent.option('selectedItemKeys', this.selectedKeys);
        }
        this.highlightSelectedFilters();
    }

    onItemClick(event) {
        if (!this.selectionDisabled) {
            if (event.itemData.action) {
                event.itemData['action'](event);
            } else if (event.itemData.id) {
                this.changeItems(event.itemData);
            }
        }
    }

    isBulkUpdateAvailable() {
        return this.permissionCheckerService.isGranted(this.bulkUpdatePermissionKey);
    }

    getNewListData(event, title) {
        event.listTitle = title;
        this.onListFiltered.emit(event);
    }

    setValue(event, data) {
        event.event.stopPropagation();
        this.onBottomInputApplyValue.emit(data);
    }

    onTabChanged($event) {
        let item = $event.addedItems[0];
        this.selectedTabId = item.id;
        this.list = item.items;
        this.dxList.instance.updateDimensions();
        setTimeout(() => this.dxTooltip.instance.repaint());
    }

    onTabsClick($event) {
        let button = $event.target.closest('.dx-tabs-nav-button');
        if (button) {
            let currentIndex = this._tabsDataSource.findIndex((v) => v.id == this.selectedTabId),
                isMoveRight = button.classList.contains('dx-tabs-nav-button-right'),
                lastIndex = this._tabsDataSource.length - 1,
                isLastTab = currentIndex == lastIndex,
                isFirstTab = currentIndex == 0;

            if (isFirstTab)
                this.dxTabs.selectedIndex = isMoveRight ? currentIndex + 1 : lastIndex;
            else if (isLastTab)
                this.dxTabs.selectedIndex = isMoveRight ? 0 : currentIndex - 1;
            else
                this.dxTabs.selectedIndex = currentIndex + (isMoveRight ? 1 : -1);
        }
    }
}