import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { RatingsStoreEffects } from '@app/crm/shared/store/ratings-store/effects';
import { ratingsReducer } from '@app/crm/shared/store/ratings-store/reducer';
import { ContactGroupRatingsServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('ratings', ratingsReducer),
        EffectsModule.forFeature([ RatingsStoreEffects ])
    ],
    providers: [ RatingsStoreEffects, ContactGroupRatingsServiceProxy ]
})
export class RatingsStoreModule {}
