import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { EmailUsageTypesStoreEffects } from '@root/store/email-usage-types-store/effects';
import { emailUsageTypesReducer } from '@root/store/email-usage-types-store/reducer';

@NgModule({
    imports: [
        StoreModule.forFeature('emailUsageTypes', emailUsageTypesReducer),
        EffectsModule.forFeature([ EmailUsageTypesStoreEffects ])
    ],
    providers: [ EmailUsageTypesStoreEffects ]
})
export class EmailUsageTypesStoreModule {}
