/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as addressUsageTypesActions from './actions';
import { ListResultDtoOfAddressUsageTypeDto, ContactAddressServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class AddressUsageTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<addressUsageTypesActions.LoadRequestAction>(addressUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.injector.get(ContactAddressServiceProxy).getAddressUsageTypes()
                .pipe(
                    map((addressUsageTypes: ListResultDtoOfAddressUsageTypeDto) => {
                        return new addressUsageTypesActions.LoadSuccessAction(addressUsageTypes.items);
                    }),
                    catchError(err => {
                        return of(new addressUsageTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
