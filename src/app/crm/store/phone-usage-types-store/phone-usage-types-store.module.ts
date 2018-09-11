import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PhoneUsageTypesStoreEffects } from '@app/crm/store/phone-usage-types-store/effects';
import { phoneUsageTypesReducer } from 'app/crm/store/phone-usage-types-store/reducer';

@NgModule({
    imports: [
        StoreModule.forFeature('phoneUsageTypes', phoneUsageTypesReducer),
        EffectsModule.forFeature([ PhoneUsageTypesStoreEffects ])
    ],
    providers: [ PhoneUsageTypesStoreEffects ]
})
export class PhoneUsageTypesStoreModule {}
