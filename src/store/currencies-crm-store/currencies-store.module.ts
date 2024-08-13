import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { currenciesReducer } from './reducer';
import { CurrenciesCrmStoreEffects } from './effects';
import { CurrencyCRMService } from './currency.service';
import { EffectsModule } from '@node_modules/@ngrx/effects';
import { CurrencyServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('currencies-crm', currenciesReducer),
        EffectsModule.forFeature([CurrenciesCrmStoreEffects])
    ],
    providers: [CurrenciesCrmStoreEffects, CurrencyServiceProxy, CurrencyCRMService]
})
export class CurrenciesCrmStoreModule { }