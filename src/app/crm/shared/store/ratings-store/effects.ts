/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as ratingsActions from './actions';
import { CustomerRatingsServiceProxy, CustomerRatingInfoDto } from '@shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class RatingsStoreEffects {
    constructor(private customerRatingsService: CustomerRatingsServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new ratingsActions.LoadRequestAction(false)),
        ofType<ratingsActions.LoadRequestAction>(ratingsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        switchMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.customerRatingsService.getRatings()
                .pipe(
                    map((ratings: CustomerRatingInfoDto[]) => {
                        return new ratingsActions.LoadSuccessAction(ratings);
                    }),
                    catchError(err => {
                        return of(new ratingsActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
