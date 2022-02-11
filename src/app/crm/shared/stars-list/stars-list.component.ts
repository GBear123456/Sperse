/** Core imports */
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';
import { Store } from '@ngrx/store';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { ContactStarsServiceProxy, MarkContactInput, MarkContactsInput, LayoutType } from '@shared/service-proxies/service-proxies';
import { AppStore, StarsStoreSelectors } from '@app/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from '@abp/message/message.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
  selector: 'crm-stars-list',
  templateUrl: './stars-list.component.html',
  styleUrls: ['./stars-list.component.less'],
  providers: [ ContactStarsServiceProxy ]
})
export class StarsListComponent implements OnInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() managePermission = AppPermissions.CRMCustomersManage;
    @Input() set selectedItemKey(value) {
        if (value != undefined)
            this.selectedItemKeys = [value];
    }
    get selectedItemKey() {
        return this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined;
    }
    selectedItemKeys = [];

    @Input() targetSelector = '[aria-label=\'star-icon\']';
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onUpdated: EventEmitter<any> = new EventEmitter();

    list: any;
    layoutType = LayoutType;
    listComponent: any;
    tooltipVisible = false;
    manageAllowed = false;

    constructor(
        private filtersService: FiltersService,
        private starsService: ContactStarsServiceProxy,
        private store$: Store<AppStore.State>,
        private messageService: MessageService,
        private notifyService: NotifyService,
        private permissionCheckerService: AppPermissionService,
        public appSessionService: AppSessionService,
        public ls: AppLocalizationService
    ) {
        if (this.appSessionService.tenant && this.appSessionService.tenant.customLayoutType == LayoutType.BankCode)
            this.targetSelector = '[aria-label=\'focus\']';
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys?) {
        if (this.listComponent) {
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.messageService.confirm(
                        this.ls.l('BulkUpdateConfirmation', this.selectedKeys.length),
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
            this.starsService.markContacts(MarkContactsInput.fromJS({
                contactIds: this.selectedKeys,
                starId: this.selectedItemKey
            })).pipe(finalize(() => {
                this.listComponent.unselectAll();
            })).subscribe(() => {
                this.onUpdated.emit();
                this.notifyService.success(this.ls.l('CustomersMarked'));
            });
        else
            this.starsService.markContact(MarkContactInput.fromJS({
                contactId: this.selectedKeys[0],
                starId: this.selectedItemKey
            })).subscribe((result) => {
                this.onUpdated.emit();
                this.notifyService.success(this.ls.l('CustomersMarked'));
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

        this.filtersService.change([this.filterModel]);
    }

    onContentReady($event) {
        this.highlightSelectedFilters();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    ngOnInit() {
        this.manageAllowed = this.isManageAllowed();
        this.store$.select(StarsStoreSelectors.getStars).subscribe((result) => {
            this.list = _.sortBy(result, 'id');
        });
    }

    onSelectionChange(event) {
        this.selectedItemKey = event && event.addedItems.length ? event.addedItems[0].id : undefined;
        this.onSelectionChanged.emit(event);
    }

    isManageAllowed() {
        return this.permissionCheckerService.isGranted(this.managePermission) &&
            (!this.bulkUpdateMode || this.permissionCheckerService.isGranted(AppPermissions.CRMBulkUpdates));
    }
}
