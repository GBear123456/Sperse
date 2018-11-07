/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, startWith, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as pipelinesActions from './actions';
import { PipelineServiceProxy, PipelineDto } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PipelinesStoreEffects {
    constructor(private pipelineService: PipelineServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new pipelinesActions.LoadRequestAction(false)),
        ofType<pipelinesActions.LoadRequestAction>(pipelinesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.pipelineService.getPipelineDefinitions(undefined)
                .pipe(
                    map((pipelines: PipelineDto[]) => {
                        return new pipelinesActions.LoadSuccessAction(pipelines);
                    }),
                    catchError(err => {
                        return of(new pipelinesActions.LoadFailureAction(err));
                    })
                );
        })
    );
}
