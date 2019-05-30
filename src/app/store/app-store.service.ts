import { Injectable } from '@angular/core';
import {
    ActivityAssignedUsersStoreActions,
    ContactAssignedUsersStoreActions,
    ContactAssignedUsersStoreSelectors,
    ListsStoreActions,
    PartnerTypesStoreActions,
    StarsStoreActions,
    StatusesStoreActions,
    TagsStoreActions,
    OrganizationTypeStoreActions
} from '@app/store/index';
import { Store, select } from '@ngrx/store';
import { AppStore } from './index';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';
import { filter } from 'rxjs/operators';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Injectable()
export class AppStoreService {

    constructor(
        private store$: Store<AppStore.State>,
        private _permission: PermissionCheckerService
    ) {}

    private dispatchContactGroupActions(keyList) {
        if (keyList.length) {
            let contactGroup = keyList.pop(),
                groupId = ContactGroup[contactGroup];
            if (this._permission.isGranted(ContactGroupPermission[contactGroup] + '.ManageAssignments')) {
                this.store$.dispatch(new ContactAssignedUsersStoreActions.LoadRequestAction(groupId));
                this.store$.pipe(select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: groupId }))
                    .pipe(filter((res) => Boolean(res))).subscribe(() => setTimeout(() => this.dispatchContactGroupActions(keyList), 100));
            } else
                this.dispatchContactGroupActions(keyList);
        }
    }

    loadUserDictionaries() {
        /** @todo check permissions */
        this.dispatchContactGroupActions(Object.keys(ContactGroup));

        this.store$.dispatch(new PartnerTypesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StarsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StatusesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new TagsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ActivityAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ListsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(false));
    }
}