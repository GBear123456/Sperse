import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AddressUsageTypesStoreEffects } from '@app/crm/store/address-usage-types-store/effects';
import { addressUsageTypesReducer } from 'app/crm/store/address-usage-types-store/reducer';

@NgModule({
    imports: [
        StoreModule.forFeature('addressUsageTypes', addressUsageTypesReducer),
        EffectsModule.forFeature([ AddressUsageTypesStoreEffects ])
    ],
    providers: [ AddressUsageTypesStoreEffects ]
})
export class AddressUsageTypesStoreModule {}
