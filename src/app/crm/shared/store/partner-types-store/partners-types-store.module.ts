import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PartnerTypesStoreEffects } from '@app/crm/shared/store/partner-types-store/effects';
import { PartnerTypesReducer } from '@app/crm/shared/store/partner-types-store/reducer';
import { PartnerServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('partnerTypes', PartnerTypesReducer),
        EffectsModule.forFeature([ PartnerTypesStoreEffects ])
    ],
    providers: [ PartnerTypesStoreEffects, PartnerServiceProxy ]
})
export class PartnerTypesStoreModule {}
