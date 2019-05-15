/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import { State } from './state';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';
import { getLoadedTime } from './selectors';
import * as forecastModelsActions from './actions';
import {
    CashFlowForecastServiceProxy,
    ForecastModelDto,
    InstanceType33,
    InstanceType32,
    InstanceType19, CreateForecastModelInput
} from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';

@Injectable()
export class ForecastModelsStoreEffects {
    constructor(
        private injector: Injector,
        private actions$: Actions,
        private store$: Store<State>,
        private cashFlowForecastServiceProxy: CashFlowForecastServiceProxy,
        private cfoService: CFOService
    ) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<forecastModelsActions.LoadRequestAction>(forecastModelsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.cashFlowForecastServiceProxy.getModels(this.cfoService.instanceType as InstanceType19, this.cfoService.instanceId)
                .pipe(
                    map((forecastModels: ForecastModelDto[]) => {
                        return new forecastModelsActions.LoadSuccessAction(forecastModels);
                    }),
                    catchError(err => {
                        return of(new forecastModelsActions.LoadFailureAction(err));
                    })
                );
        })
    );

    @Effect()
    addForecastModalEffect$: Observable<Action> = this.actions$.pipe(
        ofType<forecastModelsActions.AddForecastModelAction>(forecastModelsActions.ActionTypes.ADD_FORECAST_MODEL),
        exhaustMap((action) => {
            return this.cashFlowForecastServiceProxy.createForecastModel(
                this.cfoService.instanceType as InstanceType32,
                this.cfoService.instanceId,
                action.payload
            ).pipe(
                map((forecastModelId: number) => {
                    action.payload['id'] = forecastModelId;
                    return new forecastModelsActions.AddForecastModelSuccessAction(action.payload);
                })
            );
        })
    );

    @Effect()
    renameForecastModalEffect$: Observable<Action> = this.actions$.pipe(
        ofType<forecastModelsActions.RenameForecastModelAction>(forecastModelsActions.ActionTypes.RENAME_FORECAST_MODEL),
        exhaustMap((action) => {
            return this.cashFlowForecastServiceProxy.renameForecastModel(
                this.cfoService.instanceType as InstanceType33,
                this.cfoService.instanceId,
                action.payload
            ).pipe(
                map(() => {
                    return new forecastModelsActions.RenameForecastModelSuccessAction(action.payload);
                })
            );
        })
    );
}
