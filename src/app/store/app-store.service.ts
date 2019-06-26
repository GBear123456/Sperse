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
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Injectable()
export class AppStoreService {

    constructor(
        private store$: Store<AppStore.State>,
        private _permission: AppPermissionService
    ) {}

    dispatchUserAssignmentsActions(keyList) {
        if (keyList.length) {
            let contactGroup = keyList.pop(),
                groupId = ContactGroup[contactGroup];
            if (this._permission.isGranted(ContactGroupPermission[contactGroup] + '.ManageAssignments')) {
                this.store$.dispatch(new ContactAssignedUsersStoreActions.LoadRequestAction(groupId));
                this.store$.pipe(select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: groupId }))
                    .pipe(filter((res) => Boolean(res))).subscribe(() => setTimeout(() => this.dispatchUserAssignmentsActions(keyList), 100));
            } else
                this.dispatchUserAssignmentsActions(keyList);
        }
    }

    loadUserDictionaries() {
        /** @todo check permissions */
        this.store$.dispatch(new PartnerTypesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StarsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StatusesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new TagsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ActivityAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ListsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(false));
    }
}