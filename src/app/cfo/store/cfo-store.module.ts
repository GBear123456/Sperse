/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { ForecastModelsStoreModule } from '@app/cfo/store/forecast-models-store/forecast-models-store.module';

@NgModule({
    imports: [
        ForecastModelsStoreModule
    ],
    declarations: []
})
export class CfoStoreModule {}
