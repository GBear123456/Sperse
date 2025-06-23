/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty, zip } from 'rxjs';
import { filter, catchError, exhaustMap, map, mergeMap } from 'rxjs/operators';
import invert from 'lodash/invert';

/** Application imports */
import * as assignedUsersActions from './actions';
import { ContactServiceProxy, UserInfoDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getContactGroupAssignedUsers } from './selectors';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ContactGroupPermission, ContactGroup } from '@shared/AppEnums';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class ContactAssignedUsersStoreEffects {
    constructor(
        private contactService: ContactServiceProxy,
        private actions$: Actions,
        private store$: Store<State>,
        private permissionCheckerService: AppPermissionService
    ) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<assignedUsersActions.LoadRequestAction>(assignedUsersActions.ActionTypes.LOAD_REQUEST),
        filter(action => this.permissionCheckerService.isGranted(AppPermissions.AdministrationUsers)
            || this.permissionCheckerService.isGranted(
                ContactGroupPermission[invert(ContactGroup)[action.payload.contactGroup]] + '.ManageAssignments' as AppPermissions
            )),
        mergeMap(action => zip(
            of(action.payload.contactGroup),
            action.payload.forced
                    ? of([])
                    : this.store$.pipe(select(getContactGroupAssignedUsers, {
                        contactGroup: action.payload.contactGroup }
                    ))
        )),
        exhaustMap(([payload, assignedUsers]) => {
            if (assignedUsers && assignedUsers.length)
                return empty();

            return this.contactService.getAllowedAssignableUsers(payload, undefined, undefined)
                .pipe(
                    map((users: UserInfoDto[]) => {
                        return new assignedUsersActions.LoadSuccessAction({
                            contactGroup: payload,
                            users: users
                        });
                    }),
                    catchError(err => {
                        return of(new assignedUsersActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
