import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { currenciesReducer } from './reducer';
import { CurrenciesStoreEffects } from './effects';
import { EffectsModule } from '@node_modules/@ngrx/effects';
import { CurrencyServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('currencies', currenciesReducer),
        EffectsModule.forFeature([ CurrenciesStoreEffects ])
    ],
    providers: [ CurrenciesStoreEffects, CurrencyServiceProxy ]
})
export class CurrenciesStoreModule {}
