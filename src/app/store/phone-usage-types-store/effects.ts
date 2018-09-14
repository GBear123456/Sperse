/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { finalize, catchError, exhaustMap, map, mergeMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as phoneUsageTypesActions from '@app/store/phone-usage-types-store/actions';
import { ContactPhoneServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';
import { ListResultDtoOfPhoneUsageTypeDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class PhoneUsageTypesStoreEffects {
    constructor(private contactPhoneServiceProxy: ContactPhoneServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<phoneUsageTypesActions.LoadRequestAction>(phoneUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.contactPhoneServiceProxy.getPhoneUsageTypes()
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
