/** Core imports */
import { NgModule } from '@angular/core';

/** Third party imports */
import { EffectsModule } from '@ngrx/effects';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { localStorageSync } from 'ngrx-store-localstorage';

/** Application imports */
import { CurrenciesStoreModule } from './currencies-store';
import { StatesStoreModule } from './states-store';
import { environment } from '../environments/environment';

/** For storing some entities in local storage */
export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
    const tenantSpecificFeatures = [ 'pipelines', 'stars', 'partnerTypes', 'currencies' ];
    return localStorageSync({
        /** entities keys for storing */
        keys: [
            'addressUsageTypes',
            'countries',
            'contactLinkTypes',
            'emailUsageTypes',
            'states',
            'phoneUsageTypes',
            'pipelines',
            'stars',
            'ratings',
            'statuses',
            'partnerTypes',
            'organizationTypes',
            'currencies',
            'forecastModels'
        ],
        /** to load entities states from storage instead of their initial state */
        rehydrate: true,
        storage: sessionStorage,
        storageKeySerializer: (key: string) => tenantSpecificFeatures.indexOf(key) > -1 ? key + '_' + abp.session.tenantId : key
    })(reducer);
}

const metaReducers: Array<MetaReducer<any, any>> = [ localStorageSyncReducer ];

@NgModule({
    imports: [
        StatesStoreModule,
        CurrenciesStoreModule,
        StoreModule.forRoot({}, { metaReducers }),
        EffectsModule.forRoot([]),
        environment.production ? [] :
            StoreDevtoolsModule.instrument({ maxAge: 10 })
    ],
    declarations: []
})
export class RootStoreModule {}
