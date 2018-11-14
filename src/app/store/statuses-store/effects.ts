/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as statusesActions from './actions';
import { ContactServiceProxy, ContactStatusDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class StatusesStoreEffects {
    constructor(private contactService: ContactServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<statusesActions.LoadRequestAction>(statusesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.contactService.getContactStatuses()
                .pipe(
                    map((statuses: ContactStatusDto[]) => {
                        return new statusesActions.LoadSuccessAction(statuses);
                    }),
                    catchError(err => {
                        return of(new statusesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
