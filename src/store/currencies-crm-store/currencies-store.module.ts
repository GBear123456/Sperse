<<<<<<< HEAD
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { currenciesReducer } from './reducer';
import { CurrenciesCrmStoreEffects } from './effects';
import { EffectsModule } from '@node_modules/@ngrx/effects';
import { CurrencyServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('currencies-crm', currenciesReducer),
        EffectsModule.forFeature([CurrenciesCrmStoreEffects ])
    ],
    providers: [CurrenciesCrmStoreEffects, CurrencyServiceProxy ]
})
export class CurrenciesCrmStoreModule {}
=======
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { currenciesReducer } from './reducer';
import { CurrenciesCrmStoreEffects } from './effects';
import { EffectsModule } from '@node_modules/@ngrx/effects';
import { CurrencyServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('currencies-crm', currenciesReducer),
        EffectsModule.forFeature([CurrenciesCrmStoreEffects ])
    ],
    providers: [CurrenciesCrmStoreEffects, CurrencyServiceProxy ]
})
export class CurrenciesCrmStoreModule {}
>>>>>>> f999b481882149d107812286d0979872df712626
