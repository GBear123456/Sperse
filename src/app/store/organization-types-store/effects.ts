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
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class OrganizationTypeEffects {
    constructor(private dictionaryService: DictionaryServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<organizationTypesActions.LoadRequestAction>(organizationTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.dictionaryService.getOrganizationTypes()
                .pipe(
                    map((organizationTypes: OrganizationTypeDto[]) => {
                        return new organizationTypesActions.LoadSuccessAction(organizationTypes);
                    }),
                    catchError(err => {
                        return of(new organizationTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
