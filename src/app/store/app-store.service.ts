/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { first, filter, skip } from 'rxjs/operators';

/** Application imports */
import {
    ContactAssignedUsersStoreActions,
    ContactAssignedUsersStoreSelectors,
    ListsStoreActions,
    PartnerTypesStoreActions,
    StarsStoreActions,
    TagsStoreActions,
    OrganizationTypeStoreActions
} from '@app/store/index';
import { AppStore } from './index';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class AppStoreService {

    crmIsAllowed: boolean = (
            this.permission.isGranted(AppPermissions.CRM)
            || this.permission.isGranted(AppPermissions.Administration)
        )
        && (
            this.permission.isGranted(AppPermissions.CRMCustomers)
            || this.permission.isGranted(AppPermissions.CRMPartners)
            || this.permission.isGranted(AppPermissions.CRMInvestors)
            || this.permission.isGranted(AppPermissions.CRMVendors)
            || this.permission.isGranted(AppPermissions.CRMEmployees)
            || this.permission.isGranted(AppPermissions.CRMOthers)
            || this.permission.isGranted(AppPermissions.AdministrationUsers)
        );

    constructor(
        private store$: Store<AppStore.State>,
        private permission: AppPermissionService
    ) {}

    dispatchUserAssignmentsActions(keyList, forced?: boolean) {
        if (keyList.length) {
            let contactGroup = keyList.pop(),
                groupId = <string>ContactGroup[contactGroup];
            if (this.permission.isGranted(ContactGroupPermission[contactGroup] + '.ManageAssignments' as AppPermissions)) {
                this.store$.dispatch(new ContactAssignedUsersStoreActions.LoadRequestAction({contactGroup: groupId, forced: forced}));
                this.store$.pipe(select(ContactAssignedUsersStoreSelectors.getContactGroupAssignedUsers, { contactGroup: groupId }),
                    skip(1), filter(Boolean), first()
                ).subscribe(() => setTimeout(() => this.dispatchUserAssignmentsActions(keyList, forced), 100));
            } else
                this.dispatchUserAssignmentsActions(keyList, forced);
        }
    }

    loadUserDictionaries() {
        if (this.crmIsAllowed) {
            this.store$.dispatch(new PartnerTypesStoreActions.LoadRequestAction(false));
            this.store$.dispatch(new StarsStoreActions.LoadRequestAction(false));
            this.store$.dispatch(new TagsStoreActions.LoadRequestAction(false));
            this.store$.dispatch(new ListsStoreActions.LoadRequestAction(false));
            this.store$.dispatch(new OrganizationTypeStoreActions.LoadRequestAction(false));
        }
    }
}
