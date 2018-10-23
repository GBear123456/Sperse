/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { filter, catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as assignedUsersActions from './actions';
import { UserAssignmentServiceProxy, UserInfoDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Injectable()
export class PartnerAssignedUsersStoreEffects {
    constructor(private _userAssignmentService: UserAssignmentServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private permissionCheckerService: PermissionCheckerService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<assignedUsersActions.LoadRequestAction>(assignedUsersActions.ActionTypes.LOAD_REQUEST),
        filter(() => this.permissionCheckerService.isGranted('Pages.CRM.Partners.ManageAssignments') ||
                             this.permissionCheckerService.isGranted('Pages.Administration.Users')),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this._userAssignmentService.getAllowedAssignableUsersForPartner(true, undefined, undefined)
                .pipe(
                    map((users: UserInfoDto[]) => {
                        return new assignedUsersActions.LoadSuccessAction(users);
                    }),
                    catchError(err => {
                        return of(new assignedUsersActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
