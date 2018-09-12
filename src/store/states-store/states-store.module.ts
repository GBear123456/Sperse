import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StatesStoreEffects } from './effects';
import { statesReducer } from './reducer';
import { CountryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('states', statesReducer),
        EffectsModule.forFeature([ StatesStoreEffects ])
    ],
    providers: [ StatesStoreEffects, CountryServiceProxy ]
})
export class StatesStoreModule {}
