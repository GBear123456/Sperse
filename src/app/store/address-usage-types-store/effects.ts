/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as addressUsageTypesActions from './actions';
import { AddressUsageTypeDtoListResultDto, ContactAddressServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { AppConsts } from '@shared/AppConsts';
import { StoreHelper } from '@root/store/store.helper';

@Injectable()
export class AddressUsageTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<addressUsageTypesActions.LoadRequestAction>(addressUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom( this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(ContactAddressServiceProxy).getAddressUsageTypes()
                .pipe(
                    map((addressUsageTypes: AddressUsageTypeDtoListResultDto) => {
                        return new addressUsageTypesActions.LoadSuccessAction(addressUsageTypes.items);
                    }),
                    catchError(err => {
                        return of(new addressUsageTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
