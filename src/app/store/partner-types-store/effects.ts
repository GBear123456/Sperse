/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import {
    catchError,
    finalize,
    map,
    startWith,
    switchMap,
    withLatestFrom,
    exhaustMap,
    mergeMap
} from 'rxjs/operators';

/** Application imports */
import * as partnerTypesActions from './actions';
import {
    BulkUpdatePartnerTypeInput,
    PartnerTypeServiceProxy,
    PartnerServiceProxy,
    PartnerTypeDto,
    RenamePartnerTypeInput
} from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class PartnerTypesStoreEffects {
    constructor(private partnersService: PartnerServiceProxy,
                private partnerTypeServiceProxy: PartnerTypeServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private notifyService: NotifyService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new partnerTypesActions.LoadRequestAction(false)),
        ofType<partnerTypesActions.LoadRequestAction>(partnerTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.partnerTypeServiceProxy.getAll()
                .pipe(
                    map((partnerTypes: PartnerTypeDto[]) => {
                        return new partnerTypesActions.LoadSuccessAction(partnerTypes);
                    }),
                    catchError(err => {
                        return of(new partnerTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );

    @Effect()
    addPartnerTypeRequest$: Observable<Action> = this.actions$.pipe(
        ofType<partnerTypesActions.AddPartnerType>(partnerTypesActions.ActionTypes.ADD_PARTNER_TYPE),
        map(action => action.payload),
        mergeMap(payload => {
            const request = this.partnersService.bulkUpdateType(BulkUpdatePartnerTypeInput.fromJS({
                partnerIds: payload.partnerIds,
                typeName: payload.typeName
            }));
            return request.pipe(
                map(() => {
                    this.notifyService.success(payload.successMessage);
                    /** Reload data from server */
                    return new partnerTypesActions.LoadRequestAction(true);
                }),
                catchError(err => {
                    this.store$.dispatch(new partnerTypesActions.LoadRequestAction(true));
                    return of(new partnerTypesActions.AddPartnerTypeFailure(err));
                })
            );
        })
    );

    @Effect()
    renamePartnerTypeRequest$: Observable<Action> = this.actions$.pipe(
        ofType<partnerTypesActions.RenamePartnerType>(partnerTypesActions.ActionTypes.RENAME_PARTNER_TYPE),
        map(action => action.payload),
        mergeMap(payload => {
            return this.partnerTypeServiceProxy.rename(RenamePartnerTypeInput.fromJS({
                id: payload.id,
                name: payload.name
            })).pipe(
                finalize(() => {
                    this.store$.dispatch(new partnerTypesActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new partnerTypesActions.RenamePartnerTypeSuccess(payload);
                }),
                catchError(err => {
                    return of(new partnerTypesActions.RenamePartnerTypeFailure(err));
                })
            );
        })
    );

    @Effect()
    removePartnerTypeRequest$: Observable<Action> = this.actions$.pipe(
        ofType<partnerTypesActions.RemovePartnerType>(partnerTypesActions.ActionTypes.REMOVE_PARTNER_TYPE),
        map(action => action.payload),
        mergeMap(payload => {
            return this.partnerTypeServiceProxy.delete(payload.id, payload.moveToPartnerTypeId, payload.deleteAllReferences).pipe(
                finalize(() => {
                    this.store$.dispatch(new partnerTypesActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new partnerTypesActions.RemovePartnerTypeSuccess(payload);
                }),
                catchError(err => {
                    return of(new partnerTypesActions.RemovePartnerTypeFailure(err));
                })
            );
        })
    );
}
