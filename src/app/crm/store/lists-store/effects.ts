/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import { ContactGroupListsServiceProxy, ContactGroupListInfoDto, AddContactGroupsToListsInput, UpdateContactGroupListInput, UpdateContactGroupListsInput } from 'shared/service-proxies/service-proxies';
import * as listsActions from './actions';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class ListsStoreEffects {
    constructor(private _listsService: ContactGroupListsServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private notifyService: NotifyService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new listsActions.LoadRequestAction(false)),
        ofType<listsActions.LoadRequestAction>(listsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        switchMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this._listsService.getLists()
                .pipe(
                    map((lists: ContactGroupListInfoDto[]) => {
                        return new listsActions.LoadSuccessAction(lists);
                    }),
                    catchError(err => {
                        return of(new listsActions.LoadFailureAction(err));
                    })
                );
        })
    );

    @Effect()
    addListRequest$: Observable<Action> = this.actions$.pipe(
        ofType<listsActions.AddList>(listsActions.ActionTypes.ADD_LIST),
        map(action => action.payload),
        switchMap(payload => {
            let request: Observable<any>;
            if (payload.serviceMethodName === 'addContactGroupsToLists') {
                request = this._listsService[payload.serviceMethodName ](AddContactGroupsToListsInput.fromJS({
                             contactGroupIds: payload.contactGroupIds,
                             lists: payload.lists
                          }));
            } else if (payload.serviceMethodName === 'updateContactGroupLists') {
                request = this._listsService.updateContactGroupLists(UpdateContactGroupListsInput.fromJS({
                             contactGroupId: payload.contactGroupIds[0],
                             lists: payload.lists
                          }));
            } else {
                return of(new listsActions.RenameListFailure('wrong method name'));
            }
            return request.pipe(
                map(() => {
                    this.notifyService.success(payload.successMessage);
                    /** Reload data from server */
                    return new listsActions.LoadRequestAction(true);
                }),
                catchError(err => {
                    this.store$.dispatch(new listsActions.LoadRequestAction(true));
                    return of(new listsActions.AddListFailure(err));
                })
            );
        })
    );

    @Effect()
    renameListRequest$: Observable<Action> = this.actions$.pipe(
        ofType<listsActions.RenameList>(listsActions.ActionTypes.RENAME_LIST),
        map(action => action.payload),
        switchMap(payload => {
            return this._listsService.rename(UpdateContactGroupListInput.fromJS({
                id: payload.id,
                name: payload.name
            })).pipe(
                finalize(() => {
                    this.store$.dispatch(new listsActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new listsActions.RenameListSuccess(payload);
                }),
                catchError(err => {
                    return of(new listsActions.RenameListFailure(err));
                })
            );
        })
    );

    @Effect()
    removeListRequest$: Observable<Action> = this.actions$.pipe(
        ofType<listsActions.RemoveList>(listsActions.ActionTypes.REMOVE_LIST),
        map(action => action.payload),
        switchMap(payload => {
            return this._listsService.delete(payload.id, payload.moveToListId, payload.deleteAllReferences).pipe(
                finalize(() => {
                    this.store$.dispatch(new listsActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new listsActions.RemoveListSuccess(payload);
                }),
                catchError(err => {
                    return of(new listsActions.RemoveListFailure(err));
                })
            );
        })
    );
}
