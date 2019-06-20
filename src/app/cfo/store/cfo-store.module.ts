/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { CurrenciesStoreModule } from '@app/cfo/store/currencies-store';
import { ForecastModelsStoreModule } from '@app/cfo/store/forecast-models-store/forecast-models-store.module';

@NgModule({
    imports: [
        CurrenciesStoreModule,
        ForecastModelsStoreModule
    ],
    declarations: []
})
export class CfoStoreModule {}
