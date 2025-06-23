/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as subscriptionsActions from './actions';
import { MemberServiceServiceProxy, MemberServiceDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class SubscriptionsStoreEffects {
    constructor(
        private subscriptionsService: MemberServiceServiceProxy,
        private actions$: Actions,
        private store$: Store<State>
    ) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<subscriptionsActions.LoadRequestAction>(subscriptionsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (!action.payload && StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.subscriptionsService.getAll(true)
                .pipe(
                    map((subscriptions: MemberServiceDto[]) => {
                        return new subscriptionsActions.LoadSuccessAction(subscriptions);
                    }),
                    catchError(err => {
                        return of(new subscriptionsActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
