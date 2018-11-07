/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import {
    filter,
    catchError,
    finalize,
    map,
    withLatestFrom,
    exhaustMap,
    mergeMap
} from 'rxjs/operators';

/** Application imports */
import * as partnerTypesActions from './actions';
import {
    BulkUpdatePartnerTypeInput,
    PartnerTypeServiceProxy,
    DictionaryServiceProxy,
    PartnerServiceProxy,
    PartnerTypeDto,
    RenamePartnerTypeInput
} from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PartnerTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>,
                private notifyService: NotifyService,
                private permissionCheckerService: PermissionCheckerService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<partnerTypesActions.LoadRequestAction>(partnerTypesActions.ActionTypes.LOAD_REQUEST),
        filter(() => this.permissionCheckerService.isGranted('Pages.CRM.Partners') ||
                             this.permissionCheckerService.isGranted('Pages.Administration.Users')),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(DictionaryServiceProxy).getPartnerTypes()
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
            const request = this.injector.get(PartnerServiceProxy).bulkUpdateType(BulkUpdatePartnerTypeInput.fromJS({
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
            return this.injector.get(PartnerTypeServiceProxy).rename(RenamePartnerTypeInput.fromJS({
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
            return this.injector.get(PartnerTypeServiceProxy).delete(payload.id, payload.moveToPartnerTypeId, payload.deleteAllReferences).pipe(
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
