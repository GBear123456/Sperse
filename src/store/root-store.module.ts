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
import { EmailUsageTypesStoreModule } from '@root/store/email-usage-types-store';
import { AddressUsageTypesStoreModule } from '@root/store/address-usage-types-store';
import { PhoneUsageTypesStoreModule } from '@root/store/phone-usage-types-store';
import { CountriesStoreModule } from '@root/store/countries-store';
import { LanguagesStoreModule } from '@root/store/languages-store';

/** For storing some entities in local storage */
export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
    const tenantSpecificFeatures = [ 'stars', 'partnerTypes', 'currencies' ];
    return localStorageSync({
        /** entities keys for storing */
        keys: [
            'addressUsageTypes',
            'countries',
            'languages',
            'contactLinkTypes',
            'emailUsageTypes',
            'states',
            'phoneUsageTypes',
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
        EmailUsageTypesStoreModule,
        AddressUsageTypesStoreModule,
        PhoneUsageTypesStoreModule,
        CountriesStoreModule,
        LanguagesStoreModule,
        StoreModule.forRoot({}, { 
            metaReducers: metaReducers,
            runtimeChecks: {
                strictStateImmutability: false,
                strictActionImmutability: false,
            }  
        }),
        EffectsModule.forRoot([]),
        environment.production ? [] :
            StoreDevtoolsModule.instrument({ maxAge: 10 })
    ],
    declarations: []
})
export class RootStoreModule {}
