/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, startWith, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as starsActions from './actions';
import { ContactGroupStarsServiceProxy, ContactGroupStarInfoDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class StarsStoreEffects {
    constructor(private customerStarsService: ContactGroupStarsServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<starsActions.LoadRequestAction>(starsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.customerStarsService.getStars()
                .pipe(
                    map((stars: ContactGroupStarInfoDto[]) => {
                        return new starsActions.LoadSuccessAction(stars);
                    }),
                    catchError(err => {
                        return of(new starsActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
