/** Core imports */
import { Component, Input, EventEmitter, Output, OnDestroy } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppStore } from '@app/store';
import { FiltersService } from '@shared/filters/filters.service';
import {
    AssignUserInput,
    AssignUserForEachInput,
    UserInfoDto
} from '@shared/service-proxies/service-proxies';
import { AppStoreService } from '@app/store/app-store.service';
import { ContactGroup } from '@shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';
import { MessageService } from 'abp-ng2-module';
import { PermissionCheckerService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { NotifyService } from 'abp-ng2-module';

@Component({
    selector: 'user-assignment-list',
    templateUrl: './user-assignment-list.component.html',
    styleUrls: ['./user-assignment-list.component.less']
})
export class UserAssignmentComponent implements OnDestroy {
    @Input() multiSelection = false;
    @Input() filterModel: any;
    @Input() get selectedKeys(): Array<any> {
        return this.affectedKeys;
    }
    set selectedKeys(value: Array<any>) {
        this.relatedUsers = undefined;
        this.affectedKeys = value;
    }
    @Input() targetSelector = '[aria-label="' + this.ls.l('Toolbar_Assign') + '"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() permissionKey: AppPermissions = null;
    @Input() get selectedItemKey() {
        return this.multiSelection ? this.selectedItemKeys :
            (this.selectedItemKeys && this.selectedItemKeys.length ? this.selectedItemKeys[0] : undefined);
    }
    set selectedItemKey(value) {
        this.selectedItemKeys = this.multiSelection ? value : [value];
    }
    @Input() proxyService: any;
    @Input() set assignedUsersSelector(value: (source$: Observable<any>) => Observable<any>) {
        if (value) {
            this.refreshList(value);
        }
    }
    @Input() selectionMode: 'none' | 'single' | 'multiple';
    @Output() selectedItemKeyChange = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();
    selectedItemKeys = [];
    private affectedKeys = [];
    list: UserInfoDto[] = [];
    relatedUsers;
    listComponent: any;
    tooltipVisible = false;
    isRelatedUser = false;
    subscription: Subscription;

    constructor(
        private appSessionService: AppSessionService,
        private appStoreService: AppStoreService,
        private filtersService: FiltersService,
        private store$: Store<AppStore.State>,
        private messageService: MessageService,
        private permissionService: PermissionCheckerService,
        private notifyService: NotifyService,
        public profileService: ProfileService,
        public ls: AppLocalizationService
    ) {
        appStoreService.dispatchUserAssignmentsActions(Object.keys(ContactGroup));
    }

    private moveSelectedItemsToTop() {
        let index = 0;
        if (!this.listComponent || !this.selectedKeys || !this.selectedKeys.length)
            return;

        let items = this.listComponent.getDataSource().items();
        if (items.some((el) => {
            if (index > 0 && el.id == this.selectedItemKey)
                return true;
            index++;
        }))
            this.listComponent.reorderItem(index, 0);
    }

    private disableInactiveUsers() {
        this.list && this.list.forEach(el => {
            if (!el.isActive)
                el['disabled'] = true;
        });
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
        return this.tooltipVisible;
    }

    apply(selectedKeys?: number[]) {
        if (this.listComponent) {
            this.selectedItemKeys = this.list.map((item) => {
                return this.listComponent.isItemSelected(item) && item.id;
            }).filter(Boolean);
            this.sortAssignableList();
            this.selectedKeys = selectedKeys || this.selectedKeys;
            if (this.selectedKeys && this.selectedKeys.length) {
                if (this.bulkUpdateMode)
                    this.messageService.confirm(
                        this.ls.l('BulkUpdateConfirmation', this.selectedKeys.length), '',
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
        if (this.proxyService) {
            if (this.bulkUpdateMode)
                this.proxyService.assignUserForEach(AssignUserForEachInput.fromJS({
                    ids: this.selectedKeys,
                    userId: this.selectedItemKey
                })).pipe(finalize(() => {
                    this.listComponent.unselectAll();
                })).subscribe(() => {
                    this.notifyService.success(this.ls.l('UserAssigned'));
                });
            else
                this.proxyService.assignUser(AssignUserInput.fromJS({
                    id: this.selectedKeys[0],
                    userId: this.selectedItemKey
                })).subscribe(() => {
                    this.moveSelectedItemsToTop();
                    this.notifyService.success(this.ls.l('UserAssigned'));
                });
        }
    }

    clear() {
        this.listComponent.unselectAll();
        this.apply();
    }

    onInitialized($event) {
        this.listComponent = $event.component;
    }

    sortAssignableList() {
        if (this.selectedItemKeys && this.selectedItemKeys.length)
            this.list.sort((prev, next) => {
                return this.selectedItemKeys.indexOf(prev.id) >= 0 ? -1 :
                    Number(this.selectedItemKeys.indexOf(next.id) >= 0);
            });
    }

    refreshList(assignedUsersSelector) {
        this.subscription = this.store$.pipe(assignedUsersSelector)
            .pipe(filter(Boolean))
            .subscribe((assignedUsers: UserInfoDto[]) => {
                if (assignedUsers && assignedUsers instanceof Array) {
                    this.list = assignedUsers.slice(0);
                    this.sortAssignableList();
                    if (!this.relatedUsers && this.selectedKeys && this.selectedKeys[0] && this.proxyService)
                        this.proxyService.getRelatedAssignableUsers(this.selectedKeys[0], true)
                            .subscribe((relatedUsers: UserInfoDto[]) => {
                                this.relatedUsers = relatedUsers;
                                this.initRelatedUsers();
                            });
                    else
                        this.initRelatedUsers();
                } else
                    this.list = [];
            });
    }

    initRelatedUsers() {
        let user = this.appSessionService.user;
        if (!this.relatedUsers || !this.relatedUsers.length ||
            this.relatedUsers.every(item => item.id != user.id)
        ) {
            this.relatedUsers = this.relatedUsers || [];
            this.relatedUsers.push({
                id: user.id,
                name: user.name + (user.surname ? ' ' + user.surname : ''),
                isActive: true,
                photoThumbnailId: user.profileThumbnailId
            });
        }

        this.relatedUsers.forEach(user => {
            this.isRelatedUser = this.isRelatedUser ||
                (user.id == abp.session.userId);
            if (!_.findWhere(this.list, { id: user.id }))
                this.list.unshift(user);
        });

        if (!this.checkPermissions())
            this.list = this.relatedUsers;
    }

    reset() {
        this.selectedItemKey = this.multiSelection ? [] : null;
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

    applyFilter(event, data?) {
        event.stopPropagation();
        this.clearFiltersHighlight();

        let modelItems = this.filterModel.items.element.value;
        if (modelItems.length == 1 && (!data || modelItems[0] == data.id))
            this.filterModel.items.element.value = [];
        else {
            this.filterModel.items.element.value = [data.id];
            event.target.parentNode.parentNode.parentNode.classList.add('filtered');
        }

        this.filtersService.change([this.filterModel]);
    }

    onContentReady() {
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
        return this.permissionService.isGranted(this.permissionKey) &&
            (!this.bulkUpdateMode || this.permissionService.isGranted(AppPermissions.CRMBulkUpdates));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}