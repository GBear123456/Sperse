import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StatusesStoreEffects } from 'app/crm/store/statuses-store/effects';
import { statusesReducer } from 'app/crm/store/statuses-store/reducer';
import { ContactGroupServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('statuses', statusesReducer),
        EffectsModule.forFeature([ StatusesStoreEffects ])
    ],
    providers: [ StatusesStoreEffects, ContactGroupServiceProxy ]
})
export class StatusesStoreModule {}
