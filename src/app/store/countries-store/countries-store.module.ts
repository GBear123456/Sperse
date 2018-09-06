import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CountriesStoreEffects } from '@app/store/countries-store/effects';
import { countriesReducer } from 'app/store/countries-store/reducer';
import { CountryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('countries', countriesReducer),
        EffectsModule.forFeature([ CountriesStoreEffects ])
    ],
    providers: [ CountriesStoreEffects, CountryServiceProxy ]
})
export class CountriesStoreModule {}
