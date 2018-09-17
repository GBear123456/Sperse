import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PartnerTypesStoreEffects } from '@app/store/partner-types-store/effects';
import { partnerTypesReducer } from '@app/store/partner-types-store/reducer';
import { PartnerServiceProxy, PartnerTypeServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('partnerTypes', partnerTypesReducer),
        EffectsModule.forFeature([ PartnerTypesStoreEffects ])
    ],
    providers: [ PartnerTypesStoreEffects, PartnerServiceProxy, PartnerTypeServiceProxy ]
})
export class PartnerTypesStoreModule {}
