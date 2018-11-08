/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as contactLinkTypesActions from '@app/store/contact-link-types-store/actions';
import { ContactLinkServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoadedTime } from './selectors';
import { ListResultDtoOfContactLinkTypeDto } from '@shared/service-proxies/service-proxies';
import { StoreHelper } from '@root/store/store.helper';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class ContactLinkTypesStoreEffects {
    constructor(private injector: Injector,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<contactLinkTypesActions.LoadRequestAction>(contactLinkTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoadedTime))),
        exhaustMap(([action, loadedTime]) => {

            if (StoreHelper.dataLoadingIsNotNeeded(loadedTime, AppConsts.generalDictionariesCacheLifetime)) {
                return empty();
            }

            return this.injector.get(ContactLinkServiceProxy).getContactLinkTypes()
                .pipe(
                    map((contactLinkTypes: ListResultDtoOfContactLinkTypeDto) => {
                        return new contactLinkTypesActions.LoadSuccessAction(contactLinkTypes.items);
                    }),
                    catchError(err => {
                        return of(new contactLinkTypesActions.LoadFailureAction(err));
                    })
                );
        })
    );

}
