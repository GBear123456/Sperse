import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { ratingsReducer } from 'app/store/ratings-store/reducer';
import { ContactRatingsServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('ratings', ratingsReducer)
    ],
    providers: [ ContactRatingsServiceProxy ]
})
export class RatingsStoreModule {}
