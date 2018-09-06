import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { ratingsReducer } from '@app/crm/shared/store/ratings-store/reducer';
import { ContactGroupRatingsServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('ratings', ratingsReducer)
    ],
    providers: [ ContactGroupRatingsServiceProxy ]
})
export class RatingsStoreModule {}
