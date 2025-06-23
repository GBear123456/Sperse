import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StarsStoreEffects } from 'app/store/stars-store/effects';
import { starsReducer } from 'app/store/stars-store/reducer';
import { DictionaryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('stars', starsReducer),
        EffectsModule.forFeature([ StarsStoreEffects ])
    ],
    providers: [StarsStoreEffects, DictionaryServiceProxy ]
})
export class StarsStoreModule {}
