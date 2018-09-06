import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AddressUsageTypesStoreEffects } from '@app/crm/store/address-usage-types-store/effects';
import { addressUsageTypesReducer } from 'app/crm/store/address-usage-types-store/reducer';
import { CountryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('addressUsageTypes', addressUsageTypesReducer),
        EffectsModule.forFeature([ AddressUsageTypesStoreEffects ])
    ],
    providers: [ AddressUsageTypesStoreEffects, CountryServiceProxy ]
})
export class AddressUsageTypesStoreModule {}
