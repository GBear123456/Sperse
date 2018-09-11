import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PipelinesStoreEffects } from 'app/crm/store/pipelines-store/effects';
import { pipelinesReducer } from 'app/crm/store/pipelines-store/reducer';
import { PipelineServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('pipelines', pipelinesReducer),
        EffectsModule.forFeature([ PipelinesStoreEffects ])
    ],
    providers: [ PipelinesStoreEffects, PipelineServiceProxy ]
})
export class PipelinesStoreModule {}
