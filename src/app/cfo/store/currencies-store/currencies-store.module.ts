import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { currenciesReducer } from '@app/cfo/store/currencies-store/reducer';

@NgModule({
    imports: [
        StoreModule.forFeature('currencies', currenciesReducer)
    ]
})
export class CurrenciesStoreModule {}
