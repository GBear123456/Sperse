/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, startWith, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as starsActions from './actions';
import { DictionaryServiceProxy, ContactStarInfoDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class StarsStoreEffects {
    constructor(private dictionaryService: DictionaryServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<starsActions.LoadRequestAction>(starsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.dictionaryService.getStars()
                .pipe(
                    map((stars: ContactStarInfoDto[]) => {
                        return new starsActions.LoadSuccessAction(stars);
                    }),
                    catchError(err => {
                        return of(new starsActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
