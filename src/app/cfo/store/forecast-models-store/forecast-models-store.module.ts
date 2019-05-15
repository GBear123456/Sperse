import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { forecastModelsReducer } from '@app/cfo/store/forecast-models-store/reducer';
import { ForecastModelsStoreEffects } from '@app/cfo/store/forecast-models-store/effects';
import { EffectsModule } from '@node_modules/@ngrx/effects';
import { CashFlowForecastServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('forecastModels', forecastModelsReducer),
        EffectsModule.forFeature([ ForecastModelsStoreEffects ])
    ],
    providers: [ ForecastModelsStoreEffects, CashFlowForecastServiceProxy ]
})
export class ForecastModelsStoreModule {}
