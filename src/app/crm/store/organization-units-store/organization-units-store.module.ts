import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { OrganizationUnitsEffects } from '@app/crm/store/organization-units-store/effects';
import { organizationUnitsReducer } from '@app/crm/store/organization-units-store/reducer';
import { OrganizationUnitServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('organizationUnits', organizationUnitsReducer),
        EffectsModule.forFeature([OrganizationUnitsEffects])
    ],
    providers: [ OrganizationUnitsEffects, OrganizationUnitServiceProxy ]
})
export class OrganizationUnitsStoreModule {}
