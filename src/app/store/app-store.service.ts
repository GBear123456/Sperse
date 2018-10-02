import { Injectable } from '@angular/core';
import {
    ActivityAssignedUsersStoreActions,
    CustomerAssignedUsersStoreActions,
    LeadAssignedUsersStoreActions,
    ListsStoreActions,
    PartnerAssignedUsersStoreActions,
    PartnerTypesStoreActions,
    StarsStoreActions,
    StatusesStoreActions,
    TagsStoreActions
} from '@app/store/index';
import { Store } from '@ngrx/store';
import { AppStore } from './index';

@Injectable()
export class AppStoreService {

    constructor(private store$: Store<AppStore>) {}

    loadUserDictionaries() {
        /** @todo check permissions */
        this.store$.dispatch(new PartnerAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new PartnerTypesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StarsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new StatusesStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new TagsStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ActivityAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new CustomerAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new LeadAssignedUsersStoreActions.LoadRequestAction(false));
        this.store$.dispatch(new ListsStoreActions.LoadRequestAction(false));
    }
}
