import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SubscriptionsStoreEffects } from 'app/crm/store/subscriptions/effects';
import { subscriptionsReducer } from 'app/crm/store/subscriptions/reducer';
import { PipelineServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('subscriptions', subscriptionsReducer),
        EffectsModule.forFeature([ SubscriptionsStoreEffects ])
    ],
    providers: [ SubscriptionsStoreEffects, PipelineServiceProxy ]
})
export class SubscriptionsStoreModule {}