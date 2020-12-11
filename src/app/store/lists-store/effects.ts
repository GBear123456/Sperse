/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, finalize, map, mergeMap, startWith, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import {
    ContactListsServiceProxy, ContactListInfoDto, AddContactsToListsInput,
    UpdateContactListInput, UpdateContactListsInput, DictionaryServiceProxy
} from 'shared/service-proxies/service-proxies';
import * as listsActions from './actions';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';

@Injectable()
export class ListsStoreEffects {
    constructor(private _listsService: ContactListsServiceProxy,
                private _dictionaryService: DictionaryServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private notifyService: NotifyService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<listsActions.LoadRequestAction>(listsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime)) {
                return empty();
            }

            return this._dictionaryService.getLists()
                .pipe(
                    map((lists: ContactListInfoDto[]) => {
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
        mergeMap(payload => {
            let request: Observable<any>;
            if (payload.serviceMethodName === 'addContactsToLists') {
                request = this._listsService[payload.serviceMethodName ](AddContactsToListsInput.fromJS({
                             contactIds: payload.contactIds,
                             lists: payload.lists
                          }));
            } else if (payload.serviceMethodName === 'updateContactLists') {
                request = this._listsService.updateContactLists(UpdateContactListsInput.fromJS({
                             contactId: payload.contactIds[0],
                             lists: payload.lists
                          }));
            } else {
                return of(new listsActions.RenameListFailure('wrong method name'));
            }
            return request.pipe(
                map(() => {
                    this.notifyService.success(payload.successMessage);
                    this.store$.dispatch(new listsActions.AddListSuccess(payload));
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
        mergeMap(payload => {
            return this._listsService.rename(UpdateContactListInput.fromJS({
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
        mergeMap(payload => {
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
