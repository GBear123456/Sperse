import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StarsStoreEffects } from '@app/crm/shared/store/stars-store/effects';
import { starsReducer } from '@app/crm/shared/store/stars-store/reducer';
import { CustomerStarsServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('stars', starsReducer),
        EffectsModule.forFeature([ StarsStoreEffects ])
    ],
    providers: [ StarsStoreEffects, CustomerStarsServiceProxy ]
})
export class StarsStoreModule {}
