/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as countriesActions from './actions';
import { CountryDto, CountryServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class CountriesStoreEffects {
    constructor(private countriesService: CountryServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<countriesActions.LoadRequestAction>(countriesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.countriesService.getCountries()
                .pipe(
                    map((countries: CountryDto[]) => {
                        return new countriesActions.LoadSuccessAction(countries);
                    }),
                    catchError(err => {
                        return of(new countriesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
