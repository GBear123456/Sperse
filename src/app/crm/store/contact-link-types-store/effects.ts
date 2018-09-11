/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable, of, empty } from 'rxjs';
import { catchError, exhaustMap, map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import * as contactLinkTypesActions from '@app/crm/store/contact-link-types-store/actions';
import { ContactLinkTypeDto, ContactLinkServiceProxy } from 'shared/service-proxies/service-proxies';
import { State } from './state';
import { getLoaded } from './selectors';
import { ListResultDtoOfContactLinkTypeDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ContactLinkTypesStoreEffects {
    constructor(private contactLinkServiceProxy: ContactLinkServiceProxy,
                private actions$: Actions,
                private store$: Store<State>) {}

    @Effect()
    loadRequestEffect$: Observable<Action> = this.actions$.pipe(
        ofType<contactLinkTypesActions.LoadRequestAction>(contactLinkTypesActions.ActionTypes.LOAD_REQUEST),
        withLatestFrom(this.store$.pipe(select(getLoaded))),
        exhaustMap(([action, loaded]) => {

            if (loaded) {
                return empty();
            }

            return this.contactLinkServiceProxy.getContactLinkTypes()
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
