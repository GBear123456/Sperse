/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, map, withLatestFrom, finalize, exhaustMap, mergeMap } from 'rxjs/operators';

/** Application imports */
import {
    ContactTagsServiceProxy, ContactTagInfoDto, TagContactsInput,
    UpdateContactTagInput, UpdateContactTagsInput, DictionaryServiceProxy
} from 'shared/service-proxies/service-proxies';
import * as tagsActions from './actions';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { StoreHelper } from '@root/store/store.helper';

@Injectable()
export class TagsStoreEffects {
    constructor(
        private tagsService: ContactTagsServiceProxy,
        private dictionaryService: DictionaryServiceProxy,
        private actions$: Actions,
        private store$: Store<State>,
        private notifyService: NotifyService
    ) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<tagsActions.LoadRequestAction>(tagsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime)) {
                return empty();
            }

            return this.dictionaryService.getTags()
                .pipe(
                    map((tags: ContactTagInfoDto[]) => {
                        return new tagsActions.LoadSuccessAction(tags);
                    }),
                    catchError(err => {
                        return of(new tagsActions.LoadFailureAction(err));
                    })
                );
        })
    );

    @Effect()
    addTagRequest$: Observable<Action> = this.actions$.pipe(
        ofType<tagsActions.AddTag>(tagsActions.ActionTypes.ADD_TAG),
        map(action => action.payload),
        mergeMap(payload => {
            let request: Observable<any>;
            if (payload.serviceMethodName === 'tagContacts') {
                request = this.tagsService[payload.serviceMethodName ](TagContactsInput.fromJS({
                             contactIds: payload.contactIds,
                             tags: payload.tags
                          }));
            } else if (payload.serviceMethodName === 'updateContactTags') {
                request = this.tagsService.updateContactTags(UpdateContactTagsInput.fromJS({
                             contactId: payload.contactIds[0],
                             tags: payload.tags
                          }));
            } else {
                return of(new tagsActions.RenameTagFailure('wrong method name'));
            }
            return request.pipe(
                map(() => {
                    this.notifyService.success(payload.successMessage);
                    /** Reload data from server */
                    return new tagsActions.LoadRequestAction(true);
                }),
                catchError(err => {
                    this.store$.dispatch(new tagsActions.LoadRequestAction(true));
                    return of(new tagsActions.AddTagFailure(err));
                })
            );
        })
    );

    @Effect()
    renameTagRequest$: Observable<Action> = this.actions$.pipe(
        ofType<tagsActions.RenameTag>(tagsActions.ActionTypes.RENAME_TAG),
        map(action => action.payload),
        mergeMap(payload => {
            return this.tagsService.rename(UpdateContactTagInput.fromJS({
                id: payload.id,
                name: payload.name
            })).pipe(
                finalize(() => {
                    /** Reload data from server */
                    this.store$.dispatch(new tagsActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new tagsActions.RenameTagSuccess(payload);
                }),
                catchError(err => {
                    return of(new tagsActions.RenameTagFailure(err));
                })
            );
        })
    );

    @Effect()
    removeTagRequest$: Observable<Action> = this.actions$.pipe(
        ofType<tagsActions.RemoveTag>(tagsActions.ActionTypes.REMOVE_TAG),
        map(action => action.payload),
        mergeMap(payload => {
            return this.tagsService.delete(payload.id, payload.moveToTagId, payload.deleteAllReferences).pipe(
                finalize(() => {
                    /** Reload data from server */
                    this.store$.dispatch(new tagsActions.LoadRequestAction(true));
                }),
                map(() => {
                    return new tagsActions.RemoveTagSuccess(payload);
                }),
                catchError(err => {
                    this.store$.dispatch(new tagsActions.LoadRequestAction(true));
                    return of(new tagsActions.RemoveTagFailure(err));
                })
            );
        })
    );
}
