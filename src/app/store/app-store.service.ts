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
import { ContactGroup } from '@shared/AppEnums';
import { timeout, filter } from 'rxjs/operators';

@Injectable()
export class AppStoreService {

    constructor(private store$: Store<AppStore.State>) {}

    private dispatchContactGroupActions(keyList) {
        if (keyList.length) {
            let key = ContactGroup[keyList.pop()];
            this.store$.dispatch(new ContactAssignedUsersStoreActions.LoadRequestAction(key));
            this.store$.pipe(select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: key }))
                .pipe(filter((res) => Boolean(res))).subscribe(() => setTimeout(() => this.dispatchContactGroupActions(keyList), 100));
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