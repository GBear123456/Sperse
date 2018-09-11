/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty, zip } from 'rxjs';
import { catchError, exhaustMap, map, mergeMap } from 'rxjs/operators';

/** Application imports */
import * as statesActions from './actions';
import { CountryStateDto, CountryServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getState } from './selectors';

@Injectable()
export class StatesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<statesActions.LoadRequestAction>(statesActions.ActionTypes.LOAD_REQUEST),
        mergeMap(action => {
            const payload$ = of(action.payload);
            /** Check if country states have been already loaded to the store */
            const countryStates$ = this.store$.pipe(select(getState, { countryCode: action.payload }));
            return zip(payload$, countryStates$);
        }),
        exhaustMap(([payload, countryStates]) => {

            /** If country states have been already loaded - don't do that again */
            if (countryStates && countryStates.length) {
                return empty();
            }

            return this.injector.get(CountryServiceProxy).getCountryStates(payload)
                .pipe(
                    map((states: CountryStateDto[]) => {
                        return new statesActions.LoadSuccessAction({
                            countryCode: payload,
                            states: states
                        });
                    }),
                    catchError(err => {
                        return of(new statesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
