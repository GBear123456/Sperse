/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as emailUsageTypesActions from '@app/store/email-usage-types-store/actions';
import { ContactEmailServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { ListResultDtoOfEmailUsageTypeDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { StoreHelper } from '@root/store/store.helper';

@Injectable()
export class EmailUsageTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<emailUsageTypesActions.LoadRequestAction>(emailUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(ContactEmailServiceProxy).getEmailUsageTypes()
                .pipe(
                    map((emailUsageTypes: ListResultDtoOfEmailUsageTypeDto) => {
                        return new emailUsageTypesActions.LoadSuccessAction(emailUsageTypes.items);
                    }),
                    catchError(err => {
                        return of(new emailUsageTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
