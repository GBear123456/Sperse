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
import { getLoaded } from './selectors';
import { ListResultDtoOfEmailUsageTypeDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class EmailUsageTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<emailUsageTypesActions.LoadRequestAction>(emailUsageTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
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
