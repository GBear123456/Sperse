/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as organizationTypesActions from './actions';
import { DictionaryServiceProxy, OrganizationTypeDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class OrganizationTypeEffects {
    constructor(private dictionaryService: DictionaryServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
            ofType<organizationTypesActions.LoadRequestAction>(organizationTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.dictionaryService.getOrganizationTypes()
                .pipe(
                    map((statuses: OrganizationTypeDto[]) => {
                    return new organizationTypesActions.LoadSuccessAction(statuses);
                    }),
                    catchError(err => {
                        return of(new organizationTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
