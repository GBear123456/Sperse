/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, map, startWith, switchMap, withLatestFrom, finalize } from 'rxjs/operators';

/** Application imports */
import { ContactGroupTagsServiceProxy, ContactGroupTagInfoDto, TagContactGroupsInput, UpdateContactGroupTagInput, UpdateContactGroupTagsInput } from '@shared/service-proxies/service-proxies';
import * as tagsActions from './actions';
import { State } from './state';
import { getLoaded } from './selectors';

@Injectable()
export class TagsStoreEffects {
    constructor(private _tagsService: ContactGroupTagsServiceProxy,
                private actions$: Actions,
                private store$: Store<State>,
                private notifyService: NotifyService) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        startWith(new tagsActions.LoadRequestAction(false)),
        ofType<tagsActions.LoadRequestAction>(tagsActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        switchMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this._tagsService.getTags()
                .pipe(
                    map((tags: ContactGroupTagInfoDto[]) => {
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
        switchMap(payload => {
            let request: Observable<any>;
            if (payload.serviceMethodName === 'tagContactGroups') {
                request = this._tagsService[payload.serviceMethodName ](TagContactGroupsInput.fromJS({
                             contactGroupIds: payload.contactGroupIds,
                             tags: payload.tags
                          }));
            } else if (payload.serviceMethodName === 'updateContactGroupTags') {
                request = this._tagsService.updateContactGroupTags(UpdateContactGroupTagsInput.fromJS({
                             contactGroupId: payload.contactGroupIds[0],
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
        switchMap(payload => {
            return this._tagsService.rename(UpdateContactGroupTagInput.fromJS({
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
        switchMap(payload => {
            return this._tagsService.delete(payload.id, payload.moveToTagId, payload.deleteAllReferences).pipe(
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
