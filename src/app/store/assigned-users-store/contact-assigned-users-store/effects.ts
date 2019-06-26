/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty, zip } from 'rxjs';
import { filter, catchError, exhaustMap, 
    map, mergeMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as assignedUsersActions from './actions';
import { ContactServiceProxy, UserInfoDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getContactGroupAssignedUsers } from './selectors';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ContactGroupPermission } from '@shared/AppEnums';

@Injectable()
export class ContactAssignedUsersStoreEffects {
    constructor(private _contactService: ContactServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private permissionCheckerService: AppPermissionService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<assignedUsersActions.LoadRequestAction>(assignedUsersActions.ActionTypes.LOAD_REQUEST),
        filter((action) => this.permissionCheckerService.isGranted('Pages.Administration.Users') ||
            this.permissionCheckerService.isGranted(ContactGroupPermission[action.payload] + '.ManageAssignments')),
        mergeMap(action => zip(of(action.payload), this.store$.pipe(select(getContactGroupAssignedUsers, { contactGroup: action.payload })))),
        exhaustMap(([payload, assignedUsers]) => {

            if (assignedUsers && assignedUsers.length) {
                return empty();
            }

            return this._contactService.getAllowedAssignableUsers(payload, undefined, undefined)
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