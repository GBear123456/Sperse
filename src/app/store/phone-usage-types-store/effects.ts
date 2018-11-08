/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as phoneUsageTypesActions from '@app/store/phone-usage-types-store/actions';
import { ContactPhoneServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { ListResultDtoOfPhoneUsageTypeDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { StoreHelper } from '@root/store/store.helper';

@Injectable()
export class PhoneUsageTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<phoneUsageTypesActions.LoadRequestAction>(phoneUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(ContactPhoneServiceProxy).getPhoneUsageTypes()
                .pipe(
                    map((phoneUsageTypes: ListResultDtoOfPhoneUsageTypeDto) => {
                        return new phoneUsageTypesActions.LoadSuccessAction(phoneUsageTypes.items);
                    }),
                    catchError(err => {
                        return of(new phoneUsageTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );

}
