/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import { State } from './state';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';
import { getLoadedTime } from './selectors';
import * as currenciesActions from './actions';
import { CurrencyInfo, CurrencyServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class CurrenciesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>,
                private currencyServiceProxy: CurrencyServiceProxy
    ) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<currenciesActions.LoadRequestAction>(currenciesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.currencyServiceProxy.getAll()
                .pipe(
                    map((currencies: CurrencyInfo[]) => {
                        return new currenciesActions.LoadSuccessAction(currencies);
                    }),
                    catchError(err => {
                        return of(new currenciesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
