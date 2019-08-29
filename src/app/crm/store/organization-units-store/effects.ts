/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as organizationUnitsActions from './actions';
import { OrganizationUnitServiceProxy, OrganizationUnitDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';
import { OrganizationUnitDtoListResultDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class OrganizationUnitsEffects {
    constructor(private organizationUnitServiceProxy: OrganizationUnitServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<organizationUnitsActions.LoadRequestAction>(organizationUnitsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.organizationUnitServiceProxy.getOrganizationUnits()
                .pipe(
                    map((organizationUnitsList: OrganizationUnitDtoListResultDto) => {
                        return new organizationUnitsActions.LoadSuccessAction(organizationUnitsList.items);
                    }),
                    catchError(err => {
                        return of(new organizationUnitsActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
