import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StatusesStoreEffects } from 'app/store/statuses-store/effects';
import { statusesReducer } from 'app/store/statuses-store/reducer';
import { ContactServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('statuses', statusesReducer),
        EffectsModule.forFeature([ StatusesStoreEffects ])
    ],
    providers: [ StatusesStoreEffects, ContactServiceProxy ]
})
export class StatusesStoreModule {}
