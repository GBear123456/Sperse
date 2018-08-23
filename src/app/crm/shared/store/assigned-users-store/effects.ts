/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as assignedUsersActions from './actions';
import { UserAssignmentServiceProxy, UserInfoDto } from '@shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class AssignedUsersStoreEffects {
    constructor(private _userAssignmentService: UserAssignmentServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new assignedUsersActions.LoadRequestAction(false)),
        ofType<assignedUsersActions.LoadRequestAction>(assignedUsersActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        switchMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this._userAssignmentService.getUsers(true)
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
