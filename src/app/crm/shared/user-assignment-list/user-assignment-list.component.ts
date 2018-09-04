import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { AssignContactGroupInput, AssignContactGroupsInput, UserAssignmentServiceProxy } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'crm-user-assignment-list',
  templateUrl: './user-assignment-list.component.html',
  styleUrls: ['./user-assignment-list.component.less'],
  providers: [UserAssignmentServiceProxy]
})
export class UserAssignmentComponent extends AppComponentBase implements OnInit {
    @Input() multiSelection = false;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Assign']";
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() get selectedItemKey() {
        return this.multiSelection ? this.selectedItemKeys :
            (this.selectedItemKeys && this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined);
    }
    set selectedItemKey(value) {
        this.selectedItemKeys = this.multiSelection ? value: [value];
    }
    @Output() selectedItemKeyChange = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    private selectedItemKeys = [];
    list: any;
    listComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _userAssignmentService: UserAssignmentServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    private moveSelectedItemsToTop() {
        let index = 0;
        if (!this.listComponent || !this.selectedKeys || !this.selectedKeys.length)
            return;

        let items = this.listComponent.getDataSource().items();
        if (items.some((el, i, a) => {
            if (index > 0 && el.id == this.selectedItemKey)
                return true;
            index++;
        }))
            this.listComponent.reorderItem(index, 0);
    }

    private disableInactiveUsers() {
        this.list && this.list.forEach(el => {
            if (!el.isActive)
                el.disabled = true;
        });
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys = undefined) {
        if (this.listComponent) {
            this.selectedItemKeys = this.list.map((item, index) => {
                return this.listComponent.isItemSelected(item) && item.id;
            }).filter(Boolean);
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

            setTimeout(() => { this.listComponent.option('searchValue', undefined); }, 500);
        }
        this.tooltipVisible = false;
    }

    process() {
        if (this.bulkUpdateMode)
            this._userAssignmentService.assignContactGroups(AssignContactGroupsInput.fromJS({
                contactGroupIds: this.selectedKeys,
                userId: this.selectedItemKey
            })).pipe(finalize(() => {
                this.listComponent.unselectAll();
            })).subscribe((result) => {
                this.notify.success(this.l('UserAssigned'));
            });
        else
            this._userAssignmentService.assignContactGroup(AssignContactGroupInput.fromJS({
                contactGroupId: this.selectedKeys[0],
                userId: this.selectedItemKey
            })).subscribe((result) => {
                this.moveSelectedItemsToTop();
                this.notify.success(this.l('UserAssigned'));
            });
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        /** @todo change for store selecting */
        this._userAssignmentService.getUsers(true).subscribe((result) => {
            this.list = result;
        });
    }

    reset() {
        this.selectedItemKey = null;
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
            while (elements.length)
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
        this.moveSelectedItemsToTop();
        this.disableInactiveUsers();
    }

    onSelectionChange(event) {
        this.onSelectionChanged.emit(event);
        this.selectedItemKeyChange.emit(
            this.multiSelection ? this.selectedItemKeys : event.addedItems[0]);
    }

    checkPermissions() {
        return this.permission.isGranted('Pages.CRM.Customers.ManageAssignments') &&
            (!this.bulkUpdateMode || this.permission.isGranted('Pages.CRM.BulkUpdates'));
    }
}
