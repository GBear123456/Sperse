/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as languagesActions from './actions';
import { LanguageDto, CountryServiceProxy } from '@shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LanguagesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<languagesActions.LoadRequestAction>(languagesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(CountryServiceProxy).getLanguages()
                .pipe(
                    map((languages: LanguageDto[]) => {
                        return new languagesActions.LoadSuccessAction(languages);
                    }),
                    catchError(err => {
                        return of(new languagesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
