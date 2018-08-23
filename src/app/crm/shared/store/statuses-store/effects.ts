/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as statusesActions from './actions';
import { CustomersServiceProxy, CustomerStatusDto } from '@shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class StatusesStoreEffects {
    constructor(private customerStatusesService: CustomersServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new statusesActions.LoadRequestAction(false)),
        ofType<statusesActions.LoadRequestAction>(statusesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        switchMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.customerStatusesService.getCustomerStatuses()
                .pipe(
                    map((statuses: CustomerStatusDto[]) => {
                        return new statusesActions.LoadSuccessAction(statuses);
                    }),
                    catchError(err => {
                        return of(new statusesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
